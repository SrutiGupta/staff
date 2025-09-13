# 📋 **INVENTORY MANAGEMENT API DOCUMENTATION**

**Base URL**: `http://localhost:8080/api`  
**Authentication**: All endpoints require JWT authentication via `Authorization: Bearer <token>` header

---

## 🔄 **STOCK RECEIPT WORKFLOW (REQUIRED BEFORE STOCK-IN)**

### **Important Security Note**:

Staff **CANNOT** perform stock-in operations directly. They must first create a stock receipt and wait for shop admin approval.

### **Workflow Sequence**:

1. **Staff**: Create Stock Receipt → `POST /api/stock-receipts`
2. **Shop Admin**: Approve/Reject Receipt → `PUT /shop-admin/stock/receipts/:id/approve`
3. **Staff**: Perform Stock-In (only if approved) → `POST /api/inventory/stock-in`

---

## 🔸 **1. Create Stock Receipt (REQUIRED FIRST)**

### **Endpoint**: `POST /api/stock-receipts`

### **Auth**: Required (Staff)

### **Description**: Creates a stock receipt for shop admin approval before stock-in operations

#### **Request Body**:

```json
{
  "shopId": 1,
  "productId": 5,
  "receivedQuantity": 50,
  "supplierName": "Ray-Ban Authorized Dealer",
  "deliveryNote": "DN-2025-001",
  "batchNumber": "RB-BATCH-202509",
  "expiryDate": "2027-09-10T00:00:00.000Z"
}
```

#### **Request Fields**:

- `shopId` (number, required): Shop ID (must match authenticated user's shop)
- `productId` (number, required): Product ID for the received stock
- `receivedQuantity` (number, required): Quantity received by staff
- `supplierName` (string, optional): Supplier/vendor name
- `deliveryNote` (string, optional): Delivery note reference
- `batchNumber` (string, optional): Product batch number
- `expiryDate` (string, optional): Expiry date for products (ISO format)

#### **Success Response** (201):

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 5,
  "receivedQuantity": 50,
  "receivedByStaffId": 3,
  "supplierName": "Ray-Ban Authorized Dealer",
  "deliveryNote": "DN-2025-001",
  "batchNumber": "RB-BATCH-202509",
  "expiryDate": "2027-09-10T00:00:00.000Z",
  "status": "PENDING",
  "createdAt": "2025-09-13T10:30:00.000Z",
  "updatedAt": "2025-09-13T10:30:00.000Z"
}
```

---

## 🔸 **2. Get Stock Receipts**

### **Endpoint**: `GET /api/stock-receipts`

### **Auth**: Required (Staff)

### **Description**: Retrieves all stock receipts for the staff's shop

### **Query Parameters** (optional):

- `status`: Filter by status ("PENDING", "APPROVED", "REJECTED", "COMPLETED")

#### **Example**: `GET /api/stock-receipts?status=APPROVED`

#### **Success Response** (200):

```json
[
  {
    "id": 1,
    "shopId": 1,
    "productId": 5,
    "receivedQuantity": 50,
    "verifiedQuantity": 48,
    "status": "APPROVED",
    "supplierName": "Ray-Ban Authorized Dealer",
    "deliveryNote": "DN-2025-001",
    "adminNotes": "2 units damaged during delivery",
    "createdAt": "2025-09-13T10:30:00.000Z",
    "verifiedAt": "2025-09-13T11:15:00.000Z",
    "product": {
      "id": 5,
      "name": "Ray-Ban Aviator Classic",
      "barcode": "RB3025001"
    },
    "receivedByStaff": {
      "id": 3,
      "name": "John Smith"
    },
    "verifiedByAdmin": {
      "id": 1,
      "name": "Admin User"
    }
  }
]
```

---

## 🔸 **3. Get Stock Receipt by ID**

### **Endpoint**: `GET /api/stock-receipts/:id`

### **Auth**: Required (Staff)

### **Description**: Retrieves a specific stock receipt by ID

#### **Example**: `GET /api/stock-receipts/1`

#### **Success Response** (200):

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 5,
  "receivedQuantity": 50,
  "verifiedQuantity": 48,
  "status": "APPROVED",
  "supplierName": "Ray-Ban Authorized Dealer",
  "deliveryNote": "DN-2025-001",
  "batchNumber": "RB-BATCH-202509",
  "expiryDate": "2027-09-10T00:00:00.000Z",
  "adminNotes": "2 units damaged during delivery",
  "discrepancyReason": "Physical damage",
  "createdAt": "2025-09-13T10:30:00.000Z",
  "verifiedAt": "2025-09-13T11:15:00.000Z",
  "product": {
    "id": 5,
    "name": "Ray-Ban Aviator Classic",
    "barcode": "RB3025001",
    "sku": "RAY-AV-001"
  },
  "receivedByStaff": {
    "id": 3,
    "name": "John Smith"
  },
  "verifiedByAdmin": {
    "id": 1,
    "name": "Admin User"
  }
}
```

