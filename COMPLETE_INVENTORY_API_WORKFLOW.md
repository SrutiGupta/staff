# 📚 COMPLETE INVENTORY WORKFLOW API DOCUMENTATION

> Full Step-by-Step Guide: Enlist Product → Create Receipt → Admin Approves → Staff Stocks-In

---

## 📋 Table of Contents

1. [PHASE 1: Enlist Product (with Barcode)](#phase-1-enlist-product)
2. [PHASE 2: Create Stock Receipt](#phase-2-create-stock-receipt)
3. [PHASE 3: Admin Approves Receipt](#phase-3-admin-approves-receipt)
4. [PHASE 4: Staff Stock-In](#phase-4-staff-stock-in)
5. [COMPLETE REAL-WORLD SCENARIOS](#complete-real-world-scenarios)

---

# PHASE 1: Enlist Product (with Barcode) 🏷️

## Overview

Admin creates a new product and optionally generates a barcode. Products can be enlisted with or without barcode upfront.

---

## 1.1: Create Company/Brand (Optional if not exists)

**POST** `/api/inventory/company`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_or_admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "name": "Oakley",
  "description": "Premium eyewear brand from USA"
}
```

### Response (201 Created):

```json
{
  "id": 1,
  "name": "Oakley",
  "description": "Premium eyewear brand from USA",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-01T10:00:00.000Z"
}
```

### Error Responses:

```json
{
  "error": "Company already exists."
}
```

---

## 1.2: Add Product (WITHOUT Barcode)

**POST** `/api/inventory/product`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_or_admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "name": "Oakley Sunglasses - Model A",
  "description": "Premium plastic frame sunglasses",
  "basePrice": 2500,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Plastic",
  "color": "Black",
  "size": "Medium",
  "model": "Style123"
}
```

### Response (201 Created):

```json
{
  "id": 1,
  "name": "Oakley Sunglasses - Model A",
  "description": "Premium plastic frame sunglasses",
  "barcode": null,
  "sku": null,
  "basePrice": 2500,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Plastic",
  "color": "Black",
  "size": "Medium",
  "model": "Style123",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-01T10:00:00.000Z",
  "company": {
    "id": 1,
    "name": "Oakley"
  }
}
```

### Error Responses:

```json
{
  "error": "Name, basePrice, eyewearType, and companyId are required fields."
}
```

---

## 1.3: Generate Barcode for Product

**POST** `/api/barcode/generate/:productId`

### Path Parameters:

- `productId` (integer): Product ID

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_or_admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "companyPrefix": "OKL",
  "isClone": false
}
```

### Response (200 OK):

```json
{
  "message": "Barcode generated successfully",
  "product": {
    "id": 1,
    "name": "Oakley Sunglasses - Model A",
    "description": "Premium plastic frame sunglasses",
    "barcode": "OKL0001378956AB",
    "sku": null,
    "basePrice": 2500,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "material": "Plastic",
    "color": "Black",
    "size": "Medium",
    "model": "Style123",
    "companyId": 1,
    "createdAt": "2025-11-01T10:00:00.000Z",
    "updatedAt": "2025-11-01T10:15:00.000Z",
    "company": {
      "id": 1,
      "name": "Oakley"
    },
    "shopInventory": []
  },
  "generatedBarcode": "OKL0001378956AB",
  "canNowScan": true,
  "nextStep": "Use this barcode for stock-in/stock-out operations"
}
```

### Error Responses:

```json
{
  "error": "Product already has a barcode.",
  "existingBarcode": "OKL0001378956AB"
}
```

```json
{
  "error": "Product not found."
}
```

---

## 1.4: Validate Barcode Uniqueness

**GET** `/api/barcode/validate/:barcode`

### Path Parameters:

- `barcode` (string): Barcode to validate

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_or_admin_token>"
}
```

### Response - Unique (200 OK):

```json
{
  "isUnique": true,
  "exists": false,
  "message": "Barcode is unique and can be used"
}
```

### Response - Already Exists (200 OK):

```json
{
  "isUnique": false,
  "exists": true,
  "conflictingProduct": {
    "id": 1,
    "name": "Oakley Sunglasses - Model A",
    "company": "Oakley",
    "eyewearType": "SUNGLASSES",
    "barcode": "OKL0001378956AB"
  },
  "message": "Barcode already exists in the system"
}
```

---

## 1.5: Generate SKU for Product

**POST** `/api/barcode/sku/generate/:productId`

### Path Parameters:

- `productId` (integer): Product ID

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_or_admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "companyCode": "OKL"
}
```

### Response (200 OK):

```json
{
  "message": "SKU generated successfully",
  "product": {
    "id": 1,
    "name": "Oakley Sunglasses - Model A",
    "sku": "OKL-SUN-AVI-0001-2025",
    "company": {
      "name": "Oakley"
    }
  },
  "generatedSKU": "OKL-SUN-AVI-0001-2025",
  "skuBreakdown": {
    "company": "OKL",
    "eyewearType": "SUN",
    "frameType": "AVI",
    "productId": "0001",
    "timestamp": "2025"
  },
  "nextStep": "SKU can now be used for internal tracking and inventory management"
}
```

---

## 1.6: Generate Barcode Label (PNG Image)

**POST** `/api/barcode/label`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_or_admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body - Option A (Using Product ID):

```json
{
  "productId": 1
}
```

### Request Body - Option B (Manual Details):

```json
{
  "name": "Oakley Sunglasses",
  "description": "Premium Frame",
  "price": 2500,
  "data": "OKL0001378956AB"
}
```

### Response (200 OK):

```
Content-Type: image/png
[Binary PNG Image]

Image contains:
- Product name
- Product description
- Price (₹2500.00)
- CODE128 barcode
- Barcode value text
- Company name
```

### Error Responses:

```json
{
  "error": "Product does not have a barcode.",
  "suggestion": "Use POST /api/barcode/generate/1 to generate barcode"
}
```

---

# PHASE 2: Create Stock Receipt 📥

## Overview

When goods arrive from retailer, staff creates a StockReceipt document. Receipt links product to incoming delivery.

---

## 2.1: Create Stock Receipt

**POST** `/api/stock-receipts`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "productId": 1,
  "receivedQuantity": 50,
  "supplierName": "Vision Supplies Co.",
  "deliveryNote": "Monthly stock delivery - Box ref: BOX-2025-001",
  "batchNumber": "BATCH-202510",
  "expiryDate": "2027-10-08"
}
```

### Response (201 Created):

```json
{
  "success": true,
  "message": "Stock receipt created successfully. Waiting for shop admin approval.",
  "receipt": {
    "id": 1,
    "shopId": 2,
    "productId": 1,
    "receivedQuantity": 50,
    "verifiedQuantity": null,
    "receivedByStaffId": 5,
    "verifiedByAdminId": null,
    "status": "PENDING",
    "supplierName": "Vision Supplies Co.",
    "deliveryNote": "Monthly stock delivery - Box ref: BOX-2025-001",
    "batchNumber": "BATCH-202510",
    "expiryDate": "2027-10-08T00:00:00.000Z",
    "adminNotes": null,
    "discrepancyReason": null,
    "receivedAt": "2025-11-01T10:30:00.000Z",
    "verifiedAt": null,
    "createdAt": "2025-11-01T10:30:00.000Z",
    "updatedAt": "2025-11-01T10:30:00.000Z",
    "product": {
      "id": 1,
      "name": "Oakley Sunglasses - Model A",
      "description": "Premium plastic frame sunglasses",
      "barcode": "OKL0001378956AB",
      "sku": "OKL-SUN-AVI-0001-2025",
      "basePrice": 2500,
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "material": "Plastic",
      "color": "Black",
      "size": "Medium",
      "model": "Style123",
      "companyId": 1,
      "company": {
        "id": 1,
        "name": "Oakley"
      }
    },
    "receivedByStaff": {
      "name": "Ahmed"
    },
    "verifiedByAdmin": null
  }
}
```

### Error Responses:

```json
{
  "error": "Missing required fields: productId, receivedQuantity"
}
```

```json
{
  "error": "Product not found"
}
```

---

## 2.2: Get All Stock Receipts (Staff View)

**GET** `/api/stock-receipts`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>"
}
```

### Query Parameters (Optional):

- `status` (string): Filter by status (PENDING, APPROVED, REJECTED, COMPLETED)

### Response (200 OK):

```json
{
  "receipts": [
    {
      "id": 1,
      "shopId": 2,
      "productId": 1,
      "receivedQuantity": 50,
      "verifiedQuantity": null,
      "status": "PENDING",
      "product": {
        "id": 1,
        "name": "Oakley Sunglasses - Model A",
        "barcode": "OKL0001378956AB",
        "eyewearType": "SUNGLASSES"
      },
      "receivedByStaff": {
        "name": "Ahmed"
      },
      "verifiedByAdmin": null
    },
    {
      "id": 2,
      "shopId": 2,
      "productId": 2,
      "receivedQuantity": 30,
      "verifiedQuantity": 30,
      "status": "APPROVED",
      "product": {
        "id": 2,
        "name": "Ray-Ban Aviator",
        "barcode": "RAY0002456789CD",
        "eyewearType": "SUNGLASSES"
      },
      "receivedByStaff": {
        "name": "Fatima"
      },
      "verifiedByAdmin": {
        "name": "John (Admin)"
      }
    }
  ],
  "summary": {
    "total": 2,
    "pending": 1,
    "approved": 1,
    "rejected": 0,
    "completed": 0
  }
}
```

---

## 2.3: Get Stock Receipt by ID

**GET** `/api/stock-receipts/:id`

### Path Parameters:

- `id` (integer): Stock Receipt ID

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>"
}
```

### Response (200 OK):

```json
{
  "id": 1,
  "shopId": 2,
  "productId": 1,
  "receivedQuantity": 50,
  "verifiedQuantity": null,
  "receivedByStaffId": 5,
  "verifiedByAdminId": null,
  "status": "PENDING",
  "supplierName": "Vision Supplies Co.",
  "deliveryNote": "Monthly stock delivery",
  "batchNumber": "BATCH-202510",
  "expiryDate": "2027-10-08T00:00:00.000Z",
  "adminNotes": null,
  "discrepancyReason": null,
  "receivedAt": "2025-11-01T10:30:00.000Z",
  "verifiedAt": null,
  "createdAt": "2025-11-01T10:30:00.000Z",
  "updatedAt": "2025-11-01T10:30:00.000Z",
  "product": {
    "id": 1,
    "name": "Oakley Sunglasses - Model A",
    "barcode": "OKL0001378956AB",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "material": "Plastic",
    "color": "Black",
    "company": {
      "id": 1,
      "name": "Oakley"
    }
  },
  "receivedByStaff": {
    "name": "Ahmed"
  },
  "verifiedByAdmin": null
}
```

---

# PHASE 3: Admin Approves Receipt ✅

## Overview

Shop Admin reviews the stock receipt, verifies quantities physically, and approves it. Only approved receipts can be used for stock-in.

---

## 3.1: List Stock Receipts (Admin View)

**GET** `/shop-admin/stock/receipts`

### Request Headers:

```json
{
  "Authorization": "Bearer <shop_admin_token>"
}
```

### Query Parameters (Optional):

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 10)
- `status` (string): Filter by status

