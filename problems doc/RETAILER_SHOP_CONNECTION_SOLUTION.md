# 🔗 Retailer-Shop Connection Solution

## 🚨 **IDENTIFIED PROBLEMS**

### **1. NO REAL CONNECTION EXISTS**

- **Current State**: Retailers exist, Shops exist, but NO connections between them
- **Result**: Cannot track what products retailers send to shops
- **Impact**: Business operations are completely disconnected

### **2. MANUAL CONNECTION PROCESS**

- Retailer must manually add shops using shop IDs
- No discovery mechanism for shops
- No approval process from shop side
- Security vulnerability (any retailer can add any shop)

### **3. INVENTORY SYNC PROBLEMS**

- Retailer distributes products → Only `ShopDistribution` table updated
- Shop inventory (`ShopInventory`) not automatically updated
- Two separate inventory systems with no sync

### **4. NO BIDIRECTIONAL COMMUNICATION**

- Shops cannot see available retailers
- Shops cannot request products from retailers
- Only retailer can initiate distribution

---

## 🎯 **COMPLETE SOLUTION ARCHITECTURE**

### **Phase 1: Shop Discovery & Mutual Connection System**

#### **1.1 Retailer Shop Discovery API**

```javascript
// GET /retailer/discover/shops
// Search for shops by location, type, etc.
exports.discoverShops = async (req, res) => {
  const { city, state, radius, businessType } = req.query;

  const shops = await prisma.shop.findMany({
    where: {
      // Location-based search
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(state && { state: { contains: state, mode: "insensitive" } }),
      ...(businessType && { businessType }),

      // Only show shops not already in network
      NOT: {
        retailerShops: {
          some: {
            retailerId: req.retailer.id,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      businessType: true,
      // Add connection request status
      connectionRequests: {
        where: { retailerId: req.retailer.id },
        select: { status: true, createdAt: true },
      },
    },
  });

  res.json({ shops });
};
```

#### **1.2 Connection Request System**