---

## 🔸 **4. Update Stock by Barcode (AFTER APPROVAL)**

### **Endpoint**: `POST /api/inventory/stock-by-barcode`

### **Auth**: Required (Staff)

### **Description**: Updates inventory stock using barcode (requires approved stock receipt)

#### **⚠️ SECURITY**: This operation requires an approved stock receipt with sufficient verified quantity.

#### **Request Body**:

```json
{
  "barcode": "RB3025001",
  "quantity": 10,
  "price": 150.0
}
```

#### **Request Fields**:

- `barcode` (string, required): Product barcode
- `quantity` (number, required): Quantity to add to inventory
- `price` (number, optional): New selling price for the product

#### **Success Response** (200):

```json
{
  "success": true,
  "message": "Stock updated successfully via barcode scan",
  "inventory": {
    "id": 1,
    "productId": 5,
    "quantity": 25,
    "lastRestockedAt": "2025-09-13T10:30:00.000Z",
    "lastUpdated": "2025-09-13T10:30:00.000Z"
  },
  "productDetails": {
    "id": 5,
    "sku": "RAY-AV-001",
    "barcode": "RB3025001",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with metal frame",
    "model": "RB3025",
    "size": "L",
    "color": "Gold",
    "material": "Metal",
    "price": 150.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    }
  },
  "stockReceipt": {
    "id": 1,
    "verifiedQuantity": 48,
    "consumedQuantity": 10,
    "remainingQuantity": 38,
    "status": "APPROVED"
  }
}
```

#### **Error Responses**:

```json
// 401 - Authentication required
{
  "error": "Authentication required with valid shop access"
}

// 403 - No approved stock receipt
{
  "error": "No approved stock receipt found for product Ray-Ban Aviator Classic. Staff cannot perform stock operations without shop admin approval."
}

// 403 - Insufficient approved quantity
{
  "error": "Insufficient approved stock. Remaining approved quantity: 5, Requested: 10",
  "approvedReceipt": {
    "id": 1,
    "verifiedQuantity": 48,
    "consumedQuantity": 43,
    "remainingQuantity": 5
  }
}

// 404 - Product not found
{
  "error": "Product with barcode RB3025001 not found."
}
```

---

## 🔸 **5. Add Product**

### **Endpoint**: `POST /api/inventory/product`

### **Auth**: Required

### **Description**: Creates a new product in the system

#### **Request Body**:

```json
{
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses with metal frame",
  "barcode": "RB3025001",
  "sku": "RAY-AV-001",
  "basePrice": 150.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "L",
  "model": "RB3025"
}
```

#### **Request Fields**:

