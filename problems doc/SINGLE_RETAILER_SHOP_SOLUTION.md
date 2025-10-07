# 🔗 Single Retailer Multi-Shop System

## 🚨 **CORRECT BUSINESS MODEL UNDERSTANDING**

### **Your Actual Business Structure:**

```
RETAILER (Head Office/Main Warehouse)
├── Branch Shop 1 (Franchise/Owned)
├── Branch Shop 2 (Franchise/Owned)
├── Branch Shop 3 (Franchise/Owned)
└── Branch Shop N (Franchise/Owned)
```

**NOT** multiple competing retailers - just **ONE retailer with multiple shop branches!**

---

## 🎯 **SIMPLE & CORRECT SOLUTION**

### **Current Issues to Fix:**

1. **Manual Shop ID Entry** - Retailer needs to manually enter shop IDs
2. **No Shop Discovery** - No easy way to see available shops
3. **Inventory Disconnect** - Distribution doesn't auto-update shop inventory

### **Simple Solution: Auto-Registration System**

---

## 📋 **PHASE 1: Auto-Shop Discovery**

When a new shop registers, it becomes automatically available to the retailer for product distribution.

### **1.1 Available Shops API for Retailer**

```javascript
// GET /retailer/shops/available
// Shows all shops not yet connected to retailer
exports.getAvailableShops = async (req, res) => {
  const retailerId = req.retailer.id;

  const availableShops = await prisma.shop.findMany({
    where: {
      // Only show shops not already in retailer's network
      retailerShops: {
        none: {
          retailerId: retailerId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    availableShops,
    message: `${availableShops.length} new shops available for connection`,
  });
};
```

### **1.2 Simple Add Shop to Network**

```javascript
// POST /retailer/shops/add
// Retailer simply adds shop to their distribution network
exports.addShopToNetwork = async (req, res) => {
  const retailerId = req.retailer.id;
  const { shopId, branchType = "FRANCHISE", notes } = req.body;

  // Verify shop exists
  const shop = await prisma.shop.findUnique({
    where: { id: parseInt(shopId) },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      email: true,
    },
  });

  if (!shop) {
    return res.status(404).json({ error: "Shop not found" });
  }

  // Check if already connected
  const existing = await prisma.retailerShop.findUnique({
    where: {
      retailerId_shopId: {
        retailerId: retailerId,
        shopId: parseInt(shopId),
      },
    },
  });

  if (existing) {
    return res.status(400).json({
      error: "Shop already in your network",
      shop: existing,
    });
  }

  // Add shop to retailer network (simple!)
  const retailerShop = await prisma.retailerShop.create({
    data: {
      retailerId: retailerId,
      shopId: parseInt(shopId),
      partnershipType: branchType, // "FRANCHISE", "OWNED", "DEALER"
      isActive: true,
      notes: notes || `Added ${shop.name} to distribution network`,
    },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  res.status(201).json({
    message: `${shop.name} added to your distribution network`,
    shop: retailerShop,
  });
};
```

### **1.3 My Connected Shops List**

```javascript
// GET /retailer/shops/my-network
// Shows all shops in retailer's distribution network
exports.getMyShops = async (req, res) => {
  const retailerId = req.retailer.id;

  const myShops = await prisma.retailerShop.findMany({
    where: {
      retailerId: retailerId,
      isActive: true,
    },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  // Add distribution stats for each shop
  const shopsWithStats = await Promise.all(
    myShops.map(async (rs) => {
      // Get distribution statistics
      const stats = await prisma.shopDistribution.aggregate({
        where: {
          retailerId: retailerId,
          retailerShopId: rs.id,
        },
        _sum: {
          quantity: true,
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get last distribution
      const lastDistribution = await prisma.shopDistribution.findFirst({
        where: {
          retailerId: retailerId,
          retailerShopId: rs.id,
        },
        orderBy: {
          distributionDate: "desc",
        },
        include: {
          retailerProduct: {
            include: { product: true },
          },
        },
      });

      return {
        id: rs.id,
        shop: rs.shop,
        partnershipType: rs.partnershipType,
        joinedAt: rs.joinedAt,
        stats: {
          totalDistributions: stats._count.id || 0,
          totalQuantityDistributed: stats._sum.quantity || 0,
          totalAmountDistributed: stats._sum.totalAmount || 0,
          lastDistribution: lastDistribution
            ? {
                date: lastDistribution.distributionDate,
                product: lastDistribution.retailerProduct.product.name,
                quantity: lastDistribution.quantity,
                amount: lastDistribution.totalAmount,
              }
            : null,
        },
      };
    })
  );

  res.json({
    myShops: shopsWithStats,
    totalShops: shopsWithStats.length,
    message: `You have ${shopsWithStats.length} shops in your distribution network`,
  });
};
```

