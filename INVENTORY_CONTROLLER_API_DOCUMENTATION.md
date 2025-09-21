# Inventory Controller API Documentation

## Overview

The Inventory Controller manages all inventory-related operations including stock management, product management, company management, and stock receipt workflow. All endpoints require authentication and validate shop access permissions.

**Key Features:**

- Barcode-based inventory operations
- Stock receipt approval workflow (Staff → Admin → Inventory)
- Multi-level security validation
- Configurable stock thresholds
- Comprehensive audit trails

## Base URL

All routes are prefixed with:

- `/api/inventory` - Main inventory operations
- `/api/stock-receipts` - Staff stock receipt operations
- `/api/shopadmin/stock` - Admin stock receipt management

## Authentication

All endpoints require authentication:

- **Staff Operations:** `auth` middleware with valid shop access
- **Admin Operations:** `shopAdminAuth` middleware with admin privileges

## Helper Functions

### Security & Validation Helpers

- **`parseShopId(req)`**: Safely parses and validates shop ID from authenticated user
- **`validateShopAccess(req, requiredShopId?)`**: Validates shop ownership and access permissions
- **`validateApprovedReceipt(shopId, productId, quantity, product)`**: Validates approved stock receipts for stock operations

### Business Logic Helpers

- **`getLowStockThreshold(shopId)`**: Gets configurable low stock threshold (shop settings → env variable → default: 5)
- **`getInventoryStatus(quantity, shopId)`**: Calculates dynamic inventory status (HIGH/MEDIUM/LOW/OUT_OF_STOCK)

---

## Endpoints

### 1. Stock Management by Barcode

#### 1.1 Update Stock by Barcode

**Endpoint:** `POST /stock-by-barcode`

**Description:** Adds stock to inventory using barcode scanning. Requires approved stock receipt validation.

**Request Body:**

```json
{
  "barcode": "RAY0015678901", // Required: Product barcode
  "quantity": 10, // Required: Quantity to add (integer)
  "price": 150.5 // Optional: Update selling price
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Stock updated successfully via barcode scan",
  "inventory": {
    "id": 123,
    "productId": 45,
    "quantity": 25,
    "lastRestockedAt": "2025-09-21T10:30:00.000Z",
    "lastUpdated": "2025-09-21T10:30:00.000Z"
  },
  "productDetails": {
    "id": 45,
    "sku": "SKU-001",
    "barcode": "RAY0015678901",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses",
    "model": "RB3025",
    "size": "58mm",
    "color": "Gold/Green",
    "material": "Metal",
    "price": 150.5,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "description": "Premium eyewear brand"
    }
  },
  "stockInDetails": {
    "method": "barcode_scan",
    "scannedBarcode": "RAY0015678901",
    "productName": "Ray-Ban Aviator Classic",
    "productId": 45,
    "sku": "SKU-001",
    "model": "RB3025",
    "size": "58mm",
    "color": "Gold/Green",
    "basePrice": 140.0,
    "sellingPrice": 150.5,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "addedQuantity": 10,
    "newQuantity": 25,
    "previousQuantity": 15,
    "stockOperation": "STOCK_IN",
    "timestamp": "2025-09-21T10:30:00.000Z"
  },
  "inventoryStatus": {
    "currentStock": 25,
    "stockLevel": "MEDIUM",
    "statusMessage": "In Stock"
  }
}
```

**Error Responses:**

- **400:** Missing barcode/quantity, invalid number format
- **401:** Authentication required, shop access denied
- **403:** No approved stock receipt, insufficient approved stock
- **404:** Product with barcode not found
- **500:** Internal server error

#### 1.2 Stock Out by Barcode

**Endpoint:** `POST /stock-out-by-barcode`

**Description:** Removes stock from inventory using barcode scanning.

**Request Body:**

```json
{
  "barcode": "RAY0015678901", // Required: Product barcode
  "quantity": 5 // Required: Quantity to remove (positive integer)
}
```

