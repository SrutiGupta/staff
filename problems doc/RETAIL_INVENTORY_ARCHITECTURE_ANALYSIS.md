# 🏪 Retail Multi-Shop Inventory Architecture Analysis & Solution

## 📋 Current System Overview

### Business Structure

```
RETAILER (Main Business Owner)
├── Shop 1 (Location A)
│   ├── Shop Admin Portal
│   ├── Staff Portal
│   └── Doctor Portal
├── Shop 2 (Location B)
│   ├── Shop Admin Portal
│   ├── Staff Portal
│   └── Doctor Portal
└── Shop 3 (Location C)
    ├── Shop Admin Portal
    ├── Staff Portal
    └── Doctor Portal
```

## 🔍 Critical Issue Discovered

### **DUAL INVENTORY SYSTEM PROBLEM**

Your system currently has **TWO SEPARATE** inventory models that **DO NOT SYNC**:

#### 1. **Legacy Staff Inventory Model**

```prisma
model Inventory {
  id        Int      @id @default(autoincrement())
  product   Product  @relation(fields: [productId], references: [id])
  productId Int      @unique  // ❌ ONE RECORD PER PRODUCT GLOBALLY
  quantity  Int
}
```

#### 2. **Shop Admin Inventory Model**

```prisma
model ShopInventory {
  id              Int      @id @default(autoincrement())
  shopId          Int
  shop            Shop     @relation(fields: [shopId], references: [id])
  productId       Int
  product         Product  @relation(fields: [productId], references: [id])
  quantity        Int
  // ... other shop-specific fields

  @@unique([shopId, productId])  // ✅ ONE RECORD PER PRODUCT PER SHOP
}
```

### **The Problem:**

- **Staff Portal** uses `Inventory` (global, single record per product)
- **Shop Admin Portal** uses `ShopInventory` (shop-specific, multiple records per product)
- **NO SYNCHRONIZATION** between these systems
- When staff stock in/out products → Only `Inventory` table updates
- When shop admin stock in/out products → Only `ShopInventory` table updates

---

## 🎯 **SECURE STOCK RECEIPT MODEL SOLUTION**

### **NEW ARCHITECTURE: Secure Stock Receipt Workflow**

Instead of allowing direct stock manipulation, we implement a secure **Stock Receipt** system that maintains audit trails and prevents fraud while still involving staff in the receiving process.

#### **How It Works:**

```
1. STOCK ARRIVES → 2. STAFF CREATES RECEIPT → 3. ADMIN VERIFIES → 4. SYSTEM UPDATES
   ┌─────────────┐    ┌─────────────────────┐    ┌───────────────┐    ┌─────────────────┐
   │   Retailer  │───▶│ Staff: "I received  │───▶│ Admin: Check  │───▶│ ShopInventory   │
   │ delivers    │    │ 50 units of         │    │ physical      │    │ quantity        │
   │ products    │    │ Product X"          │    │ stock & approve│    │ updated         │
   └─────────────┘    └─────────────────────┘    └───────────────┘    └─────────────────┘
```

### **Enhanced Schema with Stock Receipt Model**