---

## 📦 **PHASE 2: Simplified Distribution Process**

### **2.1 Enhanced Distribution to Shop**

```javascript
// POST /retailer/distribute-to-shop
// Simple product distribution using direct shop ID
exports.distributeToShop = async (req, res) => {
  const retailerId = req.retailer.id;
  const {
    shopId, // Direct shop ID (much simpler than retailerShopId)
    products, // [{ productId, quantity, unitPrice }]
    notes,
    expectedDeliveryDate,
  } = req.body;

  // Verify shop is in retailer's network
  const retailerShop = await prisma.retailerShop.findFirst({
    where: {
      retailerId: retailerId,
      shop: { id: parseInt(shopId) },
      isActive: true,
    },
    include: {
      shop: {
        select: { id: true, name: true, address: true },
      },
    },
  });

  if (!retailerShop) {
    return res.status(404).json({
      error: "Shop not found in your distribution network",
      hint: "Add the shop to your network first using POST /retailer/shops/add",
    });
  }

  const distributions = [];
  let totalAmount = 0;

  // Process each product
  for (const item of products) {
    const { productId, quantity, unitPrice } = item;

    // Verify retailer has this product with sufficient stock
    const retailerProduct = await prisma.retailerProduct.findFirst({
      where: {
        retailerId: retailerId,
        productId: parseInt(productId),
        isActive: true,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    if (!retailerProduct) {
      return res.status(400).json({
        error: `Product ${productId} not found in your inventory`,
      });
    }

    if (retailerProduct.availableStock < parseInt(quantity)) {
      return res.status(400).json({
        error: `Insufficient stock for ${retailerProduct.product.name}`,
        available: retailerProduct.availableStock,
        requested: parseInt(quantity),
      });
    }

    const itemTotal = parseInt(quantity) * parseFloat(unitPrice);
    totalAmount += itemTotal;

    // Create distribution record
    const distribution = await prisma.shopDistribution.create({
      data: {
        retailerId: retailerId,
        retailerShopId: retailerShop.id,
        retailerProductId: retailerProduct.id,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalAmount: itemTotal,
        deliveryStatus: "PENDING",
        paymentStatus: "PENDING",
        notes,
        expectedDeliveryDate: expectedDeliveryDate
          ? new Date(expectedDeliveryDate)
          : null,
      },
      include: {
        retailerProduct: {
          include: { product: true },
        },
      },
    });

    // Update retailer stock
    await prisma.retailerProduct.update({
      where: { id: retailerProduct.id },
      data: {
        availableStock: { decrement: parseInt(quantity) },
        allocatedStock: { increment: parseInt(quantity) },
      },
    });

    distributions.push({
      distributionId: distribution.id,
      product: retailerProduct.product,
      quantity: distribution.quantity,
      unitPrice: distribution.unitPrice,
      totalAmount: distribution.totalAmount,
    });
  }

  res.status(201).json({
    message: "Products distributed successfully",
    shop: retailerShop.shop,
    distributions,
    totalAmount,
    totalProducts: distributions.length,
  });
};
```

### **2.2 Shop Distribution History**