**Success Response (200):**

```json
{
  "id": 123,
  "shopId": 1,
  "productId": 45,
  "quantity": 20,
  "sellingPrice": 150.5,
  "lastRestockedAt": "2025-09-21T10:30:00.000Z",
  "createdAt": "2025-09-21T09:00:00.000Z",
  "updatedAt": "2025-09-21T10:35:00.000Z",
  "product": {
    "id": 45,
    "name": "Ray-Ban Aviator Classic",
    "sku": "SKU-001",
    "barcode": "RAY0015678901",
    "basePrice": 140.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    }
  },
  "stockOutDetails": {
    "productName": "Ray-Ban Aviator Classic",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "previousQuantity": 25,
    "removedQuantity": 5,
    "newQuantity": 20,
    "lowStockWarning": null
  }
}
```

**Error Responses:**

- **400:** Missing barcode/quantity, invalid quantity, insufficient stock, no inventory found
- **401:** Authentication required, shop access denied
- **404:** Product with barcode not found
- **500:** Internal server error

### 2. Product Information

#### 2.1 Get Product by Barcode

**Endpoint:** `GET /product/barcode/:barcode`

**Description:** Retrieves detailed product information using barcode scanning.

**URL Parameters:**

- `barcode` (string): Product barcode

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product found successfully",
  "product": {
    "id": 45,
    "sku": "SKU-001",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with premium quality",
    "price": 140.0,
    "barcode": "RAY0015678901",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "description": "Premium eyewear brand"
    },
    "material": "Metal",
    "color": "Gold/Green",
    "size": "58mm",
    "model": "RB3025",
    "inventory": {
      "quantity": 20,
      "lastUpdated": "2025-09-21T10:35:00.000Z",
      "stockStatus": "In Stock"
    },
    "createdAt": "2025-09-20T08:00:00.000Z",
    "updatedAt": "2025-09-21T10:00:00.000Z"
  },
  "scanResult": {
    "scannedBarcode": "RAY0015678901",
    "productFound": true,
    "quickInfo": "Ray-Ban SUNGLASSES - Ray-Ban Aviator Classic ($140)"
  }
}
```

**Error Responses:**

- **400:** Barcode is required
- **401:** Authentication required, shop access denied
- **404:** Product with barcode not found
- **500:** Internal server error

### 3. Product Management

#### 3.1 Add Product

**Endpoint:** `POST /product`

**Description:** Creates a new product in the system.

**Request Body:**

```json
{
  "name": "Ray-Ban Aviator Classic", // Required: Product name
  "description": "Classic aviator sunglasses", // Optional: Product description
  "barcode": "RAY0015678901", // Optional: Product barcode (must be unique)
  "sku": "SKU-001", // Optional: Stock Keeping Unit (must be unique)
  "basePrice": 140.0, // Required: Base price (number)
  "eyewearType": "SUNGLASSES", // Required: GLASSES, SUNGLASSES, or LENSES
  "frameType": "AVIATOR", // Required for GLASSES/SUNGLASSES, null for LENSES
  "companyId": 1, // Required: Company ID (integer)
  "material": "Metal", // Optional: Frame material
  "color": "Gold/Green", // Optional: Product color
  "size": "58mm", // Optional: Product size
  "model": "RB3025" // Optional: Product model
}
```

**Success Response (201):**

```json
{
  "id": 45,
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses",
  "barcode": "RAY0015678901",
  "sku": "SKU-001",
  "basePrice": 140.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold/Green",
  "size": "58mm",
  "model": "RB3025",
  "createdAt": "2025-09-21T10:00:00.000Z",
  "updatedAt": "2025-09-21T10:00:00.000Z",
  "company": {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium eyewear brand"
  }
}
```

**Error Responses:**

- **400:** Missing required fields, invalid eyewearType, missing frameType, company not found
- **409:** Barcode already exists, SKU already exists, duplicate entry found
- **500:** Internal server error

#### 3.2 Update Product

**Endpoint:** `PUT /product/:productId`

**Description:** Updates an existing product.

**URL Parameters:**

- `productId` (integer): Product ID to update

**Request Body:** (All fields optional)

```json
{
  "name": "Ray-Ban Aviator Classic Updated",
  "description": "Updated description",
  "barcode": "RAY0015678902",
  "basePrice": 150.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Premium Metal",
  "color": "Black/Green",
  "size": "62mm",
  "model": "RB3025-L"
}
```

**Success Response (200):**

```json
{
  "id": 45,
  "name": "Ray-Ban Aviator Classic Updated",
  "description": "Updated description",
  "barcode": "RAY0015678902",
  "sku": "SKU-001",
  "basePrice": 150.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Premium Metal",
  "color": "Black/Green",
  "size": "62mm",
  "model": "RB3025-L",
  "createdAt": "2025-09-21T10:00:00.000Z",
  "updatedAt": "2025-09-21T11:00:00.000Z",
  "company": {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium eyewear brand"
  }
}
```

**Error Responses:**

- **404:** Product not found
- **409:** Barcode already exists, SKU already exists, duplicate entry found
- **500:** Internal server error

### 4. Traditional Stock Operations

#### 4.1 Stock In (by Product ID)

**Endpoint:** `POST /stock-in`

**Description:** Adds stock using product ID or barcode. Requires approved stock receipt validation.

**Request Body:**

```json
{
  "productId": 45, // Either productId OR barcode required
  "barcode": "RAY0015678901", // Either productId OR barcode required
  "quantity": 10 // Required: Quantity to add (integer)
}
```

**Success Response (200/201):**

```json
{
  "success": true,
  "message": "Stock-in successful via barcode scan",
  "inventory": {
    "id": 123,
    "productId": 45,
    "quantity": 30,
    "lastUpdated": "2025-09-21T11:30:00.000Z"
  },
  "productDetails": {
    "id": 45,
    "sku": "SKU-001",
    "barcode": "RAY0015678901",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses",
    "model": "RB3025",
    "size": "58mm",
    "color": "Gold/Green",
    "material": "Metal",
    "price": 140.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "description": "Premium eyewear brand"
    }
  },
  "stockInDetails": {
    "method": "barcode_scan",
    "identifier": "RAY0015678901",
    "scannedBarcode": "RAY0015678901",
    "productId": 45,
    "sku": "SKU-001",
    "productName": "Ray-Ban Aviator Classic",
    "model": "RB3025",
    "size": "58mm",
    "color": "Gold/Green",
    "price": 140.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "addedQuantity": 10,
    "newQuantity": 30,
    "previousQuantity": 20,
    "stockOperation": "STOCK_IN",
    "timestamp": "2025-09-21T11:30:00.000Z"
  },
  "inventoryStatus": {
    "currentStock": 30,
    "stockLevel": "HIGH",
    "statusMessage": "In Stock"
  }
}
```

**Error Responses:**

- **400:** Missing productId/barcode and quantity
- **401:** Authentication required, shop access denied
- **403:** No approved stock receipt, insufficient approved stock
- **404:** Product not found
- **500:** Internal server error

#### 4.2 Stock Out (by Product ID)

**Endpoint:** `POST /stock-out`

**Description:** Removes stock using product ID or barcode.

**Request Body:**

```json
{
  "productId": 45, // Either productId OR barcode required
  "barcode": "RAY0015678901", // Either productId OR barcode required
  "quantity": 5 // Required: Quantity to remove (integer)
}
```

**Success Response (200):**

```json
{
  "id": 123,
  "shopId": 1,
  "productId": 45,
  "quantity": 25,
  "sellingPrice": null,
  "lastRestockedAt": "2025-09-21T11:30:00.000Z",
  "createdAt": "2025-09-21T09:00:00.000Z",
  "updatedAt": "2025-09-21T12:00:00.000Z",
  "product": {
    "id": 45,
    "name": "Ray-Ban Aviator Classic",
    "sku": "SKU-001",
    "barcode": "RAY0015678901",
    "basePrice": 140.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    },
    "shopInventory": [
      {
        "id": 123,
        "shopId": 1,
        "productId": 45,
        "quantity": 25
      }
    ]
  },
  "stockOutDetails": {
    "method": "barcode_scan",
    "identifier": "RAY0015678901",
    "productName": "Ray-Ban Aviator Classic",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "removedQuantity": 5,
    "previousQuantity": 30,
    "newQuantity": 25,
    "lowStockWarning": null
  }
}
```

**Error Responses:**

- **400:** Missing productId/barcode and quantity, no inventory found, insufficient stock
- **401:** Authentication required, shop access denied
- **404:** Product not found
- **500:** Internal server error

### 5. Inventory Viewing

#### 5.1 Get Inventory

**Endpoint:** `GET /`

**Description:** Retrieves shop inventory with optional filtering.

**Query Parameters:**

- `eyewearType` (optional): Filter by GLASSES, SUNGLASSES, or LENSES
- `companyId` (optional): Filter by company ID
- `frameType` (optional): Filter by frame type

**Example:** `GET /?eyewearType=SUNGLASSES&companyId=1`

**Success Response (200):**

```json
{
  "inventory": [
    {
      "id": 123,
      "shopId": 1,
      "productId": 45,
      "quantity": 25,
      "sellingPrice": null,
      "lastRestockedAt": "2025-09-21T11:30:00.000Z",
      "createdAt": "2025-09-21T09:00:00.000Z",
      "updatedAt": "2025-09-21T12:00:00.000Z",
      "product": {
        "id": 45,
        "name": "Ray-Ban Aviator Classic",
        "sku": "SKU-001",
        "barcode": "RAY0015678901",
        "basePrice": 140.0,
        "eyewearType": "SUNGLASSES",
        "frameType": "AVIATOR",
        "company": {
          "id": 1,
          "name": "Ray-Ban",
          "description": "Premium eyewear brand"
        }
      }
    }
  ],
  "grouped": {
    "Ray-Ban": {
      "SUNGLASSES": [
        {
          "id": 123,
          "shopId": 1,
          "productId": 45,
          "quantity": 25,
          "product": {
            "id": 45,
            "name": "Ray-Ban Aviator Classic",
            "eyewearType": "SUNGLASSES",
            "frameType": "AVIATOR",
            "company": {
              "name": "Ray-Ban"
            }
          }
        }
      ]
    }
  },
  "summary": {
    "totalProducts": 1,
    "totalQuantity": 25,
    "companiesCount": 1
  }
}
```

**Error Responses:**

- **401:** Authentication required, shop access denied
- **500:** Internal server error

### 6. Company Management

#### 6.1 Add Company

**Endpoint:** `POST /company`

**Description:** Creates a new company.

**Request Body:**

```json
{
  "name": "Oakley", // Required: Company name (must be unique)
  "description": "Sports and lifestyle eyewear" // Optional: Company description
}
```

**Success Response (201):**

```json
{
  "id": 2,
  "name": "Oakley",
  "description": "Sports and lifestyle eyewear",
  "createdAt": "2025-09-21T12:30:00.000Z",
  "updatedAt": "2025-09-21T12:30:00.000Z"
}
```

**Error Responses:**

- **400:** Company name is required, company name already exists
- **500:** Internal server error

#### 6.2 Get Companies

**Endpoint:** `GET /companies`

**Description:** Retrieves all companies with product counts.

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium eyewear brand",
    "createdAt": "2025-09-20T08:00:00.000Z",
    "updatedAt": "2025-09-20T08:00:00.000Z",
    "_count": {
      "products": 15
    }
  },
  {
    "id": 2,
    "name": "Oakley",
    "description": "Sports and lifestyle eyewear",
    "createdAt": "2025-09-21T12:30:00.000Z",
    "updatedAt": "2025-09-21T12:30:00.000Z",
    "_count": {
      "products": 0
    }
  }
]
```