```prisma
// ❌ DELETE LEGACY INVENTORY MODEL
// model Inventory {
//   id        Int      @id @default(autoincrement())
//   product   Product  @relation(fields: [productId], references: [id])
//   productId Int      @unique
//   quantity  Int
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }

// ✅ NEW: Stock Receipt Model (Staff creates, Admin approves)
model StockReceipt {
  id                Int               @id @default(autoincrement())
  shopId            Int
  shop              Shop              @relation(fields: [shopId], references: [id])
  productId         Int
  product           Product           @relation(fields: [productId], references: [id])

  // Receipt Details
  receivedQuantity  Int               // What staff says they received
  verifiedQuantity  Int?              // What admin verified (after physical check)

  // Staff Information (Who received)
  receivedByStaffId Int
  receivedByStaff   Staff             @relation(fields: [receivedByStaffId], references: [id])
  receivedAt        DateTime          @default(now())

  // Admin Information (Who verified)
  verifiedByAdminId Int?
  verifiedByAdmin   ShopAdmin?        @relation(fields: [verifiedByAdminId], references: [id])
  verifiedAt        DateTime?

  // Status & Tracking
  status            ReceiptStatus     @default(PENDING)
  supplierName      String?           // Where it came from
  deliveryNote      String?           // Delivery reference
  batchNumber       String?           // Product batch
  expiryDate        DateTime?         // For items with expiry

  // Admin Notes
  adminNotes        String?           // Discrepancy notes
  discrepancyReason String?           // Why quantities differ

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

enum ReceiptStatus {
  PENDING           // Staff created, waiting admin verification
  VERIFIED          // Admin verified, stock updated
  DISCREPANCY       // Verified quantity differs from received
  REJECTED          // Admin rejected the receipt
  CANCELLED         // Staff cancelled before verification
}

// ✅ ENHANCED: Shop Inventory Model
model ShopInventory {
  id              Int             @id @default(autoincrement())
  shopId          Int
  shop            Shop            @relation(fields: [shopId], references: [id])
  productId       Int
  product         Product         @relation(fields: [productId], references: [id])
  quantity        Int             @default(0)

  // Stock Management
  minThreshold    Int             @default(10)
  maxThreshold    Int             @default(100)
  reorderLevel    Int             @default(20)

  // Pricing (Admin controlled)
  costPrice       Float?          // Purchase cost from retailer
  sellingPrice    Float?          // Shop-specific pricing override

  // Supplier & Batch Tracking
  supplier        String?         // Primary supplier
  lastRestockedAt DateTime?       // Last time stock was added
  lastSoldAt      DateTime?       // Last sale timestamp

  // Audit Trail
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relationships
  stockMovements  StockMovement[]

  @@unique([shopId, productId])
}

// ✅ ENHANCED: Stock Movement Model (Complete Audit Trail)
model StockMovement {
  id                Int           @id @default(autoincrement())
  shopInventoryId   Int
  shopInventory     ShopInventory @relation(fields: [shopInventoryId], references: [id])

  // Movement Details
  type              MovementType
  quantity          Int
  previousQty       Int
  newQty            Int

  // Who & When
  staffId           Int?
  staff             Staff?        @relation(fields: [staffId], references: [id])
  adminId           Int?
  admin             ShopAdmin?    @relation(fields: [adminId], references: [id])

  // Reference Information
  reason            String?       // "STOCK_IN", "SALE", "DAMAGE", "RETURN", "ADJUSTMENT"
  invoiceId         String?       // Link to sale invoice if type is STOCK_OUT
  stockReceiptId    Int?          // Link to stock receipt if type is STOCK_IN

  // Additional Details
  supplierName      String?       // For STOCK_IN movements
  batchNo           String?
  expiryDate        DateTime?
  notes             String?

  createdAt         DateTime      @default(now())
}

// ✅ UPDATE: Enhanced Movement Types
enum MovementType {
  STOCK_IN          // From approved stock receipt
  STOCK_OUT         // From sales
  ADJUSTMENT        // Admin manual adjustment
  DAMAGE            // Damaged goods removal
  RETURN            // Customer returns
  TRANSFER_OUT      // Transfer to another shop
  TRANSFER_IN       // Transfer from another shop
  LOSS              // Theft/loss write-off
  RECOUNT           // Physical count adjustment
}

// ✅ UPDATE: Enhanced Models with StockReceipt relationships
model Shop {
  id          Int      @id @default(autoincrement())
  name        String
  address     String
  phone       String?
  email       String?
  licenseNo   String?
  gstNo       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  admins        ShopAdmin[]
  staff         Staff[]
  inventory     ShopInventory[]
  stockReceipts StockReceipt[]  // ✅ NEW
  patients      Patient[]
  customers     Customer[]

  // Business settings
  lowStockThreshold Int @default(10)
  currency          String @default("INR")
  timezone          String @default("Asia/Kolkata")
}

model Staff {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  name        String?
  password    String
  shopId      Int          @default(1)
  shop        Shop         @relation(fields: [shopId], references: [id])
  role        StaffRole    @default(SALES_STAFF)
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  attendances     Attendance[]
  invoices        Invoice[]
  stockMovements  StockMovement[]
  patientVisits   PatientVisit[]
  stockReceipts   StockReceipt[]  // ✅ NEW: Staff can create receipts
}

model ShopAdmin {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  password    String
  role        AdminRole @default(SHOP_OWNER)
  shopId      Int
  shop        Shop     @relation(fields: [shopId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Audit trails
  auditLogs      AuditLog[]
  reports        Report[]
  stockMovements StockMovement[]  // ✅ NEW: Admin stock movements
  verifiedReceipts StockReceipt[] // ✅ NEW: Admin verifies receipts
}

model Product {
  id           Int           @id @default(autoincrement())
  name         String
  description  String?
  basePrice    Float         // Retailer's base price (not shop selling price)
  barcode      String?       @unique
  sku          String?       @unique

  // Eyewear categorization
  eyewearType  EyewearType
  frameType    FrameType?

  // Company/Brand information
  company      Company       @relation(fields: [companyId], references: [id])
  companyId    Int

  // Additional attributes
  material     String?
  color        String?
  size         String?
  model        String?

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relationships (REMOVE legacy inventory)
  // inventory    Inventory[]  // ❌ REMOVED
  invoiceItems   InvoiceItem[]
  shopInventory  ShopInventory[]
  stockReceipts  StockReceipt[]  // ✅ NEW
  performance    ProductPerformance[]
}
```