### Response (200 OK):

```json
{
  "receipts": [
    {
      "id": 1,
      "shopId": 2,
      "productId": 1,
      "receivedQuantity": 50,
      "verifiedQuantity": null,
      "status": "PENDING",
      "product": {
        "id": 1,
        "name": "Oakley Sunglasses - Model A",
        "barcode": "OKL0001378956AB"
      },
      "receivedByStaff": {
        "name": "Ahmed"
      },
      "createdAt": "2025-11-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

---

## 3.2: Approve Stock Receipt

**PUT** `/shop-admin/stock/receipts/:id/verify`

### Path Parameters:

- `id` (integer): Stock Receipt ID

### Request Headers:

```json
{
  "Authorization": "Bearer <shop_admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "verifiedQuantity": 50,
  "adminNotes": "All items verified. No discrepancy found.",
  "discrepancyReason": null
}
```

### Response (200 OK):

```json
{
  "message": "Stock receipt verified and approved successfully",
  "receipt": {
    "id": 1,
    "shopId": 2,
    "productId": 1,
    "receivedQuantity": 50,
    "verifiedQuantity": 50,
    "status": "APPROVED",
    "adminNotes": "All items verified. No discrepancy found.",
    "discrepancyReason": null,
    "receivedByStaffId": 5,
    "verifiedByAdminId": 3,
    "receivedAt": "2025-11-01T10:30:00.000Z",
    "verifiedAt": "2025-11-01T11:00:00.000Z",
    "product": {
      "id": 1,
      "name": "Oakley Sunglasses - Model A",
      "barcode": "OKL0001378956AB",
      "basePrice": 2500
    },
    "receivedByStaff": {
      "name": "Ahmed"
    },
    "verifiedByAdmin": {
      "name": "John"
    }
  },
  "inventory": {
    "shopId": 2,
    "productId": 1,
    "quantity": 50,
    "lastRestockedAt": "2025-11-01T11:00:00.000Z"
  }
}
```

### Error Responses - Discrepancy:

```json
{
  "message": "Stock receipt verified with discrepancy",
  "receipt": {
    "id": 1,
    "status": "APPROVED",
    "receivedQuantity": 50,
    "verifiedQuantity": 48,
    "adminNotes": "2 units found damaged",
    "discrepancyReason": "Damaged during transport"
  }
}
```

---

# PHASE 4: Staff Stock-In ✨

## Overview

After admin approves, staff scans barcodes and stocks the goods into inventory. Both barcode and productId methods work.

---

## 4.1: Stock-In by Barcode

**POST** `/api/inventory/stock-by-barcode`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "barcode": "OKL0001378956AB",
  "quantity": 50
}
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "50 units stocked in successfully",
  "inventory": {
    "id": 1,
    "productId": 1,
    "quantity": 50,
    "lastRestockedAt": "2025-11-01T11:30:00.000Z",
    "lastUpdated": "2025-11-01T11:30:00.000Z"
  },
  "productDetails": {
    "id": 1,
    "sku": "OKL-SUN-AVI-0001-2025",
    "barcode": "OKL0001378956AB",
    "name": "Oakley Sunglasses - Model A",
    "description": "Premium plastic frame sunglasses",
    "model": "Style123",
    "size": "Medium",
    "color": "Black",
    "material": "Plastic",
    "price": 2500,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Oakley"
    }
  },
  "stockInDetails": {
    "method": "barcode_scan",
    "scannedBarcode": "OKL0001378956AB",
    "productName": "Oakley Sunglasses - Model A",
    "productId": 1,
    "sku": "OKL-SUN-AVI-0001-2025",
    "model": "Style123",
    "size": "Medium",
    "color": "Black",
    "basePrice": 2500,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Oakley",
    "addedQuantity": 50,
    "newQuantity": 50,
    "previousQuantity": 0,
    "stockOperation": "STOCK_IN",
    "timestamp": "2025-11-01T11:30:00.000Z"
  },
  "inventoryStatus": {
    "currentStock": 50,
    "stockLevel": "MEDIUM",
    "statusMessage": "In Stock"
  }
}
```