```javascript
// GET /retailer/shops/:shopId/distributions
// Get all distributions to a specific shop
exports.getShopDistributions = async (req, res) => {
  const { shopId } = req.params;
  const retailerId = req.retailer.id;
  const { status, limit = 20, page = 1 } = req.query;

  // Verify shop belongs to retailer
  const retailerShop = await prisma.retailerShop.findFirst({
    where: {
      retailerId: retailerId,
      shop: { id: parseInt(shopId) },
      isActive: true,
    },
    include: {
      shop: { select: { id: true, name: true, address: true } },
    },
  });

  if (!retailerShop) {
    return res.status(404).json({
      error: "Shop not found in your network",
    });
  }

  const where = {
    retailerId: retailerId,
    retailerShopId: retailerShop.id,
  };

  if (status) {
    where.deliveryStatus = status;
  }

  const distributions = await prisma.shopDistribution.findMany({
    where,
    include: {
      retailerProduct: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
    },
    orderBy: {
      distributionDate: "desc",
    },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  const totalDistributions = await prisma.shopDistribution.count({ where });

  const summary = await prisma.shopDistribution.aggregate({
    where: { retailerId, retailerShopId: retailerShop.id },
    _sum: { quantity: true, totalAmount: true },
    _count: { id: true },
  });

  res.json({
    shop: retailerShop.shop,
    distributions: distributions.map((d) => ({
      id: d.id,
      product: d.retailerProduct.product,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      totalAmount: d.totalAmount,
      deliveryStatus: d.deliveryStatus,
      paymentStatus: d.paymentStatus,
      distributionDate: d.distributionDate,
      expectedDeliveryDate: d.expectedDeliveryDate,
      notes: d.notes,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalDistributions,
      pages: Math.ceil(totalDistributions / parseInt(limit)),
    },
    summary: {
      totalDistributions: summary._count.id,
      totalQuantity: summary._sum.quantity,
      totalAmount: summary._sum.totalAmount,
    },
  });
};
```

---

## 🔧 **PHASE 3: Auto-Inventory Sync (Optional Enhancement)**

### **3.1 Create Stock Receipt When Distributing**

```javascript
// Enhanced distribution with auto stock receipt creation
exports.distributeWithAutoReceipt = async (req, res) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    // ... existing distribution logic ...

    // 🆕 Auto-create stock receipt for shop
    const stockReceipt = await prisma.stockReceipt.create({
      data: {
        shopId: parseInt(shopId),
        productId: parseInt(productId),
        receivedQuantity: parseInt(quantity),
        receivedByStaffId: 1, // System or designated staff
        status: "PENDING", // Shop staff still needs to verify
        supplierName: req.retailer.name,
        deliveryNote: `Distribution from ${req.retailer.name} - Ref: ${distribution.id}`,
        notes: `Auto-generated from retailer distribution`,
      },
    });

    return { distribution, stockReceipt };
  });

  res.status(201).json({
    message: "Products distributed and stock receipt created",
    distribution: transaction.distribution,
    stockReceipt: transaction.stockReceipt,
  });
};
```

---

## 🎯 **IMPLEMENTATION SUMMARY**

### **Frontend Changes Needed:**

#### **Retailer Portal:**

1. **"Available Shops" page** - Shows new shops to add
2. **"Add Shop" button** - Simple form with shop ID
3. **"My Shops" page** - Shows connected shops with stats
4. **Enhanced "Distribute Products"** - Shop dropdown instead of manual ID

#### **Shop Registration:**

1. **Auto-notification** - "Your shop is now available to retailers"
2. **Simple process** - No complex approval workflow needed

### **Database Changes:**

- ✅ **RetailerShop model** already exists
- ✅ **ShopDistribution model** already exists
- ✅ **No new models needed!**

### **API Endpoints to Add:**

```
GET  /retailer/shops/available       - List shops not in network
POST /retailer/shops/add            - Add shop to network
GET  /retailer/shops/my-network     - List connected shops
POST /retailer/distribute-to-shop   - Enhanced distribution
GET  /retailer/shops/:id/distributions - Shop distribution history
```

---

## 🚀 **BENEFITS OF THIS APPROACH**

### **✅ For Retailer:**

- **Easy shop discovery** - See all available shops
- **Simple addition process** - One-click add to network
- **Clear shop management** - View all connected shops
- **Streamlined distribution** - Use shop names instead of IDs
- **Complete tracking** - Full distribution history per shop

### **✅ For Shops:**

- **Automatic availability** - No complex registration with retailer
- **Simple process** - Just register and become available
- **Maintain independence** - No approval workflow complexity
- **Automatic stock receipts** - Products auto-appear for verification

### **✅ For System:**

- **Simple architecture** - No complex approval workflows
- **Uses existing models** - No database changes needed
- **Scalable** - Easy to add more shops
- **Maintainable** - Clear single-retailer model

---

## 🎯 **NEXT STEPS**

1. **Create the API endpoints** above
2. **Update retailer portal frontend**
3. **Add "Available Shops" page**
4. **Enhance distribution interface**
5. **Test with sample data**

This approach is **much simpler** and fits your actual business model perfectly!