- `name` (string, required): Product name
- `description` (string, optional): Product description
- `barcode` (string, optional): Product barcode (must be unique)
- `sku` (string, optional): Stock Keeping Unit (must be unique)
- `basePrice` (number, required): Base price from retailer
- `eyewearType` (string, required): Type of eyewear - "GLASSES", "SUNGLASSES", "LENSES"
- `frameType` (string, required for GLASSES/SUNGLASSES): Frame type - "AVIATOR", "ROUND", "SQUARE", "WAYFARER", etc.
- `companyId` (number, required): Company/Brand ID
- `material` (string, optional): Frame material
- `color` (string, optional): Product color
- `size` (string, optional): Product size
- `model` (string, optional): Product model

#### **Success Response** (201):

```json
{
  "id": 5,
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses with metal frame",
  "basePrice": 150.0,
  "barcode": "RB3025001",
  "sku": "RAY-AV-001",
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "L",
  "model": "RB3025",
  "createdAt": "2025-09-10T10:30:00.000Z",
  "updatedAt": "2025-09-10T10:30:00.000Z",
  "company": {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium eyewear manufacturer"
  }
}
```

#### **Error Responses**:

```json
// 400 - Missing required fields
{
  "error": "Name, basePrice, eyewearType, and companyId are required fields."
}

// 400 - Invalid eyewear type
{
  "error": "Invalid eyewearType. Must be GLASSES, SUNGLASSES, or LENSES."
}

// 400 - Duplicate barcode
{
  "error": "Barcode already exists."
}
```

---

## 🔸 **6. Stock In (Traditional or Barcode) - REQUIRES APPROVAL**

### **Endpoint**: `POST /api/inventory/stock-in`

### **Auth**: Required (Staff)

### **Description**: Adds stock to inventory using either product ID or barcode (requires approved stock receipt)

#### **⚠️ SECURITY**: This operation requires an approved stock receipt with sufficient verified quantity.

#### **Request Body (Option A - By Product ID)**:

```json
{
  "productId": 15,
  "quantity": 10
}
```

#### **Request Body (Option B - By Barcode)**:

```json
{
  "barcode": "RAY0015678901",
  "quantity": 10
}
```

#### **Request Fields**:

- `productId` (number, required if no barcode): Product ID
- `barcode` (string, required if no productId): Product barcode
- `quantity` (number, required): Quantity to add

#### **Success Response** (200):

```json
{
  "success": true,
  "message": "Stock-in successful via barcode scan",
  "inventory": {
    "id": 15,
    "productId": 15,
    "quantity": 30,
    "lastUpdated": "2025-09-13T10:30:00.000Z"
  },
  "productDetails": {
    "id": 15,
    "sku": "RAY-001",
    "barcode": "RAY0015678901",
    "name": "Product Name",
    "price": 120.0,
    "company": "Ray-Ban"
  },
  "stockInDetails": {
    "method": "barcode_scan",
    "addedQuantity": 10,
    "previousQuantity": 20,
    "newQuantity": 30,
    "stockOperation": "STOCK_IN",
    "timestamp": "2025-09-13T10:30:00.000Z"
  },
  "stockReceipt": {
    "id": 2,
    "status": "COMPLETED",
    "verifiedQuantity": 10,
    "consumedQuantity": 10
  }
}
```

#### **Error Responses**:

```json
// 403 - No approved stock receipt
{
  "error": "No approved stock receipt found for product Product Name. Staff cannot perform stock operations without shop admin approval.",
  "suggestion": "Create a stock receipt and wait for shop admin approval before performing stock operations."
}

// 403 - Insufficient approved quantity
{
  "error": "Insufficient approved stock. Remaining approved quantity: 5, Requested: 10",
  "approvedReceipt": {
    "id": 2,
    "verifiedQuantity": 25,
    "consumedQuantity": 20,
    "remainingQuantity": 5
  }
}

// 400 - Missing fields
{
  "error": "Either productId or barcode is required.",
  "examples": {
    "traditional": { "productId": 15, "quantity": 10 },
    "barcodeScan": { "barcode": "RAY0015678901", "quantity": 10 }
  }
}
```