### Error Responses:

```json
{
  "error": "Either productId or barcode is required.",
  "examples": {
    "traditional": { "productId": 15, "quantity": 10 },
    "barcodeScan": { "barcode": "RAY0015678901", "quantity": 10 }
  }
}
```

```json
{
  "error": "Product with barcode OKL0001378956AB not found."
}
```

```json
{
  "error": "No approved stock receipt found for product Oakley Sunglasses - Model A. Staff cannot perform stock operations without shop admin approval."
}
```

---

## 4.2: Stock-In by Product ID

**POST** `/api/inventory/stock-in`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "productId": 1,
  "quantity": 50
}
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "inventory": {
    "id": 1,
    "productId": 1,
    "quantity": 50,
    "lastRestockedAt": "2025-11-01T11:30:00.000Z",
    "lastUpdated": "2025-11-01T11:30:00.000Z"
  },
  "productDetails": {
    "id": 1,
    "sku": "OKL-SUN-AVI-0001-2025",
    "barcode": "OKL0001378956AB",
    "name": "Oakley Sunglasses - Model A",
    "price": 2500,
    "eyewearType": "SUNGLASSES",
    "company": {
      "name": "Oakley"
    }
  },
  "stockInDetails": {
    "method": "product_id",
    "productId": 1,
    "addedQuantity": 50,
    "newQuantity": 50,
    "previousQuantity": 0,
    "timestamp": "2025-11-01T11:30:00.000Z"
  },
  "inventoryStatus": {
    "currentStock": 50,
    "stockLevel": "MEDIUM",
    "statusMessage": "In Stock"
  }
}
```

---

## 4.3: Stock-Out by Barcode

**POST** `/api/inventory/stock-out-by-barcode`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "barcode": "OKL0001378956AB",
  "quantity": 5,
  "reason": "SALE"
}
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "5 units stocked out successfully",
  "inventory": {
    "id": 1,
    "productId": 1,
    "quantity": 45,
    "lastUpdated": "2025-11-01T15:30:00.000Z"
  },
  "productDetails": {
    "id": 1,
    "barcode": "OKL0001378956AB",
    "name": "Oakley Sunglasses - Model A",
    "price": 2500
  },
  "stockOutDetails": {
    "scannedBarcode": "OKL0001378956AB",
    "removedQuantity": 5,
    "newQuantity": 45,
    "previousQuantity": 50,
    "reason": "SALE",
    "timestamp": "2025-11-01T15:30:00.000Z"
  }
}
```

