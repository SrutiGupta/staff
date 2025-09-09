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

## 🎯 Recommended Architecture Solution

### **Option 1: Unified Shop-Based Inventory (RECOMMENDED)**

#### **Remove Legacy `Inventory` Model Completely**

```prisma
// ❌ DELETE THIS MODEL
// model Inventory {
//   id        Int      @id @default(autoincrement())
//   product   Product  @relation(fields: [productId], references: [id])
//   productId Int      @unique
//   quantity  Int
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }

// ✅ KEEP ONLY THIS MODEL (Already exists)
model ShopInventory {
  id              Int      @id @default(autoincrement())
  shopId          Int
  shop            Shop     @relation(fields: [shopId], references: [id])
  productId       Int
  product         Product  @relation(fields: [productId], references: [id])
  quantity        Int
  minThreshold    Int      @default(10)
  maxThreshold    Int      @default(100)
  costPrice       Float?   // Purchase cost from retailer
  sellingPrice    Float?   // Shop-specific pricing override
  supplier        String?  // Retailer or other supplier
  lastRestockedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  stockMovements  StockMovement[]

  @@unique([shopId, productId])
}
```

#### **Enhanced Product Model**

```prisma
model Product {
  id           Int           @id @default(autoincrement())
  name         String
  description  String?
  basePrice    Float         // Retailer's base price
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

  // Relationships (REMOVE inventory relationship)
  // inventory    Inventory[]  // ❌ REMOVE THIS
  invoiceItems InvoiceItem[]
  shopInventory ShopInventory[]  // ✅ KEEP THIS
  performance  ProductPerformance[]
}
```

---

## 🔄 Migration Strategy

### **Phase 1: Data Migration**

1. **Migrate existing `Inventory` data to `ShopInventory`**
2. **Assign all current inventory to Shop 1 (default shop)**
3. **Update all controllers to use `ShopInventory`**

### **Phase 2: Controller Updates**

#### **Controllers That Need Changes:**

1. **`inventoryController.js`** (Staff Portal)

   - ❌ **Current**: Uses `prisma.inventory`
   - ✅ **Update**: Use `prisma.shopInventory` with staff's shopId

2. **`invoiceController.js`** (Staff Portal)

   - ❌ **Current**: Checks `prisma.inventory`
   - ✅ **Update**: Check `prisma.shopInventory` with staff's shopId

3. **`customerController.js`** (Staff Portal)

   - ❌ **Current**: Updates `prisma.inventory`
   - ✅ **Update**: Update `prisma.shopInventory` with staff's shopId

4. **Shop Admin Controllers** (Already correct)
   - ✅ **Already using**: `prisma.shopInventory`

---

## 🛡️ Security & Control Benefits

### **Why Staff Should NOT Have Direct Stock Control:**

1. **Theft Prevention**: Staff can't manipulate their own accessible inventory
2. **Audit Trail**: All stock movements tracked by shop admin
3. **Centralized Control**: Shop admin manages all inventory flows
4. **Price Protection**: Staff can't change product prices
5. **Loss Prevention**: Prevents "internal shrinkage"

### **Proposed Staff Role:**

- **View Only**: Staff can see available stock for sales
- **Sale Processing**: Staff can process sales (which automatically decrements stock)
- **No Stock In**: Only shop admin can add new stock
- **No Price Changes**: Only shop admin can modify prices

---

## 📊 Proposed Data Flow

### **Retailer → Shop → Customer Flow**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   RETAILER  │───▶│ SHOP ADMIN   │───▶│    STAFF    │───▶│   CUSTOMER   │
│             │    │   (Stock In) │    │ (Sale Only) │    │   (Purchase) │
│ • Products  │    │ • Inventory  │    │ • View Stock│    │ • Invoice    │
│ • Base Price│    │ • Pricing    │    │ • Process   │    │ • Receipt    │
│ • Supply    │    │ • Control    │    │   Sales     │    │              │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

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
```

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