---

## 🔸 **7. Stock Out (Traditional or Barcode) - NO APPROVAL REQUIRED**

### **Endpoint**: `POST /api/inventory/stock-out`

### **Auth**: Required (Staff)

### **Description**: Removes stock from inventory (for sales, returns, damages) - No approval required

#### **Request Body (Option A - By Product ID)**:

```json
{
  "productId": 15,
  "quantity": 5
}
```

#### **Request Body (Option B - By Barcode)**:

```json
{
  "barcode": "RAY0015678901",
  "quantity": 5
}
```

#### **Request Fields**:

- `productId` (number, required if no barcode): Product ID
- `barcode` (string, required if no productId): Product barcode
- `quantity` (number, required): Quantity to remove

#### **Success Response** (200):

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 15,
  "quantity": 25,
  "product": {
    "id": 15,
    "name": "Product Name",
    "barcode": "RAY0015678901",
    "company": {
      "name": "Ray-Ban"
    }
  },
  "stockOutDetails": {
    "method": "product_id",
    "identifier": 15,
    "productName": "Product Name",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "removedQuantity": 5,
    "previousQuantity": 30,
    "newQuantity": 25,
    "lowStockWarning": null,
    "timestamp": "2025-09-13T10:30:00.000Z"
  }
}
```

#### **Error Responses**:

```json
// 400 - Insufficient stock
{
  "error": "Insufficient stock. Available: 3, Requested: 5",
  "availableStock": 3
}
```

---

## 🔸 **8. Stock Out by Barcode - NO APPROVAL REQUIRED**

### **Endpoint**: `POST /api/inventory/stock-out-by-barcode`

### **Auth**: Required (Staff)

### **Description**: Removes stock using barcode (for sales, returns, damages) - No approval required

#### **Request Body**:

```json
{
  "barcode": "RB3025001",
  "quantity": 2
}
```

#### **Request Fields**:

- `barcode` (string, required): Product barcode
- `quantity` (number, required): Quantity to remove

#### **Success Response** (200):

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 5,
  "quantity": 18,
  "product": {
    "id": 5,
    "name": "Ray-Ban Aviator Classic",
    "barcode": "RB3025001",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": {
      "name": "Ray-Ban"
    }
  },
  "stockOutDetails": {
    "productName": "Ray-Ban Aviator Classic",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "previousQuantity": 20,
    "removedQuantity": 2,
    "newQuantity": 18,
    "lowStockWarning": null
  }
}
```

---

## 🔸 **6. Get Product by Barcode**

### **Endpoint**: `GET /api/inventory/product/barcode/:barcode`

### **Auth**: Required

### **Description**: Retrieves product details by barcode

### **Example**: `GET /api/inventory/product/barcode/RB3025001`

#### **Request Body**: None (GET request)

#### **Success Response** (200):

```json
{
  "id": 5,
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses with metal frame",
  "basePrice": 150.0,
  "barcode": "RB3025001",
  "sku": "RAY-AV-001",
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "company": {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium eyewear manufacturer"
  },
  "material": "Metal",
  "color": "Gold",
  "size": "L",
  "model": "RB3025",
  "inventory": {
    "quantity": 20,
    "lastUpdated": "2025-09-10T10:30:00.000Z",
    "stockStatus": "In Stock"
  },
  "createdAt": "2025-09-10T10:30:00.000Z",
  "updatedAt": "2025-09-10T10:30:00.000Z",
  "quickInfo": "Ray-Ban SUNGLASSES - Ray-Ban Aviator Classic ($150)"
}
```

#### **Error Responses**:

```json
// 400 - Invalid barcode
{
  "error": "Barcode is required and must be a valid string."
}

// 404 - Product not found
{
  "error": "Product with barcode RB3025001 not found.",
  "suggestion": "Check if the barcode is correct or if the product needs to be added to the system."
}
```

---

## 🔸 **7. Update Product**