---

## 4.4: Stock-Out by Product ID

**POST** `/api/inventory/stock-out`

### Request Headers:

```json
{
  "Authorization": "Bearer <staff_token>",
  "Content-Type": "application/json"
}
```

### Request Body:

```json
{
  "productId": 1,
  "quantity": 5,
  "reason": "SALE",
  "invoiceId": "INV-001"
}
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "5 units stocked out successfully",
  "inventory": {
    "id": 1,
    "productId": 1,
    "quantity": 45
  },
  "stockOutDetails": {
    "productId": 1,
    "removedQuantity": 5,
    "newQuantity": 45,
    "reason": "SALE",
    "invoiceId": "INV-001"
  }
}
```

---

# COMPLETE REAL-WORLD SCENARIOS 🎯

## Scenario 1: Complete Workflow (One Product)

```
DAY 1 - MORNING (Admin Setup)
════════════════════════════════════════════════════════════

Step 1: Create Company
POST /api/inventory/company
{
  "name": "Oakley",
  "description": "Premium eyewear brand"
}
Response: Company ID 1 ✓


Step 2: Create Product (without barcode)
POST /api/inventory/product
{
  "name": "Oakley Sunglasses - Model A",
  "basePrice": 2500,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Plastic",
  "color": "Black",
  "size": "Medium"
}
Response: Product ID 1 ✓


Step 3: Generate Barcode
POST /api/barcode/generate/1
{
  "companyPrefix": "OKL",
  "isClone": false
}
Response: Barcode "OKL0001378956AB" ✓


Step 4: Generate Barcode Label (for printing)
POST /api/barcode/label
{
  "productId": 1
}
Response: PNG image for sticker ✓

---

DAY 1 - AFTERNOON (Staff Receives Delivery)
════════════════════════════════════════════════════════════

Retailer sends 50 boxes of Oakley Sunglasses

Step 5: Create Stock Receipt
POST /api/stock-receipts
{
  "productId": 1,
  "receivedQuantity": 50,
  "supplierName": "Vision Supplies Co.",
  "deliveryNote": "Monthly delivery",
  "batchNumber": "BATCH-202510"
}
Response: Receipt ID 1, Status "PENDING" ✓

---

DAY 1 - EVENING (Admin Verification)
════════════════════════════════════════════════════════════

Step 6: Admin Reviews Receipt
GET /shop-admin/stock/receipts
Response: Shows Receipt ID 1 with status PENDING ✓


Step 7: Admin Counts and Approves
PUT /shop-admin/stock/receipts/1/verify
{
  "verifiedQuantity": 50,
  "adminNotes": "All items verified. No discrepancy."
}
Response: Receipt Status "APPROVED" ✓
           ShopInventory created with quantity 0

---

DAY 2 - MORNING (Staff Stock-In)
════════════════════════════════════════════════════════════

Step 8: Staff Gets Approved Receipts
GET /api/stock-receipts?status=APPROVED
Response: Shows Receipt ID 1 ready for stock-in ✓


Step 9: Staff Stock-In (Scanning Barcodes)
POST /api/inventory/stock-by-barcode
{
  "barcode": "OKL0001378956AB",
  "quantity": 50
}
Response:
{
  "success": true,
  "inventory": {
    "productId": 1,
    "quantity": 50
  },
  "stockInDetails": {
    "newQuantity": 50,
    "timestamp": "2025-11-02T09:00:00Z"
  }
}
✓ STOCK-IN COMPLETE!

---

DAY 2 - AFTERNOON (Selling)
════════════════════════════════════════════════════════════

Customer buys 2 units

Step 10: Create Invoice
POST /api/invoice
{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 2500
    }
  ]
}
Response: Invoice created ✓


Step 11: Stock-Out (Automatic)
POST /api/inventory/stock-out
{
  "productId": 1,
  "quantity": 2,
  "reason": "SALE",
  "invoiceId": "INV-001"
}
Response: ShopInventory updated (50 → 48) ✓
```