---

## 🔒 **SECURE WORKFLOW IMPLEMENTATION**

### **Phase 1: Staff Stock Receipt Creation**

```javascript
// ✅ NEW: Staff Controller - Create Stock Receipt (NOT direct stock in)
exports.createStockReceipt = async (req, res) => {
  const {
    productId,
    receivedQuantity,
    supplierName,
    deliveryNote,
    batchNumber,
  } = req.body;
  const staffId = req.user.id;
  const shopId = req.user.shopId;

  try {
    // Staff can only create receipt, NOT update inventory
    const stockReceipt = await prisma.stockReceipt.create({
      data: {
        shopId,
        productId,
        receivedQuantity: parseInt(receivedQuantity),
        receivedByStaffId: staffId,
        supplierName,
        deliveryNote,
        batchNumber,
        status: "PENDING", // Requires admin verification
      },
      include: {
        product: true,
        receivedByStaff: { select: { name: true } },
      },
    });

    res.status(201).json({
      message:
        "Stock receipt created successfully. Waiting for admin verification.",
      receipt: stockReceipt,
      nextStep: "Admin must verify this receipt before inventory is updated",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create stock receipt" });
  }
};

// ✅ NEW: Staff can view their pending receipts
exports.getMyStockReceipts = async (req, res) => {
  const staffId = req.user.id;

  const receipts = await prisma.stockReceipt.findMany({
    where: { receivedByStaffId: staffId },
    include: {
      product: true,
      verifiedByAdmin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(receipts);
};
```

### **Phase 2: Shop Admin Verification & Approval**