### **Endpoint**: `PUT /api/inventory/product/:productId`

### **Auth**: Required

### **Description**: Updates existing product details

#### **Request Body** (all fields optional):

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "barcode": "NEW123456",
  "price": 200.0,
  "eyewearType": "GLASSES",
  "frameType": "ROUND",
  "companyId": 2,
  "material": "Plastic",
  "color": "Black",
  "size": "M",
  "model": "Updated Model"
}
```

#### **Request Fields** (all optional):

- `name` (string): Product name
- `description` (string): Product description
- `barcode` (string): Product barcode
- `price` (number): Product price
- `eyewearType` (string): Eyewear type
- `frameType` (string): Frame type
- `companyId` (number): Company ID
- `material` (string): Material
- `color` (string): Color
- `size` (string): Size
- `model` (string): Model

#### **Success Response** (200):

```json
{
  "id": 5,
  "name": "Updated Product Name",
  "description": "Updated description",
  "basePrice": 200.0,
  "barcode": "NEW123456",
  "eyewearType": "GLASSES",
  "frameType": "ROUND",
  "companyId": 2,
  "material": "Plastic",
  "color": "Black",
  "size": "M",
  "model": "Updated Model",
  "updatedAt": "2025-09-10T10:35:00.000Z",
  "company": {
    "id": 2,
    "name": "Oakley"
  }
}
```

---

## 🔸 **8. Get Inventory**

### **Endpoint**: `GET /api/inventory/`

### **Auth**: Required

### **Description**: Retrieves all inventory for the authenticated user's shop

### **Query Parameters** (optional):

- `eyewearType`: Filter by eyewear type
- `companyId`: Filter by company
- `frameType`: Filter by frame type

#### **Request Body**: None (GET request)

#### **Success Response** (200):

```json
{
  "inventory": [
    {
      "id": 1,
      "quantity": 20,
      "lastRestockedAt": "2025-09-10T10:30:00.000Z",
      "product": {
        "id": 5,
        "name": "Ray-Ban Aviator Classic",
        "barcode": "RB3025001",
        "basePrice": 150.0,
        "eyewearType": "SUNGLASSES",
        "frameType": "AVIATOR",
        "company": {
          "id": 1,
          "name": "Ray-Ban"
        }
      }
    }
  ],
  "summary": {
    "totalProducts": 25,
    "totalValue": 3750.0,
    "lowStockItems": 3,
    "outOfStockItems": 1,
    "byCategory": {
      "SUNGLASSES": 15,
      "GLASSES": 8,
      "LENSES": 2
    }
  }
}
```

---

## 🔸 **9. Add Company**

### **Endpoint**: `POST /api/inventory/company`

### **Auth**: Required

### **Description**: Creates a new company/brand

#### **Request Body**:

```json
{
  "name": "Ray-Ban",
  "description": "Premium eyewear manufacturer"
}
```

#### **Request Fields**:

- `name` (string, required): Company name
- `description` (string, optional): Company description

#### **Success Response** (201):

```json
{
  "id": 1,
  "name": "Ray-Ban",
  "description": "Premium eyewear manufacturer",
  "createdAt": "2025-09-10T10:30:00.000Z",
  "updatedAt": "2025-09-10T10:30:00.000Z"
}
```

#### **Error Responses**:

```json
// 400 - Missing name
{
  "error": "Company name is required."
}