---

## Scenario 2: Multiple Products Same Receipt

```
Retailer sends delivery with 3 different products:
- 50 Oakley Sunglasses
- 30 Ray-Ban Aviators
- 20 Oakley Holbrook

PROCESS:
═════════════════════════════════════════════

1. Products already enlisted with barcodes:
   ✓ Oakley (ID 1, barcode: OKL0001378956AB)
   ✓ Ray-Ban (ID 2, barcode: RAY0002456789CD)
   ✓ Holbrook (ID 3, barcode: OKL0003789012EF)

2. Staff creates 3 receipts:

   POST /api/stock-receipts
   { "productId": 1, "receivedQuantity": 50, ... }
   Response: Receipt ID 1 ✓

   POST /api/stock-receipts
   { "productId": 2, "receivedQuantity": 30, ... }
   Response: Receipt ID 2 ✓

   POST /api/stock-receipts
   { "productId": 3, "receivedQuantity": 20, ... }
   Response: Receipt ID 3 ✓

3. Admin approves all 3 receipts:

   PUT /shop-admin/stock/receipts/1/verify
   { "verifiedQuantity": 50 }
   Response: Approved ✓

   PUT /shop-admin/stock/receipts/2/verify
   { "verifiedQuantity": 30 }
   Response: Approved ✓

   PUT /shop-admin/stock/receipts/3/verify
   { "verifiedQuantity": 20 }
   Response: Approved ✓

4. Staff stocks-in all 3 products:

   POST /api/inventory/stock-by-barcode
   { "barcode": "OKL0001378956AB", "quantity": 50 }
   Response: Oakley inventory = 50 ✓

   POST /api/inventory/stock-by-barcode
   { "barcode": "RAY0002456789CD", "quantity": 30 }
   Response: Ray-Ban inventory = 30 ✓

   POST /api/inventory/stock-by-barcode
   { "barcode": "OKL0003789012EF", "quantity": 20 }
   Response: Holbrook inventory = 20 ✓

DATABASE STATUS:
═════════════════════════════════════════════

ShopInventory:
┌──────────┬────────┬─────────────┐
│ SHOP_ID  │ PROD_ID│ QUANTITY    │
├──────────┼────────┼─────────────┤
│ 2        │ 1      │ 50          │
│ 2        │ 2      │ 30          │
│ 2        │ 3      │ 20          │
└──────────┴────────┴─────────────┘

StockReceipt Status:
┌──────┬──────────┬──────────┐
│ ID   │ PRODUCT  │ STATUS   │
├──────┼──────────┼──────────┤
│ 1    │ Oakley   │ COMPLETED│
│ 2    │ Ray-Ban  │ COMPLETED│
│ 3    │ Holbrook │ COMPLETED│
└──────┴──────────┴──────────┘
```