**Error Responses:**

- **500:** Internal server error

#### 6.3 Get Company Products

**Endpoint:** `GET /company/:companyId/products`

**Description:** Retrieves all products for a specific company with optional filtering.

**URL Parameters:**

- `companyId` (integer): Company ID

**Query Parameters:**

- `eyewearType` (optional): Filter by GLASSES, SUNGLASSES, or LENSES
- `frameType` (optional): Filter by frame type

**Example:** `GET /company/1/products?eyewearType=SUNGLASSES`

**Success Response (200):**

```json
{
  "products": [
    {
      "id": 45,
      "name": "Ray-Ban Aviator Classic",
      "sku": "SKU-001",
      "barcode": "RAY0015678901",
      "basePrice": 140.0,
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "companyId": 1,
      "material": "Metal",
      "color": "Gold/Green",
      "size": "58mm",
      "model": "RB3025",
      "createdAt": "2025-09-21T10:00:00.000Z",
      "updatedAt": "2025-09-21T11:00:00.000Z",
      "company": {
        "id": 1,
        "name": "Ray-Ban",
        "description": "Premium eyewear brand"
      },
      "shopInventory": [
        {
          "id": 123,
          "shopId": 1,
          "productId": 45,
          "quantity": 25
        }
      ]
    }
  ],
  "grouped": {
    "SUNGLASSES": {
      "AVIATOR": [
        {
          "id": 45,
          "name": "Ray-Ban Aviator Classic",
          "eyewearType": "SUNGLASSES",
          "frameType": "AVIATOR"
        }
      ]
    }
  },
  "summary": {
    "totalProducts": 1,
    "byEyewearType": {
      "SUNGLASSES": 1
    },
    "byFrameType": {
      "AVIATOR": 1
    }
  }
}
```