```javascript
// ✅ NEW: Shop Admin Controller - Verify and Approve Stock Receipts
exports.verifyStockReceipt = async (req, res) => {
  const { receiptId } = req.params;
  const { verifiedQuantity, adminNotes, action } = req.body; // action: 'approve', 'reject', 'adjust'
  const adminId = req.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the receipt
      const receipt = await tx.stockReceipt.findUnique({
        where: { id: parseInt(receiptId) },
        include: { product: true },
      });

      if (!receipt || receipt.status !== "PENDING") {
        throw new Error("Receipt not found or already processed");
      }

      const actualQuantity =
        parseInt(verifiedQuantity) || receipt.receivedQuantity;
      const hasDiscrepancy = actualQuantity !== receipt.receivedQuantity;

      // Update the receipt with verification details
      const updatedReceipt = await tx.stockReceipt.update({
        where: { id: parseInt(receiptId) },
        data: {
          verifiedQuantity: actualQuantity,
          verifiedByAdminId: adminId,
          verifiedAt: new Date(),
          status:
            action === "reject"
              ? "REJECTED"
              : hasDiscrepancy
              ? "DISCREPANCY"
              : "VERIFIED",
          adminNotes,
          discrepancyReason: hasDiscrepancy
            ? `Staff reported ${receipt.receivedQuantity}, Admin verified ${actualQuantity}`
            : null,
        },
      });

      // Only update inventory if approved (not rejected)
      if (action !== "reject" && actualQuantity > 0) {
        // Update shop inventory
        const inventory = await tx.shopInventory.upsert({
          where: {
            shopId_productId: {
              shopId: receipt.shopId,
              productId: receipt.productId,
            },
          },
          update: {
            quantity: { increment: actualQuantity },
            lastRestockedAt: new Date(),
          },
          create: {
            shopId: receipt.shopId,
            productId: receipt.productId,
            quantity: actualQuantity,
            supplier: receipt.supplierName,
          },
        });

        // Create stock movement record for audit trail
        await tx.stockMovement.create({
          data: {
            shopInventoryId: inventory.id,
            type: "STOCK_IN",
            quantity: actualQuantity,
            previousQty: inventory.quantity - actualQuantity,
            newQty: inventory.quantity,
            adminId: adminId,
            reason: "STOCK_IN_VERIFIED",
            stockReceiptId: receipt.id,
            supplierName: receipt.supplierName,
            batchNo: receipt.batchNumber,
            notes: hasDiscrepancy
              ? `Discrepancy: Staff ${receipt.receivedQuantity}, Verified ${actualQuantity}`
              : `Verified stock receipt from ${receipt.supplierName}`,
          },
        });
      }

      return updatedReceipt;
    });

    res.json({
      message:
        action === "reject"
          ? "Stock receipt rejected"
          : "Stock receipt verified and inventory updated",
      receipt: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ NEW: Get all pending receipts for admin review
exports.getPendingStockReceipts = async (req, res) => {
  const shopId = req.user.shopId;

  const pendingReceipts = await prisma.stockReceipt.findMany({
    where: {
      shopId,
      status: "PENDING",
    },
    include: {
      product: true,
      receivedByStaff: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" }, // Oldest first
  });

  res.json(pendingReceipts);
};
```

### **Phase 3: Enhanced Audit & Reporting**

```javascript
// ✅ NEW: Complete audit trail for all stock movements
exports.getStockAuditReport = async (req, res) => {
  const { startDate, endDate, productId } = req.query;
  const shopId = req.user.shopId;

  const auditData = await prisma.stockMovement.findMany({
    where: {
      shopInventory: { shopId },
      ...(productId && { shopInventory: { productId: parseInt(productId) } }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    },
    include: {
      shopInventory: { include: { product: true } },
      staff: { select: { name: true } },
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    auditTrail: auditData.map((movement) => ({
      date: movement.createdAt,
      product: movement.shopInventory.product.name,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousQty,
      newStock: movement.newQty,
      performedBy: movement.staff?.name || movement.admin?.name,
      role: movement.staff ? "Staff" : "Admin",
      reason: movement.reason,
      notes: movement.notes,
      reference: movement.stockReceiptId
        ? `Receipt #${movement.stockReceiptId}`
        : movement.invoiceId,
    })),
  });
};