---

## Scenario 3: Error Handling

```
CASE 1: Trying to stock-in without approved receipt

POST /api/inventory/stock-by-barcode
{
  "barcode": "OKL0001378956AB",
  "quantity": 50
}

Response (403 Forbidden):
{
  "error": "No approved stock receipt found for product Oakley
           Sunglasses - Model A. Staff cannot perform stock operations
           without shop admin approval."
}

Solution:
→ Admin must approve receipt first
→ Run: PUT /shop-admin/stock/receipts/1/verify


CASE 2: Trying to stock-in more than approved

Receipt: verifiedQuantity = 40
Trying to stock-in: quantity = 50

Response (403 Forbidden):
{
  "error": "Insufficient approved stock.
           Remaining approved quantity: 40,
           Requested: 50"
}

Solution:
→ Create another receipt for remaining 10 units
→ Get admin approval
→ Then stock-in remaining units


CASE 3: Invalid barcode

POST /api/inventory/stock-by-barcode
{
  "barcode": "INVALID123",
  "quantity": 50
}

Response (404 Not Found):
{
  "error": "Product with barcode INVALID123 not found."
}

Solution:
→ Check if product is enlisted with correct barcode
→ Generate barcode if missing
→ Use correct barcode


CASE 4: No approved receipt at all

POST /api/inventory/stock-by-barcode
{
  "barcode": "OKL0001378956AB",
  "quantity": 50
}

Response (403 Forbidden):
{
  "error": "No approved stock receipt found.
           Please create and get approved."
}

Solution:
→ POST /api/stock-receipts to create receipt
→ PUT /shop-admin/stock/receipts/:id/verify to approve
→ Then stock-in
```

---

## Summary Table

| Phase | User  | Action           | Endpoint                                  | Status Flow       |
| ----- | ----- | ---------------- | ----------------------------------------- | ----------------- |
| 1     | Admin | Create Product   | POST /inventory/product                   | Product created   |
| 1     | Admin | Generate Barcode | POST /barcode/generate/:id                | Barcode added     |
| 1     | Admin | Generate Label   | POST /barcode/label                       | PNG for printing  |
| 2     | Staff | Create Receipt   | POST /stock-receipts                      | Status: PENDING   |
| 3     | Admin | Approve Receipt  | PUT /shop-admin/stock/receipts/:id/verify | Status: APPROVED  |
| 4     | Staff | Stock-In         | POST /inventory/stock-by-barcode          | Inventory updated |
| 4     | Staff | Stock-Out        | POST /inventory/stock-out-by-barcode      | Inventory reduced |

---

Perfect! You now have the COMPLETE API documentation with all routes, request bodies, and response bodies! 🎯