**Error Responses:**

- **500:** Internal server error

---

## 7. Stock Receipt Management (Staff Operations)

The stock receipt system ensures that all inventory additions are properly authorized by shop admins. Staff can create stock receipts when receiving inventory, but cannot add stock to the system until the receipt is approved.

### 7.1 Create Stock Receipt

**Endpoint:** `POST /api/stock-receipts`

**Description:** Creates a new stock receipt when staff receives inventory. This receipt must be approved by shop admin before stock can be added to inventory.

**Request Body:**

```json
{
  "productId": 45, // Required: Product ID being received
  "receivedQuantity": 20, // Required: Quantity received (integer)
  "supplierName": "Ray-Ban Official Distributor", // Optional: Supplier/vendor name
  "deliveryNote": "Delivery Note #DN-2025-001", // Optional: Delivery note reference
  "batchNumber": "BATCH-RB-2025-Q3-001", // Optional: Batch/lot number
  "expiryDate": "2027-09-21" // Optional: Expiry date (ISO format)
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Stock receipt created successfully. Waiting for shop admin approval.",
  "receipt": {
    "id": 123,
    "shopId": 1,
    "productId": 45,
    "receivedQuantity": 20,
    "receivedByStaffId": 5,
    "supplierName": "Ray-Ban Official Distributor",
    "deliveryNote": "Delivery Note #DN-2025-001",
    "batchNumber": "BATCH-RB-2025-Q3-001",
    "expiryDate": "2027-09-21T00:00:00.000Z",
    "status": "PENDING",
    "verifiedQuantity": null,
    "verifiedByAdminId": null,
    "verifiedAt": null,
    "adminNotes": null,
    "discrepancyReason": null,
    "createdAt": "2025-09-21T14:30:00.000Z",
    "updatedAt": "2025-09-21T14:30:00.000Z",
    "product": {
      "id": 45,
      "name": "Ray-Ban Aviator Classic",
      "sku": "SKU-001",
      "barcode": "RAY0015678901",
      "basePrice": 140.0,
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "company": {
        "id": 1,
        "name": "Ray-Ban",
        "description": "Premium eyewear brand"
      }
    }
  }
}
```