```javascript
// New Model: ConnectionRequest
model ConnectionRequest {
  id                Int                @id @default(autoincrement())
  retailerId        Int
  retailer          Retailer          @relation(fields: [retailerId], references: [id])
  shopId            Int
  shop              Shop              @relation(fields: [shopId], references: [id])

  // Request details
  status            ConnectionStatus   @default(PENDING)
  message           String?           // Retailer's introduction message
  proposedTerms     Json?             // Proposed partnership terms

  // Approval details
  approvedBy        Int?              // Shop Admin ID who approved
  rejectionReason   String?
  approvedAt        DateTime?

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@unique([retailerId, shopId])
}

enum ConnectionStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

#### **1.3 Shop-Side Connection Management**

```javascript
// Shop Admin Portal: GET /shop-admin/connection-requests
exports.getConnectionRequests = async (req, res) => {
  const shopId = req.user.shopId;

  const requests = await prisma.connectionRequest.findMany({
    where: { shopId },
    include: {
      retailer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          businessType: true,
          // Show retailer's product catalog
          retailerProducts: {
            include: {
              product: {
                select: { name: true, category: true, brand: true },
              },
            },
            take: 10,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ requests });
};

// Shop Admin Portal: PUT /shop-admin/connection-requests/:id/respond
exports.respondToConnectionRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action, rejectionReason, agreementTerms } = req.body; // "approve" or "reject"
  const shopAdminId = req.user.id;

  const request = await prisma.connectionRequest.findFirst({
    where: {
      id: parseInt(requestId),
      shopId: req.user.shopId,
    },
    include: { retailer: true },
  });

  if (!request) {
    return res.status(404).json({ error: "Connection request not found" });
  }

  if (action === "approve") {
    // Update connection request
    await prisma.connectionRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status: "APPROVED",
        approvedBy: shopAdminId,
        approvedAt: new Date(),
      },
    });

    // Create retailer-shop relationship
    const retailerShop = await prisma.retailerShop.create({
      data: {
        retailerId: request.retailerId,
        shopId: request.shopId,
        partnershipType: agreementTerms?.partnershipType || "DEALER",
        commissionRate: agreementTerms?.commissionRate,
        creditLimit: agreementTerms?.creditLimit,
        paymentTerms: agreementTerms?.paymentTerms || "NET_30",
      },
      include: {
        retailer: true,
        shop: true,
      },
    });

    res.json({
      message: "Connection approved successfully",
      partnership: retailerShop,
    });
  } else if (action === "reject") {
    await prisma.connectionRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status: "REJECTED",
        rejectionReason,
      },
    });

    res.json({
      message: "Connection request rejected",
    });
  }
};
```

### **Phase 2: Automatic Inventory Sync System**

#### **2.1 Enhanced Distribution with Auto-Sync**

```javascript
// Enhanced: Retailer distribution with automatic shop inventory update
exports.distributeToShopWithSync = async (req, res) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const {
      retailerShopId,
      distributions,
      autoUpdateShopInventory = true, // New flag
    } = req.body;

    const createdDistributions = [];

    for (const dist of distributions) {
      const { retailerProductId, quantity, unitPrice } = dist;

      // Create distribution record (existing logic)
      const distribution = await prisma.shopDistribution.create({
        data: {
          retailerId: req.retailer.id,
          retailerShopId: parseInt(retailerShopId),
          retailerProductId: parseInt(retailerProductId),
          quantity: parseInt(quantity),
          unitPrice: parseFloat(unitPrice),
          totalAmount: quantity * unitPrice,
          deliveryStatus: "PENDING",
        },
        include: {
          retailerProduct: { include: { product: true } },
          retailerShop: { include: { shop: true } },
        },
      });

      // 🆕 NEW: Auto-create stock receipt for shop
      if (autoUpdateShopInventory) {
        await prisma.stockReceipt.create({
          data: {
            shopId: distribution.retailerShop.shopId,
            productId: distribution.retailerProduct.productId,
            receivedQuantity: quantity,
            receivedByStaffId: 1, // System user or designated receiver
            status: "PENDING", // Shop admin still needs to verify
            supplierName: req.retailer.name,
            deliveryNote: `Distribution from ${req.retailer.name} - Distribution ID: ${distribution.id}`,
            notes: `Auto-generated from retailer distribution`,
          },
        });
      }

      createdDistributions.push(distribution);
    }

    return createdDistributions;
  });

  res.status(201).json({
    message: "Products distributed and stock receipts created",
    distributions: transaction,
  });
};
```

#### **2.2 Delivery Confirmation with Inventory Update**

```javascript
// Enhanced: When retailer marks as delivered, auto-approve stock receipt
exports.updateDeliveryStatusWithSync = async (req, res) => {
  const { distributionId } = req.params;
  const { deliveryStatus, deliveryDate, autoApproveReceipt = false } = req.body;

  const distribution = await prisma.shopDistribution.findFirst({
    where: {
      id: parseInt(distributionId),
      retailerId: req.retailer.id,
    },
    include: {
      retailerProduct: { include: { product: true } },
      retailerShop: { include: { shop: true } },
    },
  });

  if (!distribution) {
    return res.status(404).json({ error: "Distribution not found" });
  }

  const transaction = await prisma.$transaction(async (prisma) => {
    // Update distribution status
    const updatedDistribution = await prisma.shopDistribution.update({
      where: { id: parseInt(distributionId) },
      data: {
        deliveryStatus,
        deliveryDate: deliveryDate
          ? new Date(deliveryDate)
          : deliveryStatus === "DELIVERED"
          ? new Date()
          : undefined,
      },
    });

    // If delivered and auto-approve enabled
    if (deliveryStatus === "DELIVERED" && autoApproveReceipt) {
      // Find related stock receipt
      const stockReceipt = await prisma.stockReceipt.findFirst({
        where: {
          shopId: distribution.retailerShop.shopId,
          productId: distribution.retailerProduct.productId,
          deliveryNote: { contains: `Distribution ID: ${distribution.id}` },
          status: "PENDING",
        },
      });

      if (stockReceipt) {
        // Auto-approve the stock receipt
        await prisma.stockReceipt.update({
          where: { id: stockReceipt.id },
          data: {
            status: "VERIFIED",
            verifiedQuantity: stockReceipt.receivedQuantity,
            verifiedAt: new Date(),
            adminNotes: "Auto-approved on delivery confirmation from retailer",
          },
        });

        // Update shop inventory
        await prisma.shopInventory.upsert({
          where: {
            shopId_productId: {
              shopId: distribution.retailerShop.shopId,
              productId: distribution.retailerProduct.productId,
            },
          },
          update: {
            quantity: { increment: distribution.quantity },
            lastRestockedAt: new Date(),
            supplier: req.retailer.name,
          },
          create: {
            shopId: distribution.retailerShop.shopId,
            productId: distribution.retailerProduct.productId,
            quantity: distribution.quantity,
            supplier: req.retailer.name,
            lastRestockedAt: new Date(),
            costPrice: distribution.unitPrice,
          },
        });

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            shopInventoryId: (
              await prisma.shopInventory.findUnique({
                where: {
                  shopId_productId: {
                    shopId: distribution.retailerShop.shopId,
                    productId: distribution.retailerProduct.productId,
                  },
                },
              })
            ).id,
            type: "STOCK_IN",
            quantity: distribution.quantity,
            reason: `Retailer distribution - ${req.retailer.name}`,
            performedByType: "SYSTEM",
            costPrice: distribution.unitPrice,
            supplier: req.retailer.name,
          },
        });
      }
    }

    return updatedDistribution;
  });

  res.json({
    message: "Delivery status updated and inventory synced",
    distribution: transaction,
  });
};
```

### **Phase 3: Shop Product Request System**

#### **3.1 Shop-to-Retailer Product Requests**

```javascript
// New Model: ProductRequest
model ProductRequest {
  id              Int                 @id @default(autoincrement())
  shopId          Int
  shop            Shop               @relation(fields: [shopId], references: [id])
  retailerId      Int
  retailer        Retailer           @relation(fields: [retailerId], references: [id])
  productId       Int
  product         Product            @relation(fields: [productId], references: [id])

  // Request details
  requestedQuantity Int
  maxPrice        Float?             // Maximum price shop is willing to pay
  urgency         RequestUrgency     @default(NORMAL)
  notes           String?

  // Status tracking
  status          RequestStatus      @default(PENDING)

  // Retailer response
  quotedPrice     Float?
  quotedQuantity  Int?
  availabilityDate DateTime?
  retailerNotes   String?
  respondedAt     DateTime?

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

enum RequestStatus {
  PENDING
  QUOTED
  ACCEPTED
  REJECTED
  FULFILLED
  CANCELLED
}

enum RequestUrgency {
  LOW
  NORMAL
  HIGH
  URGENT
}

// Shop Admin: Request products from connected retailers
exports.requestProductFromRetailer = async (req, res) => {
  const shopId = req.user.shopId;
  const {
    retailerId,
    productId,
    requestedQuantity,
    maxPrice,
    urgency = "NORMAL",
    notes
  } = req.body;

  // Verify retailer connection
  const connection = await prisma.retailerShop.findFirst({
    where: {
      retailerId: parseInt(retailerId),
      shopId: shopId,
      isActive: true
    }
  });

  if (!connection) {
    return res.status(400).json({
      error: "No active connection with this retailer"
    });
  }

  // Check if retailer has this product
  const retailerProduct = await prisma.retailerProduct.findFirst({
    where: {
      retailerId: parseInt(retailerId),
      productId: parseInt(productId),
      isActive: true
    },
    include: { product: true }
  });

  if (!retailerProduct) {
    return res.status(400).json({
      error: "Retailer does not have this product in inventory"
    });
  }

  const productRequest = await prisma.productRequest.create({
    data: {
      shopId,
      retailerId: parseInt(retailerId),
      productId: parseInt(productId),
      requestedQuantity: parseInt(requestedQuantity),
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      urgency,
      notes
    },
    include: {
      product: true,
      retailer: { select: { name: true, email: true } },
      shop: { select: { name: true, email: true } }
    }
  });

  res.status(201).json({
    message: "Product request sent to retailer",
    request: productRequest
  });
};

// Retailer: View and respond to product requests
exports.getProductRequests = async (req, res) => {
  const retailerId = req.retailer.id;
  const { status, urgency, shopId } = req.query;

  const where = { retailerId };
  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (shopId) where.shopId = parseInt(shopId);

  const requests = await prisma.productRequest.findMany({
    where,
    include: {
      product: true,
      shop: {
        select: { id: true, name: true, email: true, phone: true }
      },
      retailerProduct: {
        select: {
          availableStock: true,
          wholesalePrice: true,
          minSellingPrice: true
        }
      }
    },
    orderBy: [
      { urgency: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.json({ requests });
};

exports.respondToProductRequest = async (req, res) => {
  const { requestId } = req.params;
  const {
    action, // "quote", "reject", "fulfill"
    quotedPrice,
    quotedQuantity,
    availabilityDate,
    retailerNotes
  } = req.body;

  const request = await prisma.productRequest.findFirst({
    where: {
      id: parseInt(requestId),
      retailerId: req.retailer.id
    }
  });

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  let updateData = {
    respondedAt: new Date(),
    retailerNotes
  };

  if (action === "quote") {
    updateData = {
      ...updateData,
      status: "QUOTED",
      quotedPrice: parseFloat(quotedPrice),
      quotedQuantity: parseInt(quotedQuantity),
      availabilityDate: availabilityDate ? new Date(availabilityDate) : null
    };
  } else if (action === "reject") {
    updateData = {
      ...updateData,
      status: "REJECTED"
    };
  } else if (action === "fulfill") {
    updateData = {
      ...updateData,
      status: "FULFILLED"
    };

    // Auto-create distribution when fulfilling
    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        retailerId: req.retailer.id,
        shopId: request.shopId
      }
    });

    if (retailerShop) {
      await prisma.shopDistribution.create({
        data: {
          retailerId: req.retailer.id,
          retailerShopId: retailerShop.id,
          retailerProductId: (await prisma.retailerProduct.findFirst({
            where: {
              retailerId: req.retailer.id,
              productId: request.productId
            }
          })).id,
          quantity: quotedQuantity || request.requestedQuantity,
          unitPrice: quotedPrice,
          totalAmount: (quotedQuantity || request.requestedQuantity) * quotedPrice,
          notes: `Fulfilling product request #${request.id}`
        }
      });
    }
  }

  const updatedRequest = await prisma.productRequest.update({
    where: { id: parseInt(requestId) },
    data: updateData,
    include: {
      product: true,
      shop: { select: { name: true } }
    }
  });

  res.json({
    message: `Request ${action}ed successfully`,
    request: updatedRequest
  });
};
```

### **Phase 4: Complete Integration Dashboard**

#### **4.1 Retailer Dashboard Enhancement**

```javascript
// Enhanced retailer dashboard with connection analytics
exports.getEnhancedDashboard = async (req, res) => {
  const retailerId = req.retailer.id;

  // Connection metrics
  const connectionStats = await prisma.retailerShop.aggregate({
    where: { retailerId },
    _count: { id: true },
  });

  const pendingRequests = await prisma.connectionRequest.count({
    where: { retailerId, status: "PENDING" },
  });

  // Product request metrics
  const productRequestStats = await prisma.productRequest.groupBy({
    by: ["status"],
    where: { retailerId },
    _count: { id: true },
  });

  // Distribution analytics by shop
  const shopPerformance = await prisma.shopDistribution.groupBy({
    by: ["retailerShopId"],
    where: {
      retailerId,
      distributionDate: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    _sum: {
      quantity: true,
      totalAmount: true,
    },
    _count: { id: true },
  });

  // Map shop details
  const shopsWithPerformance = await Promise.all(
    shopPerformance.map(async (sp) => {
      const retailerShop = await prisma.retailerShop.findUnique({
        where: { id: sp.retailerShopId },
        include: { shop: true },
      });

      return {
        shop: retailerShop.shop,
        performance: {
          totalOrders: sp._count.id,
          totalQuantity: sp._sum.quantity,
          totalRevenue: sp._sum.totalAmount,
        },
      };
    })
  );

  res.json({
    connections: {
      totalShops: connectionStats._count.id,
      pendingRequests,
    },
    productRequests: productRequestStats.reduce((acc, pr) => {
      acc[pr.status] = pr._count.id;
      return acc;
    }, {}),
    topPerformingShops: shopsWithPerformance
      .sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue)
      .slice(0, 5),
  });
};
```

#### **4.2 Shop Dashboard Enhancement**

```javascript
// Enhanced shop admin dashboard with retailer connections
exports.getEnhancedShopDashboard = async (req, res) => {
  const shopId = req.user.shopId;

  // Connected retailers
  const connectedRetailers = await prisma.retailerShop.findMany({
    where: { shopId, isActive: true },
    include: {
      retailer: {
        select: {
          id: true,
          name: true,
          businessType: true,
          // Recent distributions
          shopDistributions: {
            where: { retailerShopId: shopId },
            orderBy: { distributionDate: "desc" },
            take: 5,
            include: {
              retailerProduct: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  // Pending stock receipts from retailers
  const pendingStockReceipts = await prisma.stockReceipt.count({
    where: {
      shopId,
      status: "PENDING",
      supplierName: { not: null }, // From retailers
    },
  });

  // Product requests status
  const productRequestStats = await prisma.productRequest.groupBy({
    by: ["status"],
    where: { shopId },
    _count: { id: true },
  });

  // Pending connection requests
  const pendingConnections = await prisma.connectionRequest.count({
    where: { shopId, status: "PENDING" },
  });

  res.json({
    retailerConnections: {
      totalRetailers: connectedRetailers.length,
      pendingConnectionRequests: pendingConnections,
      retailers: connectedRetailers.map((rs) => ({
        ...rs.retailer,
        partnership: {
          type: rs.partnershipType,
          creditLimit: rs.creditLimit,
          joinedAt: rs.joinedAt,
        },
      })),
    },
    inventory: {
      pendingStockReceipts,
    },
    productRequests: productRequestStats.reduce((acc, pr) => {
      acc[pr.status] = pr._count.id;
      return acc;
    }, {}),
  });
};
```

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Immediate Actions (Week 1)**

1. ✅ **Create connection request system**
2. ✅ **Implement shop discovery for retailers**
3. ✅ **Add approval workflow for shop admins**

### **Short-term (Week 2-3)**

1. ✅ **Enhanced distribution with auto-sync**
2. ✅ **Stock receipt auto-creation**
3. ✅ **Delivery confirmation with inventory update**

### **Medium-term (Week 4-6)**

1. ✅ **Product request system (shop → retailer)**
2. ✅ **Quote management**
3. ✅ **Enhanced dashboards**

### **Long-term (Month 2)**

1. ✅ **Analytics and reporting**
2. ✅ **Mobile app integration**
3. ✅ **Automated reorder suggestions**

---

## 📊 **EXPECTED OUTCOMES**

After implementing this solution:

### **✅ For Retailers:**

- **Discover shops** in their area automatically
- **Track all distributions** to each shop precisely
- **Receive product requests** from shops
- **Manage partnerships** with approval workflows
- **Monitor shop performance** in real-time

### **✅ For Shops:**

- **Choose from available retailers** in their network
- **Request specific products** when needed
- **Auto-receive stock** when retailer delivers
- **Manage multiple retailer relationships**
- **Track supplier performance**

### **✅ For System:**

- **Perfect inventory sync** between retailer and shop
- **Complete audit trail** of all product movements
- **Secure connection management**
- **Bidirectional communication**
- **Real-time tracking and analytics**

---

## 🎯 **NEXT STEPS**

1. **Analyze current code** to identify integration points
2. **Create database migrations** for new models
3. **Implement Phase 1** (connection system) first
4. **Test with sample data** before production
5. **Gradual rollout** to existing users

Would you like me to start implementing any specific phase of this solution?