// ✅ NEW: Staff performance on stock receipts
exports.getStaffReceiptPerformance = async (req, res) => {
  const shopId = req.user.shopId;

  const staffPerformance = await prisma.staff.findMany({
    where: { shopId },
    include: {
      stockReceipts: {
        include: {
          _count: true,
        },
      },
    },
  });

  const performanceData = staffPerformance.map((staff) => {
    const receipts = staff.stockReceipts;
    const total = receipts.length;
    const verified = receipts.filter((r) => r.status === "VERIFIED").length;
    const discrepancies = receipts.filter(
      (r) => r.status === "DISCREPANCY"
    ).length;
    const rejected = receipts.filter((r) => r.status === "REJECTED").length;

    return {
      staffName: staff.name,
      totalReceipts: total,
      verifiedReceipts: verified,
      discrepancyRate:
        total > 0 ? ((discrepancies / total) * 100).toFixed(2) + "%" : "0%",
      rejectionRate:
        total > 0 ? ((rejected / total) * 100).toFixed(2) + "%" : "0%",
      accuracyRate:
        total > 0 ? ((verified / total) * 100).toFixed(2) + "%" : "0%",
    };
  });

  res.json(performanceData);
};
```

---

## �️ **SECURITY & CONTROL BENEFITS**

### **✅ What This Secure Model Achieves:**

1. **🔒 PREVENTS DIRECT MANIPULATION**: Staff cannot directly modify inventory numbers
2. **👥 CLEAR ACCOUNTABILITY**: Every stock receipt shows who received and who verified
3. **📊 COMPLETE AUDIT TRAIL**: Full chain of custody from delivery to inventory update
4. **🚫 FRAUD PREVENTION**: No "phantom stock" can be added without physical verification
5. **⚖️ DISCREPANCY TRACKING**: System flags when staff-reported vs admin-verified quantities differ
6. **🏪 MULTI-SHOP READY**: Each shop maintains independent but auditable inventory

### **🔍 Comparison: Before vs After**

| **Aspect**               | **Before (Insecure)**               | **After (Secure Stock Receipt)**                           |
| ------------------------ | ----------------------------------- | ---------------------------------------------------------- |
| **Stock In Process**     | ❌ Staff directly updates inventory | ✅ Staff creates receipt → Admin verifies → System updates |
| **Audit Trail**          | ❌ Limited/unreliable               | ✅ Complete chain of custody                               |
| **Fraud Prevention**     | ❌ Staff can add phantom stock      | ✅ Admin must physically verify all stock                  |
| **Accountability**       | ❌ Unclear who did what             | ✅ Clear record of receiver & verifier                     |
| **Discrepancy Handling** | ❌ No systematic tracking           | ✅ Automatic flagging and documentation                    |
| **Multi-Shop Support**   | ❌ Global inventory conflicts       | ✅ Shop-specific with proper relationships                 |

---

## 📊 **SECURE DATA FLOW**

### **New Secure Workflow: Stock Receipt Model**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. DELIVERY    │───▶│  2. STAFF       │───▶│  3. ADMIN       │───▶│  4. SYSTEM      │
│                 │    │     RECEIPT     │    │     VERIFY      │    │     UPDATE      │
│ Retailer sends  │    │                 │    │                 │    │                 │
│ 50 units of     │    │ Staff: "I       │    │ Admin: Physical │    │ ShopInventory   │
│ Product X to    │    │ received 50     │    │ count confirms  │    │ +50 units       │
│ Shop 1          │    │ units"          │    │ 48 units only"  │    │ +48 units       │
│                 │    │                 │    │                 │    │ (Discrepancy    │
│ Status: PENDING │    │ Status: PENDING │    │ Status:         │    │ flagged)        │
│                 │    │                 │    │ DISCREPANCY     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Stock Movement Types in New System:**

1. **STOCK_IN** - From approved stock receipt (Admin verified)
2. **STOCK_OUT** - From sales (Staff processes, auto-updates)
3. **ADJUSTMENT** - Admin manual correction
4. **DISCREPANCY** - Difference between receipt and verification
5. **DAMAGE** - Admin records damaged goods
6. **RETURN** - Customer returns (Staff processes)
7. **TRANSFER** - Between shops (Admin to Admin)
8. **LOSS** - Theft/loss write-off (Admin only)

---

## 🔧 **IMPLEMENTATION PLAN**

### **Phase 1: Schema Migration (Week 1)**

```bash
# 1. Create new StockReceipt model migration
npx prisma migrate dev --name "add_stock_receipt_system"

# 2. Remove legacy Inventory model
npx prisma migrate dev --name "remove_legacy_inventory"