**Error Responses:**

- **400:** Missing required fields (productId, receivedQuantity)
- **404:** Product not found
- **500:** Failed to create stock receipt

### 7.2 Get Stock Receipts

**Endpoint:** `GET /api/stock-receipts`

**Description:** Retrieves all stock receipts for the staff's shop with optional status filtering.

**Query Parameters:**

- `status` (optional): Filter by receipt status (PENDING, APPROVED, REJECTED, COMPLETED)

**Example:** `GET /api/stock-receipts?status=PENDING`

**Success Response (200):**

```json
[
  {
    "id": 123,
    "shopId": 1,
    "productId": 45,
    "receivedQuantity": 20,
    "receivedByStaffId": 5,
    "supplierName": "Ray-Ban Official Distributor",
    "deliveryNote": "Delivery Note #DN-2025-001",
    "batchNumber": "BATCH-RB-2025-Q3-001",
    "expiryDate": "2027-09-21T00:00:00.000Z",
    "status": "APPROVED",
    "verifiedQuantity": 18,
    "verifiedByAdminId": 2,
    "verifiedAt": "2025-09-21T15:00:00.000Z",
    "adminNotes": "2 items damaged during shipping, approved 18 units",
    "discrepancyReason": "DAMAGED_ITEMS",
    "createdAt": "2025-09-21T14:30:00.000Z",
    "updatedAt": "2025-09-21T15:00:00.000Z",
    "product": {
      "name": "Ray-Ban Aviator Classic",
      "sku": "SKU-001",
      "company": {
        "name": "Ray-Ban"
      }
    },
    "receivedByStaff": {
      "name": "John Doe"
    },
    "verifiedByAdmin": {
      "name": "Shop Admin"
    }
  }
]
```