// 400 - Duplicate name
{
  "error": "Company name already exists."
}
```

---

## 🔸 **10. Get Companies**

### **Endpoint**: `GET /api/inventory/companies`

### **Auth**: Required

### **Description**: Retrieves all companies/brands

#### **Request Body**: None (GET request)

#### **Success Response** (200):

```json
[
  {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium eyewear manufacturer",
    "createdAt": "2025-09-10T10:30:00.000Z",
    "updatedAt": "2025-09-10T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Oakley",
    "description": "Sports eyewear specialist",
    "createdAt": "2025-09-10T10:30:00.000Z",
    "updatedAt": "2025-09-10T10:30:00.000Z"
  }
]
```

---

## 🔸 **11. Get Company Products**

### **Endpoint**: `GET /api/inventory/company/:companyId/products`

### **Auth**: Required

### **Description**: Retrieves all products for a specific company

### **Example**: `GET /api/inventory/company/1/products`

### **Query Parameters** (optional):

- `eyewearType`: Filter by eyewear type
- `frameType`: Filter by frame type

#### **Request Body**: None (GET request)

#### **Success Response** (200):

```json
{
  "products": [
    {
      "id": 5,
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses",
      "basePrice": 150.0,
      "barcode": "RB3025001",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "company": {
        "id": 1,
        "name": "Ray-Ban"
      },
      "shopInventory": [
        {
          "id": 1,
          "quantity": 20,
          "shopId": 1
        }
      ]
    }
  ],
  "grouped": {
    "SUNGLASSES": {
      "AVIATOR": [
        // Products array
      ],
      "WAYFARER": [
        // Products array
      ]
    }
  },
  "summary": {
    "totalProducts": 15,
    "byEyewearType": {
      "SUNGLASSES": 10,
      "GLASSES": 5
    },
    "byFrameType": {
      "AVIATOR": 6,
      "WAYFARER": 4,
      "ROUND": 5
    }
  }
}
```

---

## 📝 **Field Validations**

### **EyewearType Values**:

- `"GLASSES"`
- `"SUNGLASSES"`
- `"LENSES"`

### **FrameType Values**:

- `"AVIATOR"`
- `"ROUND"`
- `"SQUARE"`
- `"WAYFARER"`
- `"RECTANGULAR"`
- `"OVERSIZED"`
- `"CAT_EYE"`

### **Required Fields by Endpoint**:

- **Add Product**: `name`, `basePrice`, `eyewearType`, `companyId`
- **Stock Operations**: `barcode` or `productId`, `quantity`
- **Add Company**: `name`
- **Update Stock by Barcode**: `barcode`, `quantity`, `shopId`

---

## 🔐 **Authentication**

All endpoints require authentication via the `auth` middleware.

### **Headers Required**:

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### **Authentication Response Errors**:

```json
// 401 - No token provided
{
  "error": "Access denied. No token provided."
}

// 403 - Invalid token
{
  "error": "Invalid token."
}
```

---

## 🧪 **Postman Testing Sequence**

### **🔧 Setup**:

1. **Environment Variables**: Set up variables for:

   - `baseUrl`: `http://localhost:8080`
   - `authToken`: Your JWT token
   - `shopId`: Your shop ID (from auth token)

2. **Headers**: Set global headers:
   - `Authorization`: `Bearer {{authToken}}`
   - `Content-Type`: `application/json`

### **📋 Complete Testing Workflow**:

#### **Phase 1: Setup**

1. **Add Company** - `POST /api/inventory/company`

   ```json
   { "name": "Ray-Ban", "description": "Premium eyewear manufacturer" }
   ```

2. **Add Product** - `POST /api/inventory/product`
   ```json
   {
     "name": "Aviator Classic",
     "basePrice": 150,
     "eyewearType": "SUNGLASSES",
     "frameType": "AVIATOR",
     "companyId": 1,
     "barcode": "RB3025001",
     "sku": "RAY-AV-001"
   }
   ```

#### **Phase 2: Stock Receipt Workflow (CRITICAL)**

3. **Create Stock Receipt** - `POST /api/stock-receipts`

   ```json
   {
     "shopId": {{shopId}},
     "productId": 1,
     "receivedQuantity": 50,
     "supplierName": "Ray-Ban Authorized Dealer",
     "deliveryNote": "DN-2025-001"
   }
   ```

4. **Get Stock Receipts** - `GET /api/stock-receipts`

   - Verify status is "PENDING"