# 3. Enhanced relationships
npx prisma migrate dev --name "enhance_audit_relationships"
```

### **Phase 2: Controller Implementation (Week 2)**

1. **✅ NEW: Staff Controllers**

   - `createStockReceipt()` - Staff acknowledges delivery
   - `getMyStockReceipts()` - Staff views their receipts
   - `cancelStockReceipt()` - Staff can cancel pending receipts

2. **✅ NEW: Shop Admin Controllers**

   - `getPendingStockReceipts()` - Admin review queue
   - `verifyStockReceipt()` - Admin verification workflow
   - `getStockAuditReport()` - Complete audit trail

3. **✅ UPDATE: Sales Controllers**
   - Update `invoiceController.js` to use `ShopInventory`
   - Update `customerController.js` to use `ShopInventory`

### **Phase 3: UI/UX Implementation (Week 3)**

1. **� Staff Interface**

   - Stock receipt creation form
   - Barcode scanning for quick receipt creation
   - Pending receipts dashboard

2. **🖥️ Shop Admin Interface**
   - Pending receipts queue with alerts
   - One-click verification workflow
   - Discrepancy management tools

### **Phase 4: Testing & Deployment (Week 4)**

1. **🧪 Unit Testing**

   - Test all stock receipt workflows
   - Test audit trail generation
   - Test discrepancy handling

2. **🔍 Integration Testing**
   - Multi-shop scenarios
   - Concurrent receipt processing
   - Performance under load

---

## 🎯 **EXPECTED OUTCOMES**

### **✅ Security Improvements:**

- **100% audit trail** for all stock movements
- **Zero phantom stock** additions possible
- **Clear accountability** for all inventory changes
- **Systematic discrepancy tracking**
- **Fraud prevention** through mandatory verification

### **✅ Operational Benefits:**

- **Staff involvement** in receiving process (motivated)
- **Admin oversight** of all inventory changes (controlled)
- **Automatic alerts** for pending verifications (efficient)
- **Performance tracking** for staff accuracy (quality)
- **Multi-shop ready** architecture (scalable)

### **✅ Compliance Benefits:**

- **Complete audit compliance** for inventory management
- **Clear chain of custody** for all products
- **Documented discrepancy resolution** procedures
- **Role-based access control** implementation
- **Financial audit trail** for stock valuation

---

## 📋 **MIGRATION CHECKLIST**

### **Data Migration:**

- [ ] Export existing `Inventory` data
- [ ] Create corresponding `ShopInventory` records for Shop 1
- [ ] Verify data integrity after migration
- [ ] Remove legacy `Inventory` model

### **Controller Updates:**

- [ ] Remove `inventoryController.updateStockByBarcode()`
- [ ] Remove `inventoryController.addProduct()`
- [ ] Create `stockReceiptController.js`
- [ ] Update `invoiceController.js` for `ShopInventory`
- [ ] Update `customerController.js` for `ShopInventory`

### **Route Configuration:**

- [ ] Remove staff inventory modification routes
- [ ] Add stock receipt routes for staff
- [ ] Add stock verification routes for admin
- [ ] Add audit report routes for admin

### **Permission Implementation:**

- [ ] Add `requireShopAdmin` middleware
- [ ] Restrict product creation to admin only
- [ ] Restrict price changes to admin only
- [ ] Implement role-based route protection

---

## 🚀 **CONCLUSION**

The **Secure Stock Receipt Model** solves all identified security vulnerabilities while maintaining operational efficiency:

1. **Eliminates dual inventory system** confusion
2. **Prevents staff fraud** through mandatory verification
3. **Creates complete audit trails** for compliance
4. **Maintains staff involvement** in receiving process
5. **Provides admin control** over all inventory changes
6. **Enables multi-shop scalability** with proper security

This architecture follows **retail industry best practices** and provides the **security, accountability, and scalability** your business needs.

**Next Steps:** Review this proposal and approve implementation of Phase 1 (Schema Migration) to begin securing your inventory system immediately.
│ RETAILER │───▶│ SHOP ADMIN │───▶│ STAFF │───▶│ CUSTOMER │
│ │ │ (Stock In) │ │ (Sale Only) │ │ (Purchase) │
│ • Products │ │ • Inventory │ │ • View Stock│ │ • Invoice │
│ • Base Price│ │ • Pricing │ │ • Process │ │ • Receipt │
│ • Supply │ │ • Control │ │ Sales │ │ │
└─────────────┘ └──────────────┘ └─────────────┘ └──────────────┘

````

### **Stock Movement Types:**

1. **STOCK_IN** - Shop Admin receives from Retailer
2. **SALE** - Staff processes customer sale
3. **ADJUSTMENT** - Shop Admin fixes discrepancies
4. **DAMAGE** - Shop Admin records damaged goods
5. **RETURN** - Shop Admin processes returns
6. **TRANSFER** - Between shops (future feature)

---

## 🔧 Implementation Steps

### **Step 1: Schema Migration**

```bash
# Create migration to remove Inventory model and update Product model
npx prisma migrate dev --name "unify_inventory_system"
````