**Error Responses:**

- **500:** Internal server error

### 7.3 Get Stock Receipt by ID

**Endpoint:** `GET /api/stock-receipts/:id`

**Description:** Retrieves a specific stock receipt by ID.

**URL Parameters:**

- `id` (integer): Stock receipt ID

**Success Response (200):**

```json
{
  "id": 123,
  "shopId": 1,
  "productId": 45,
  "receivedQuantity": 20,
  "receivedByStaffId": 5,
  "supplierName": "Ray-Ban Official Distributor",
  "deliveryNote": "Delivery Note #DN-2025-001",
  "batchNumber": "BATCH-RB-2025-Q3-001",
  "expiryDate": "2027-09-21T00:00:00.000Z",
  "status": "APPROVED",
  "verifiedQuantity": 18,
  "verifiedByAdminId": 2,
  "verifiedAt": "2025-09-21T15:00:00.000Z",
  "adminNotes": "2 items damaged during shipping, approved 18 units",
  "discrepancyReason": "DAMAGED_ITEMS",
  "createdAt": "2025-09-21T14:30:00.000Z",
  "updatedAt": "2025-09-21T15:00:00.000Z",
  "product": {
    "name": "Ray-Ban Aviator Classic",
    "sku": "SKU-001",
    "company": {
      "name": "Ray-Ban"
    }
  },
  "receivedByStaff": {
    "name": "John Doe"
  },
  "verifiedByAdmin": {
    "name": "Shop Admin"
  }
}
```

**Error Responses:**

- **404:** Stock receipt not found
- **500:** Internal server error

---

## 8. Stock Receipt Management (Shop Admin Operations)

Shop admins have the authority to approve or reject stock receipts created by staff. Only approved receipts allow staff to add inventory to the system.

### 8.1 List Stock Receipts (Admin)

**Endpoint:** `GET /api/shopadmin/stock/receipts`

**Description:** Lists all stock receipts for the admin's shop, ordered by creation date (newest first).