5. **Shop Admin Approval** - `PUT /shop-admin/stock/receipts/1/approve`

   ```json
   {
     "decision": "APPROVED",
     "verifiedQuantity": 48,
     "adminNotes": "2 units damaged"
   }
   ```

6. **Verify Approval** - `GET /api/stock-receipts/1`
   - Confirm status is "APPROVED"

#### **Phase 3: Stock Operations (AFTER APPROVAL)**

7. **Stock In by Barcode** - `POST /api/inventory/stock-by-barcode`

   ```json
   { "barcode": "RB3025001", "quantity": 20 }
   ```

8. **Stock In Traditional** - `POST /api/inventory/stock-in`

   ```json
   { "productId": 1, "quantity": 15 }
   ```

9. **Get Inventory** - `GET /api/inventory/`
   - Verify stock levels

#### **Phase 4: Sales Operations (NO APPROVAL NEEDED)**

10. **Stock Out by Barcode** - `POST /api/inventory/stock-out-by-barcode`

    ```json
    { "barcode": "RB3025001", "quantity": 5 }
    ```

11. **Stock Out Traditional** - `POST /api/inventory/stock-out`
    ```json
    { "productId": 1, "quantity": 3 }
    ```

#### **Phase 5: Product Management**

12. **Get Product by Barcode** - `GET /api/inventory/product/barcode/RB3025001`

13. **Update Product** - `PUT /api/inventory/product/1`

    ```json
    { "name": "Updated Aviator Classic", "color": "Black" }
    ```

14. **Get Companies** - `GET /api/inventory/companies`

15. **Get Company Products** - `GET /api/inventory/company/1/products`

### **⚠️ Error Testing Scenarios**:

1. **Try Stock-In Without Approval**:

   - Delete/reject stock receipt
   - Attempt stock-in → Should get 403 error

2. **Insufficient Approved Quantity**:

   - Try to stock-in more than verified quantity → Should get 403 error

3. **Cross-Shop Access** (Security Test):
   - Try to access other shop's data → Should be filtered out

### **📊 Expected Results Validation**:

- **Stock Receipts**: Status progression PENDING → APPROVED → COMPLETED
- **Inventory Updates**: Accurate quantity tracking with audit trails
- **Security**: All operations scoped to authenticated user's shop
- **Workflow Enforcement**: Stock-in blocked without approval, stock-out allowed freely

---

## ⚠️ **Important Security & Workflow Notes**

### **🔒 Stock Receipt Security Model**:

1. **Staff Cannot Bypass Approval**: All stock-in operations require pre-approved stock receipts
2. **Quantity Verification**: Staff can only stock-in up to the admin-verified quantity
3. **Audit Trail**: Complete tracking from receipt creation to final stock movement
4. **Status Management**: Receipts progress through PENDING → APPROVED → COMPLETED

### **🔄 Operation Types**:

- **Stock-IN**: ⚠️ **REQUIRES APPROVAL** (via stock receipts)
- **Stock-OUT**: ✅ **NO APPROVAL NEEDED** (for sales, returns, damages)

### **🏪 Shop Isolation**:

1. **Data Scope**: All operations are scoped to authenticated user's shop
2. **Cross-Shop Protection**: Users cannot access other shops' data
3. **Authentication**: JWT token contains shopId for access control

### **💰 Pricing Model**:

- `basePrice`: Retailer's base price (in Product table)
- `sellingPrice`: Shop-specific override price (in ShopInventory table)
- `costPrice`: Purchase cost from retailer (in ShopInventory table)

### **🔍 Error Handling**:

- **401**: Authentication required
- **403**: Forbidden (no approved stock receipt, insufficient quantity)
- **404**: Resource not found
- **400**: Bad request (validation errors)

---

**Last Updated**: September 13, 2025  
**API Version**: v1.1  
**Server**: Node.js + Express + Prisma + PostgreSQL  
**Security Model**: Stock Receipt Approval Workflow + Shop Isolation