### **Step 2: Data Migration Script**

```javascript
// migrate-inventory.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrateInventoryData() {
  const existingInventory = await prisma.inventory.findMany({
    include: { product: true },
  });

  for (const item of existingInventory) {
    await prisma.shopInventory.upsert({
      where: {
        shopId_productId: {
          shopId: 1, // Default to shop 1
          productId: item.productId,
        },
      },
      update: {
        quantity: item.quantity,
      },
      create: {
        shopId: 1,
        productId: item.productId,
        quantity: item.quantity,
        supplier: "Retailer",
        lastRestockedAt: item.updatedAt,
      },
    });
  }
}
```

### **Step 3: Update Controllers**

#### **A. Update `inventoryController.js`**

```javascript
// OLD: Uses Inventory model
const inventory = await prisma.inventory.upsert({
  where: { productId: product.id },
  update: { quantity: { increment: quantityInt } },
  create: { productId: product.id, quantity: quantityInt },
});

// NEW: Use ShopInventory model
const shopInventory = await prisma.shopInventory.upsert({
  where: {
    shopId_productId: {
      shopId: req.user.shopId, // From staff token
      productId: product.id,
    },
  },
  update: { quantity: { increment: quantityInt } },
  create: {
    shopId: req.user.shopId,
    productId: product.id,
    quantity: quantityInt,
    supplier: "Retailer",
  },
});
```

#### **B. Update `invoiceController.js`**

```javascript
// OLD: Check Inventory
const inventory = await prisma.inventory.findFirst({
  where: { productId: item.productId },
});

// NEW: Check ShopInventory
const shopInventory = await prisma.shopInventory.findFirst({
  where: {
    shopId: req.user.shopId,
    productId: item.productId,
  },
});
```

#### **C. Update `customerController.js`** (Similar changes)

---

## 🚨 Files That Need Modification

### **1. Schema Files**

- ✅ `prisma/schema.prisma` - Remove Inventory model

### **2. Controller Files**

- ✅ `controllers/inventoryController.js` - Use ShopInventory
- ✅ `controllers/invoiceController.js` - Check ShopInventory
- ✅ `controllers/customerController.js` - Update ShopInventory
- ❌ `controllers/shopAdminController.js` - Already correct

### **3. Route Files**

- ✅ `routes/inventory.js` - May need staff permission updates
- ❌ `routes/shopadmin/*` - Already correct

### **4. Migration Files**

- ✅ Create new migration to remove Inventory model
- ✅ Create data migration script

---

## ✅ Benefits of This Approach

### **1. Centralized Control**

- Shop admin has full inventory oversight
- Staff can only process sales, not manipulate stock

### **2. Multi-Shop Ready**

- Each shop has independent inventory
- Ready for retailer with multiple locations

### **3. Audit Trail**

- All stock movements tracked in `StockMovement` model
- Complete history of who did what when

### **4. Security**

- Staff can't inflate stock numbers
- Price changes controlled by shop admin only

### **5. Scalability**

- Easy to add new shops
- Each shop operates independently

---

## 🎯 Next Steps

1. **Review and approve this architecture**
2. **Create schema migration**
3. **Write data migration script**
4. **Update all affected controllers**
5. **Test thoroughly**
6. **Deploy to production**

Would you like me to proceed with implementing any of these changes?