**Authentication:** Requires shop admin authentication

**Success Response (200):**

```json
[
  {
    "id": 123,
    "shopId": 1,
    "productId": 45,
    "receivedQuantity": 20,
    "receivedByStaffId": 5,
    "supplierName": "Ray-Ban Official Distributor",
    "deliveryNote": "Delivery Note #DN-2025-001",
    "batchNumber": "BATCH-RB-2025-Q3-001",
    "expiryDate": "2027-09-21T00:00:00.000Z",
    "status": "PENDING",
    "verifiedQuantity": null,
    "verifiedByAdminId": null,
    "verifiedAt": null,
    "adminNotes": null,
    "discrepancyReason": null,
    "createdAt": "2025-09-21T14:30:00.000Z",
    "updatedAt": "2025-09-21T14:30:00.000Z",
    "product": {
      "name": "Ray-Ban Aviator Classic",
      "sku": "SKU-001"
    },
    "receivedByStaff": {
      "name": "John Doe"
    },
    "verifiedByAdmin": null
  }
]
```

**Error Responses:**

- **403:** Admin not associated with a shop
- **500:** Internal server error

### 8.2 Approve/Reject Stock Receipt

**Endpoint:** `PUT /api/shopadmin/stock/receipts/:id/verify`

**Description:** Approves or rejects a stock receipt. Approved receipts allow staff to add inventory.

**URL Parameters:**

- `id` (integer): Stock receipt ID

**Request Body:**

```json
{
  "decision": "APPROVED", // Required: "APPROVED" or "REJECTED"
  "verifiedQuantity": 18, // Required for APPROVED: Actual quantity to approve
  "adminNotes": "2 items damaged during shipping", // Optional: Admin notes/comments
  "discrepancyReason": "DAMAGED_ITEMS" // Optional: Reason for discrepancy (if any)
}
```

**Approval Success Response (200):**

```json
{
  "message": "Stock receipt has been approved.",
  "receipt": {
    "id": 123,
    "shopId": 1,
    "productId": 45,
    "receivedQuantity": 20,
    "receivedByStaffId": 5,
    "supplierName": "Ray-Ban Official Distributor",
    "deliveryNote": "Delivery Note #DN-2025-001",
    "batchNumber": "BATCH-RB-2025-Q3-001",
    "expiryDate": "2027-09-21T00:00:00.000Z",
    "status": "APPROVED",
    "verifiedQuantity": 18,
    "verifiedByAdminId": 2,
    "verifiedAt": "2025-09-21T15:00:00.000Z",
    "adminNotes": "2 items damaged during shipping",
    "discrepancyReason": "DAMAGED_ITEMS",
    "createdAt": "2025-09-21T14:30:00.000Z",
    "updatedAt": "2025-09-21T15:00:00.000Z"
  }
}
```

**Rejection Request Body:**

```json
{
  "decision": "REJECTED",
  "adminNotes": "Items do not match order specifications",
  "discrepancyReason": "WRONG_PRODUCT"
}
```

**Rejection Success Response (200):**

```json
{
  "message": "Stock receipt has been rejected.",
  "receipt": {
    "id": 123,
    "shopId": 1,
    "productId": 45,
    "receivedQuantity": 20,
    "receivedByStaffId": 5,
    "supplierName": "Ray-Ban Official Distributor",
    "status": "REJECTED",
    "verifiedQuantity": null,
    "verifiedByAdminId": 2,
    "verifiedAt": "2025-09-21T15:00:00.000Z",
    "adminNotes": "Items do not match order specifications",
    "discrepancyReason": "WRONG_PRODUCT",
    "createdAt": "2025-09-21T14:30:00.000Z",
    "updatedAt": "2025-09-21T15:00:00.000Z"
  }
}
```

**Error Responses:**

