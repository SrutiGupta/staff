# Stock Management & Barcode System API Documentation

## Table of Contents

1. [Stock Management APIs](#stock-management-apis)
2. [Barcode Generation & Management APIs](#barcode-generation--management-apis)
3. [Scanner Integration](#scanner-integration)
4. [Error Handling](#error-handling)
5. [Authentication](#authentication)
6. [Example Workflows](#example-workflows)

---

## Stock Management APIs

### Base URL: `/api/inventory`

---

### 1. Stock In Operations

#### 1.1 Stock In by Barcode (Recommended for Scanners)

```http
POST /api/inventory/stock-by-barcode
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "barcode": "EYE000112345678",
  "quantity": 10,
  "price": 2500.0
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Stock updated successfully via barcode scan",
  "inventory": {
    "id": 123,
    "productId": 456,
    "quantity": 25,
    "lastRestockedAt": "2025-09-30T10:30:00.000Z",
    "lastUpdated": "2025-09-30T10:30:00.000Z"
  },
  "productDetails": {
    "id": 456,
    "sku": "RAY-SUN-AVI-0456-1234",
    "barcode": "EYE000112345678",
    "name": "Ray-Ban Aviator Sunglasses",
    "description": "Classic aviator sunglasses",
    "model": "RB3025",
    "size": "58mm",
    "color": "Gold",
    "material": "Metal",
    "price": 2500.0,
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
    "scannedBarcode": "EYE000112345678",
    "productName": "Ray-Ban Aviator Sunglasses",
    "addedQuantity": 10,
    "newQuantity": 25,
    "previousQuantity": 15,
    "stockOperation": "STOCK_IN",
    "timestamp": "2025-09-30T10:30:00.000Z"
  },
  "inventoryStatus": "HEALTHY"
}
```

#### 1.2 Traditional Stock In (by Product ID)

```http
POST /api/inventory/stock-in
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "productId": 456,
  "quantity": 10
}
```

**OR with Barcode:**

```json
{
  "barcode": "EYE000112345678",
  "quantity": 10
}
```

**Response:** Similar to barcode stock-in above.

---

### 2. Stock Out Operations

#### 2.1 Stock Out by Barcode

```http
POST /api/inventory/stock-out-by-barcode
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "barcode": "EYE000112345678",
  "quantity": 2
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Stock removed successfully via barcode scan",
  "inventory": {
    "id": 123,
    "productId": 456,
    "quantity": 23,
    "lastUpdated": "2025-09-30T10:35:00.000Z"
  },
  "productDetails": {
    "id": 456,
    "name": "Ray-Ban Aviator Sunglasses",
    "barcode": "EYE000112345678",
    "company": "Ray-Ban"
  },
  "stockOutDetails": {
    "method": "barcode_scan",
    "scannedBarcode": "EYE000112345678",
    "productName": "Ray-Ban Aviator Sunglasses",
    "removedQuantity": 2,
    "previousQuantity": 25,
    "newQuantity": 23,
    "lowStockWarning": null,
    "timestamp": "2025-09-30T10:35:00.000Z"
  }
}
```

#### 2.2 Traditional Stock Out

```http
POST /api/inventory/stock-out
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "productId": 456,
  "quantity": 2
}
```

**OR with Barcode:**

```json
{
  "barcode": "EYE000112345678",
  "quantity": 2
}
```

---

### 3. Product Lookup Operations

#### 3.1 Get Product by Barcode

```http
GET /api/inventory/product/barcode/{barcode}
Authorization: Bearer <token>
```

**Example:**

```http
GET /api/inventory/product/barcode/EYE000112345678
```

**Response (Success 200):**

```json
{
  "product": {
    "id": 456,
    "name": "Ray-Ban Aviator Sunglasses",
    "description": "Classic aviator sunglasses",
    "barcode": "EYE000112345678",
    "sku": "RAY-SUN-AVI-0456-1234",
    "basePrice": 2500.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "model": "RB3025",
    "size": "58mm",
    "color": "Gold",
    "material": "Metal",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    }
  },
  "inventory": {
    "quantity": 23,
    "sellingPrice": 2500.0,
    "lastRestockedAt": "2025-09-30T10:30:00.000Z"
  },
  "canScan": true,
  "actions": ["stock-in", "stock-out", "generate-label"]
}
```

#### 3.2 Get All Products

```http
GET /api/inventory/products
Authorization: Bearer <token>
```

**Query Parameters:**

- `companyId` (optional): Filter by company
- `eyewearType` (optional): GLASSES, SUNGLASSES, LENSES
- `hasBarcode` (optional): true/false
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example:**

```http
GET /api/inventory/products?companyId=1&eyewearType=SUNGLASSES&hasBarcode=true&page=1&limit=10
```

#### 3.3 Get Current Shop Inventory

```http
GET /api/inventory
Authorization: Bearer <token>
```

**Response:**

```json
{
  "inventory": [
    {
      "id": 123,
      "quantity": 23,
      "sellingPrice": 2500.0,
      "lastRestockedAt": "2025-09-30T10:30:00.000Z",
      "product": {
        "id": 456,
        "name": "Ray-Ban Aviator Sunglasses",
        "barcode": "EYE000112345678",
        "sku": "RAY-SUN-AVI-0456-1234",
        "eyewearType": "SUNGLASSES",
        "company": {
          "name": "Ray-Ban"
        }
      },
      "status": "HEALTHY"
    }
  ],
  "totalItems": 1,
  "lowStockItems": 0,
  "outOfStockItems": 0
}
```

---

### 4. Product Management

#### 4.1 Add New Product (Traditional)

```http
POST /api/inventory/product
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Ray-Ban Aviator Sunglasses",
  "description": "Classic aviator sunglasses with gold frame",
  "basePrice": 2500.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "RB3025",
  "barcode": null,
  "sku": null
}
```

#### 4.2 Add New Product by Barcode Scan ⭐ NEW!

```http
POST /api/inventory/product/scan-to-add
Content-Type: application/json
Authorization: Bearer <token>
```

**Use Case:** When you scan a barcode that doesn't exist in the system yet.

**Request Body:**

```json
{
  "scannedBarcode": "EYE123456789",
  "name": "Ray-Ban Aviator Classic",
  "description": "Premium aviator sunglasses with gold frame",
  "basePrice": 2500.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "RB3025",
  "quantity": 10,
  "sellingPrice": 2750.0
}
```

**Response (Success 201):**

```json
{
  "success": true,
  "message": "Product created successfully from barcode scan",
  "product": {
    "id": 789,
    "name": "Ray-Ban Aviator Classic",
    "description": "Premium aviator sunglasses with gold frame",
    "barcode": "EYE123456789",
    "sku": null,
    "basePrice": 2500.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "material": "Metal",
    "color": "Gold",
    "size": "58mm",
    "model": "RB3025",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    },
    "createdAt": "2025-09-30T15:30:00.000Z"
  },
  "inventory": {
    "id": 456,
    "quantity": 10,
    "sellingPrice": 2750.0,
    "lastRestockedAt": "2025-09-30T15:30:00.000Z"
  },
  "scanDetails": {
    "scannedBarcode": "EYE123456789",
    "productCreated": true,
    "canNowScan": true,
    "nextActions": [
      "Generate SKU (optional)",
      "Print barcode label",
      "Start stock operations"
    ]
  }
}
```

---

## Barcode Generation & Management APIs

### Base URL: `/api/barcode`

---

### 1. Barcode Generation

#### 1.1 Generate Barcode for Product

```http
POST /api/barcode/generate/{productId}
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "companyPrefix": "RAY",
  "isClone": false
}
```

**Example:**

```http
POST /api/barcode/generate/456
```

**Response (Success 200):**

```json
{
  "message": "Barcode generated successfully",
  "product": {
    "id": 456,
    "name": "Ray-Ban Aviator Sunglasses",
    "barcode": "RAY045612345678",
    "sku": "RAY-SUN-AVI-0456-1234",
    "company": {
      "name": "Ray-Ban"
    }
  },
  "generatedBarcode": "RAY045612345678",
  "canNowScan": true,
  "nextStep": "Use this barcode for stock-in/stock-out operations"
}
```

#### 1.2 Generate SKU for Product

```http
POST /api/barcode/sku/generate/{productId}
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "companyCode": "RAY"
}
```

**Response:**

```json
{
  "message": "SKU generated successfully",
  "product": {
    "id": 456,
    "name": "Ray-Ban Aviator Sunglasses",
    "sku": "RAY-SUN-AVI-0456-1234"
  },
  "generatedSKU": "RAY-SUN-AVI-0456-1234",
  "skuBreakdown": {
    "company": "RAY",
    "eyewearType": "SUN",
    "frameType": "AVI",
    "productId": "0456",
    "timestamp": "1234"
  }
}
```

#### 1.3 Bulk Generate Barcodes

```http
POST /api/barcode/bulk-generate
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "count": 5,
  "companyPrefix": "RAY",
  "productIds": [456, 457, 458, 459, 460]
}
```

**Response:**

```json
{
  "message": "Bulk barcodes generated successfully",
  "count": 5,
  "barcodes": [
    {
      "barcode": "RAY045612345678",
      "productId": 456,
      "index": 1
    },
    {
      "barcode": "RAY045712345679",
      "productId": 457,
      "index": 2
    }
  ],
  "prefix": "RAY",
  "timestamp": "2025-09-30T10:00:00.000Z"
}
```

---

### 2. Barcode Validation

#### 2.1 Validate Barcode Uniqueness

```http
GET /api/barcode/validate/{barcode}
Authorization: Bearer <token>
```

**Example:**

```http
GET /api/barcode/validate/RAY045612345678
```

**Response (Barcode Exists):**

```json
{
  "isUnique": false,
  "exists": true,
  "conflictingProduct": {
    "id": 456,
    "name": "Ray-Ban Aviator Sunglasses",
    "company": "Ray-Ban",
    "eyewearType": "SUNGLASSES",
    "barcode": "RAY045612345678"
  },
  "message": "Barcode already exists in the system"
}
```

**Response (Barcode Unique):**

```json
{
  "isUnique": true,
  "exists": false,
  "message": "Barcode is unique and can be used"
}
```

#### 2.2 Get Products Without Barcodes

```http
GET /api/barcode/missing
Authorization: Bearer <token>
```

**Query Parameters:**

- `companyId` (optional): Filter by company
- `eyewearType` (optional): Filter by eyewear type

**Response:**

```json
{
  "products": [
    {
      "id": 789,
      "name": "Oakley Sport Sunglasses",
      "eyewearType": "SUNGLASSES",
      "company": {
        "id": 2,
        "name": "Oakley"
      },
      "barcode": null,
      "needsBarcode": true
    }
  ],
  "count": 1,
  "message": "1 products need barcode generation"
}
```

---

### 3. Barcode Label Generation

#### 3.1 Generate Barcode Label

```http
POST /api/barcode/label
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body (Using Product ID):**

```json
{
  "productId": 456
}
```

**Request Body (Manual Data):**

```json
{
  "name": "Ray-Ban Aviator",
  "description": "Classic sunglasses",
  "price": 2500.0,
  "data": "RAY045612345678",
  "bcid": "code128",
  "scale": 3,
  "height": 20,
  "includetext": false
}
```

**Response:** Binary PNG image data with Content-Type: image/png

**Label Contains:**

- Product name
- Product description (if available)
- Price
- Company name
- Barcode image
- Barcode text

---

## Scanner Integration

### 🔍 **Laser Scanner Support**

Yes, the system **fully supports laser barcode scanners**! Here's how it works:

#### **Scanner Integration Flow:**

1. **Staff scans product barcode** with laser scanner
2. **Scanner reads barcode** (e.g., "RAY045612345678")
3. **Frontend receives barcode data** from scanner
4. **System automatically calls** stock management API
5. **Stock is updated** in real-time

#### **Scanner-Compatible Endpoints:**

✅ **Stock In via Scanner:**

```http
POST /api/inventory/stock-by-barcode
{
  "barcode": "RAY045612345678",
  "quantity": 10
}
```

✅ **Stock Out via Scanner:**

```http
POST /api/inventory/stock-out-by-barcode
{
  "barcode": "RAY045612345678",
  "quantity": 2
}
```

✅ **Product Lookup via Scanner:**

```http
GET /api/inventory/product/barcode/RAY045612345678
```

#### **Scanner Integration Example (JavaScript):**

```javascript
// Listen for scanner input
function onBarcodeScanned(barcode) {
  console.log("Scanned:", barcode);

  // Auto stock-in when scanned
  fetch("/api/inventory/stock-by-barcode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      barcode: barcode,
      quantity: 1, // Default quantity
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Stock updated:", data.stockInDetails);
        showSuccessMessage(
          `Added ${data.stockInDetails.addedQuantity} ${data.productDetails.name}`
        );
      }
    })
    .catch((error) => {
      console.error("Scanner error:", error);
      showErrorMessage("Failed to process scanned item");
    });
}

// Auto-detect scanner input
document.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && scannerInput.length > 0) {
    onBarcodeScanned(scannerInput);
    scannerInput = "";
  } else {
    scannerInput += e.key;
  }
});
```

#### **Supported Scanner Types:**

- ✅ USB Laser Scanners (HID mode)
- ✅ Bluetooth Scanners
- ✅ RS232/Serial Scanners
- ✅ Wireless 2.4GHz Scanners
- ✅ Mobile App Camera Scanners

#### **Scanner Configuration:**

- **Barcode Format**: Code 128 (recommended)
- **Data Format**: Raw barcode string
- **Suffix**: Enter key (for auto-submit)
- **Prefix**: None required

---

## Error Handling

### Common Error Responses:

#### Authentication Error (401):

```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

#### Product Not Found (404):

```json
{
  "error": "Product with barcode RAY045612345678 not found.",
  "suggestion": "Verify the barcode or add the product to the system first."
}
```

#### Insufficient Stock (400):

```json
{
  "error": "Insufficient stock. Available: 5, Requested: 10",
  "availableStock": 5,
  "requestedQuantity": 10
}
```

#### Duplicate Barcode (409):

```json
{
  "error": "Barcode already exists.",
  "existingProduct": {
    "id": 456,
    "name": "Ray-Ban Aviator"
  }
}
```

#### Validation Error (400):

```json
{
  "error": "Barcode and quantity are required.",
  "requiredFields": ["barcode", "quantity"]
}
```

---

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**To get token:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "staff@shop.com",
  "password": "password123"
}
```

---

## Example Workflows

### **Workflow 1: Complete Product Setup**

1. **Create Product:**

```http
POST /api/inventory/product
{
  "name": "Ray-Ban Aviator",
  "basePrice": 2500,
  "eyewearType": "SUNGLASSES",
  "companyId": 1
}
```

2. **Generate Barcode:**

```http
POST /api/barcode/generate/456
{
  "companyPrefix": "RAY"
}
```

3. **Generate Label:**

```http
POST /api/barcode/label
{
  "productId": 456
}
```

4. **Stock In via Scanner:**

```http
POST /api/inventory/stock-by-barcode
{
  "barcode": "RAY045612345678",
  "quantity": 50
}
```

### **Workflow 2: Daily Scanner Operations**

1. **Scanner reads barcode** → "RAY045612345678"

2. **Auto Stock In:**

```http
POST /api/inventory/stock-by-barcode
{
  "barcode": "RAY045612345678",
  "quantity": 1
}
```

3. **Check Inventory:**

```http
GET /api/inventory/product/barcode/RAY045612345678
```

4. **Stock Out (Sale):**

```http
POST /api/inventory/stock-out-by-barcode
{
  "barcode": "RAY045612345678",
  "quantity": 1
}
```

### **Workflow 3: Bulk Barcode Generation**

1. **Get products without barcodes:**

```http
GET /api/barcode/missing
```

2. **Generate bulk barcodes:**

```http
POST /api/barcode/bulk-generate
{
  "count": 10,
  "companyPrefix": "SHOP",
  "productIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

3. **Assign barcodes to products** (using individual generate endpoints)

4. **Print labels for all products**

---

## Rate Limiting & Performance

- **Rate Limit**: 100 requests per minute per user
- **Bulk Operations**: Max 100 items per request
- **Concurrent Requests**: Handled with database transactions
- **Response Time**: < 200ms for scanner operations

---

## Security Features

- ✅ **JWT Authentication** required for all endpoints
- ✅ **Shop-level isolation** (users only see their shop's inventory)
- ✅ **Role-based access** control
- ✅ **Transaction-based operations** prevent race conditions
- ✅ **Audit logging** for all stock movements
- ✅ **Input validation** and sanitization

---

This API documentation covers all stock management and barcode operations, with full support for laser scanner integration for real-time inventory management.