- **400:** Invalid decision, missing verified quantity for approval, invalid verified quantity
- **403:** Forbidden (can only manage own shop receipts), admin not associated with shop
- **404:** Stock receipt not found
- **400:** Receipt already processed (not PENDING status)
- **500:** Internal server error

---

## Stock Receipt Workflow & Testing Guide

### Complete Testing Flow

#### 1. **Staff Creates Stock Receipt**

```bash
# Staff receives inventory and creates receipt
POST /api/stock-receipts
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "productId": 45,
  "receivedQuantity": 20,
  "supplierName": "Ray-Ban Official Distributor",
  "deliveryNote": "DN-2025-001"
}
```

#### 2. **Shop Admin Reviews Pending Receipts**

```bash
# Admin checks all pending receipts
GET /api/shopadmin/stock/receipts
Authorization: Bearer <admin-token>
```

#### 3. **Shop Admin Approves Receipt**

```bash
# Admin approves the receipt (allowing inventory addition)
PUT /api/shopadmin/stock/receipts/123/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "decision": "APPROVED",
  "verifiedQuantity": 18,
  "adminNotes": "2 items damaged, approving 18 units"
}
```

#### 4. **Staff Adds Inventory Using Approved Receipt**

```bash
# Now staff can add inventory (this will consume the approved receipt)
POST /api/inventory/stock-in
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "productId": 45,
  "quantity": 18
}
```

#### 5. **Receipt Status Changes to COMPLETED**

After staff adds the full approved quantity, the receipt status automatically changes to "COMPLETED".

### Receipt Status Flow

1. **PENDING** → Initial status when staff creates receipt
2. **APPROVED** → Admin approves receipt (staff can now add inventory)
3. **REJECTED** → Admin rejects receipt (staff cannot add inventory)
4. **COMPLETED** → Staff has consumed the full approved quantity

### Security Notes

- Staff cannot add inventory without approved receipts
- Admins can only manage receipts for their own shop
- Approved quantities are tracked and enforced
- Audit trail maintained for all receipt operations

---

## Security Features

### 1. Shop-Level Access Control

- All endpoints validate shop ownership through `validateShopAccess()`
- Users can only access their own shop's inventory and data
- Shop ID validation with proper integer parsing

### 2. Stock Receipt Validation

- Stock-in operations require approved stock receipts from shop admin
- Prevents unauthorized inventory additions
- Tracks consumption against approved quantities

### 3. Error Handling

- Proper HTTP status codes (400, 401, 403, 404, 409, 500)
- Detailed error messages for troubleshooting
- Security-conscious error responses (no sensitive data exposure)

### 4. Input Validation

- Required field validation
- Data type validation (integers, floats, enums)
- Unique constraint handling (barcodes, SKUs)

## Business Logic Features

### 1. Configurable Thresholds

- Low stock thresholds configurable per shop or globally
- Dynamic inventory status calculation (HIGH/MEDIUM/LOW/OUT_OF_STOCK)
- Environment variable support for default thresholds

### 2. Audit Trail

- Stock movement records for all inventory changes
- Detailed operation tracking with timestamps
- Staff identification for accountability

### 3. Flexible Product Management

- Support for multiple eyewear types (GLASSES, SUNGLASSES, LENSES)
- Frame type categorization
- SKU and barcode support for inventory tracking

### 4. Enhanced Responses

- Comprehensive product details in responses
- Operation summaries with before/after quantities
- Inventory status indicators

## Error Status Codes Summary

| Status Code | Description           | Common Causes                                                   |
| ----------- | --------------------- | --------------------------------------------------------------- |
| 400         | Bad Request           | Missing required fields, invalid data types, insufficient stock |
| 401         | Unauthorized          | Authentication required, invalid shop access                    |
| 403         | Forbidden             | No approved stock receipt, insufficient approved stock          |
| 404         | Not Found             | Product not found, company not found                            |
| 409         | Conflict              | Duplicate barcode, duplicate SKU, unique constraint violations  |
| 500         | Internal Server Error | Database errors, unexpected server issues                       |
