## 📊 Complete Process Overview

```
STEP 1: LOGIN (Get JWT) → STEP 2: Setup → STEP 3: Create Product → STEP 4: Add Barcode → STEP 5: Stock Receipt → STEP 6: Approve → STEP 7: Sell
```

---

## ✅ REQUIRED ORDER OF OPERATIONS

### **Phase 1: Initial Setup (DO THIS FIRST)**

#### **Step 1.1: Add Company** ⭐ START HERE

**Endpoint:** `POST /api/inventory/company`

**Authentication:** Required (JWT) - **SHOP_ADMIN role only**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Who Can Do This:** Only Shop Admin or Owner

**Why First?** You cannot create products without a company. Every product must belong to a company.

**Request:**

```json
{
  "name": "Ray-Ban",
  "description": "American eyewear brand known for sunglasses"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "Ray-Ban",
  "description": "American eyewear brand known for sunglasses",
  "createdAt": "2024-09-01T10:30:00Z",
  "updatedAt": "2024-09-01T10:30:00Z"
}
```

**Save this:** `companyId = 1` (you'll need this for next step)

---

#### **Step 1.2: Get All Companies (Optional - Verify)**

**Endpoint:** `GET /api/inventory/companies`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Use When:** You want to verify companies exist or get companyId without creating duplicate

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Ray-Ban",
    "description": "American eyewear brand",
    "_count": {
      "products": 5
    },
    "createdAt": "2024-09-01T10:30:00Z",
    "updatedAt": "2024-09-01T10:30:00Z"
  },
  {
    "id": 2,
    "name": "Oakley",
    "description": "Premium sports eyewear",
    "_count": {
      "products": 3
    }
  }
]
```

---

### **Phase 2: Product Management**

#### **Step 2.1: Add New Product**

**Endpoint:** `POST /api/inventory/product`

**Authentication:** Required (JWT) - **Staff and above can create**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Requires:** `companyId` from Step 1.1

**Request:**

```json
{
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses",
  "basePrice": 100.0,
  "barcode": "EYE00011234AB",
  "sku": "RB-AV-001",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "Aviator"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses",
  "basePrice": 100.0,
  "barcode": "EYE00011234AB",
  "sku": "RB-AV-001",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "Aviator",
  "companyId": 1,
  "company": {
    "id": 1,
    "name": "Ray-Ban"
  },
  "createdAt": "2024-08-01T08:00:00Z",
  "updatedAt": "2024-08-01T08:00:00Z"
}
```

**Save this:** `productId = 1` (you'll need this for stock receipt)

---

#### **Step 2.2: Get Product by ID (Verify)**

**Endpoint:** `GET /api/inventory/product/:productId`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Path:** Replace `:productId` with actual ID from Step 2.1

**Response:**

```json
{
  "id": 1,
  "sku": "RB-AV-001",
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses",
  "basePrice": 100.0,
  "barcode": "EYE00011234AB",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "company": {
    "id": 1,
    "name": "Ray-Ban"
  },
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "Aviator",
  "inventory": {
    "quantity": 0,
    "stockStatus": {
      "currentStock": 0,
      "stockLevel": "OUT_OF_STOCK"
    }
  },
  "createdAt": "2024-08-01T08:00:00Z",
  "updatedAt": "2024-08-01T08:00:00Z"
}
```

**At this point:** Product exists but has NO STOCK (quantity = 0)

---

#### **Step 2.3: Update Product (If needed)**

**Endpoint:** `PUT /api/inventory/product/:productId`

**Authentication:** Required (JWT) - **Staff and above can update**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Request (optional fields):**

```json
{
  "name": "Ray-Ban Aviator Classic Updated",
  "basePrice": 120.0,
  "color": "Silver"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "Ray-Ban Aviator Classic Updated",
  "basePrice": 120.0,
  "color": "Silver",
  ...
}
```

---

#### **Step 2.4: Get All Products**

**Endpoint:** `GET /api/inventory/products`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Query Parameters:**

- `page`: 1 (default)
- `limit`: 50 (default)
- `companyId`: Filter by company (optional)
- `eyewearType`: Filter by type (optional)
- `frameType`: Filter by frame type (optional)

**Response (200 OK):**

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses",
      "basePrice": 100.0,
      "barcode": "EYE00011234AB",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Gold",
      "size": "58mm",
      "model": "Aviator",
      "company": {
        "id": 1,
        "name": "Ray-Ban",
        "description": "American eyewear brand"
      },
      "inventory": {
        "quantity": 48,
        "sellingPrice": 150.0,
        "lastRestockedAt": "2024-08-25T14:30:00Z",
        "lastUpdated": "2024-09-01T10:00:00Z",
        "stockStatus": {
          "currentStock": 48,
          "stockLevel": "MEDIUM",
          "statusMessage": "Stock available"
        }
      },
      "createdAt": "2024-08-01T08:00:00Z",
      "updatedAt": "2024-09-01T10:00:00Z"
    },
    {
      "id": 2,
      "sku": "OAK-HOL-001",
      "name": "Oakley Holbrook",
      "description": "Premium sports sunglasses",
      "basePrice": 300.0,
      "barcode": "EYE00021567CD",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Plastic",
      "color": "Black",
      "size": "55mm",
      "model": "Holbrook",
      "company": {
        "id": 2,
        "name": "Oakley",
        "description": "Premium sports eyewear"
      },
      "inventory": {
        "quantity": 150,
        "sellingPrice": 450.0,
        "lastRestockedAt": "2024-08-20T10:15:00Z",
        "lastUpdated": "2024-09-01T11:30:00Z",
        "stockStatus": {
          "currentStock": 150,
          "stockLevel": "HIGH",
          "statusMessage": "Stock available"
        }
      },
      "createdAt": "2024-08-02T09:30:00Z",
      "updatedAt": "2024-09-01T11:30:00Z"
    }
  ],
  "grouped": {
    "Ray-Ban": {
      "SUNGLASSES": [
        {
          "id": 1,
          "sku": "RB-AV-001",
          "name": "Ray-Ban Aviator Classic",
          "basePrice": 100.0
        }
      ]
    },
    "Oakley": {
      "SUNGLASSES": [
        {
          "id": 2,
          "sku": "OAK-HOL-001",
          "name": "Oakley Holbrook",
          "basePrice": 300.0
        }
      ]
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalProducts": 2,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "summary": {
    "totalProducts": 2,
    "companiesCount": 2,
    "byEyewearType": {
      "SUNGLASSES": 2
    }
  }
}
```

---

#### **Step 2.5: Get Product by Barcode**

**Endpoint:** `GET /api/inventory/product/barcode/:barcode`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Path:** Replace `:barcode` with actual barcode (e.g., `EYE00011234AB`)

**Response (200 OK):**

```json
{
  "id": 1,
  "sku": "RB-AV-001",
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses",
  "basePrice": 100.0,
  "barcode": "EYE00011234AB",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "Aviator",
  "company": {
    "id": 1,
    "name": "Ray-Ban"
  },
  "inventory": {
    "quantity": 48,
    "sellingPrice": 150.0,
    "lastRestockedAt": "2024-08-25T14:30:00Z",
    "lastUpdated": "2024-09-01T10:00:00Z",
    "stockStatus": {
      "currentStock": 48,
      "stockLevel": "MEDIUM"
    }
  },
  "createdAt": "2024-08-01T08:00:00Z",
  "updatedAt": "2024-09-01T10:00:00Z"
}
```

**Error Response (404):**

```json
{
  "error": "Product with barcode EYE00011234AB not found."
}
```

---

#### **Step 2.6: Get Products by Company**

**Endpoint:** `GET /api/inventory/company/:companyId/products`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Path:** Replace `:companyId` with actual ID (e.g., `1`)

**Query Parameters (optional):**

- `eyewearType`: Filter by eyewear type (SUNGLASSES, READING, COMPUTER_GLASSES)
- `frameType`: Filter by frame type (FULL_RIM, HALF_RIM, RIMLESS)

**Response (200 OK):**

```json
{
  "products": [
    {
      "id": 1,
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses",
      "basePrice": 100.0,
      "barcode": "EYE00011234AB",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Gold",
      "size": "58mm",
      "model": "Aviator",
      "company": {
        "id": 1,
        "name": "Ray-Ban",
        "description": "American eyewear brand"
      },
      "shopInventory": [
        {
          "id": 1,
          "shopId": 1,
          "productId": 1,
          "quantity": 48,
          "minStockLevel": 5,
          "maxStockLevel": 100
        }
      ],
      "createdAt": "2024-08-01T08:00:00Z",
      "updatedAt": "2024-09-01T10:00:00Z"
    },
    {
      "id": 3,
      "sku": "RB-WF-001",
      "name": "Ray-Ban Wayfarer",
      "description": "Classic wayfarer style",
      "basePrice": 120.0,
      "barcode": "EYE00031890EF",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Plastic",
      "color": "Black",
      "size": "50mm",
      "model": "RB2140",
      "company": {
        "id": 1,
        "name": "Ray-Ban"
      },
      "shopInventory": [
        {
          "id": 3,
          "shopId": 1,
          "productId": 3,
          "quantity": 30,
          "minStockLevel": 5,
          "maxStockLevel": 100
        }
      ],
      "createdAt": "2024-08-03T08:30:00Z",
      "updatedAt": "2024-09-01T10:45:00Z"
    }
  ],
  "grouped": {
    "SUNGLASSES": {
      "FULL_RIM": [
        {
          "id": 1,
          "name": "Ray-Ban Aviator Classic",
          "sku": "RB-AV-001",
          "basePrice": 100.0
        },
        {
          "id": 3,
          "name": "Ray-Ban Wayfarer",
          "sku": "RB-WF-001",
          "basePrice": 120.0
        }
      ]
    }
  },
  "summary": {
    "totalProducts": 2,
    "byEyewearType": {
      "SUNGLASSES": 2
    },
    "byFrameType": {
      "FULL_RIM": 2
    }
  }
}
```

---

#### **Step 2.7: Add Product by Scanning Barcode** ⭐ SMART SCAN

**Endpoint:** `POST /api/inventory/product/scan-to-add`

**Authentication:** Required (JWT) - **Staff and above can add products**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Why Use This?** Scan ANY barcode (from label, packaging, etc.) and automatically create a NEW product with auto-parsed data. No need to fill 20 fields! The system intelligently extracts product info from the barcode.

**Supported Barcode Formats:**

1. **Structured Format:** `RAY-AVIATOR-L-BLACK-METAL-SUNGLASS` (Brand-Model-Size-Color-Material-Type)
2. **Simple Format:** `RAY001234567890` (Brand + Numbers)
3. **Custom Barcode:** Any barcode format (system uses fallback parsing)

**Request (ONLY scannedBarcode is REQUIRED!):**

```json
{
  "scannedBarcode": "RAY-AVIATOR-L-BLACK-METAL-SUNGLASS",
  "quantity": 10,
  "sellingPrice": 110.0,
  "name": "Ray-Ban Aviator (Optional override)",
  "basePrice": 100.0,
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "material": "Metal",
  "color": "Black",
  "size": "58mm",
  "model": "RB2140",
  "companyId": 1
}
```

**Minimal Request (Everything auto-extracted!):**

```json
{
  "scannedBarcode": "RAY-AVIATOR-L-BLACK-METAL-SUNGLASS"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Product created successfully from barcode scan with auto-parsing",
  "product": {
    "id": 4,
    "name": "Ray-Ban Aviator (Auto-extracted from barcode)",
    "description": "Structured barcode: RAY-AVIATOR-L-BLACK-METAL-SUNGLASS",
    "barcode": "RAY-AVIATOR-L-BLACK-METAL-SUNGLASS",
    "sku": "RAY-AVI-FUL-0004-9823",
    "basePrice": 100.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "FULL_RIM",
    "material": "Metal",
    "color": "Black",
    "size": "L",
    "model": "AVIATOR",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    },
    "createdAt": "2024-09-01T10:45:00Z"
  },
  "inventory": {
    "id": 4,
    "quantity": 10,
    "sellingPrice": 110.0,
    "lastRestockedAt": "2024-09-01T10:45:00Z"
  },
  "parseDetails": {
    "scannedBarcode": "RAY-AVIATOR-L-BLACK-METAL-SUNGLASS",
    "parsingSuccess": true,
    "parsedData": {
      "companyName": "Ray-Ban",
      "eyewearType": "SUNGLASSES",
      "model": "AVIATOR",
      "size": "L",
      "color": "BLACK",
      "material": "METAL",
      "estimatedPrice": 100
    },
    "fallbackUsed": false,
    "autoCreatedCompany": false
  }
}
```

**What Happens:**

1. System receives scanned barcode
2. Intelligent parsing extracts: brand, model, size, color, material, type
3. Company is auto-found or auto-created if needed
4. Product is created with parsed data (can be overridden manually)
5. Initial inventory is created if quantity provided
6. Stock movement is recorded automatically

**Error Response (if barcode already exists):**

```json
{
  "error": "Product with barcode RAY-AVIATOR-L-BLACK-METAL-SUNGLASS already exists: Ray-Ban Aviator Classic"
}
```

---

---

### **Phase 2B: Barcode Management** 🏷️

#### **Step 2B.1: Generate Unique Barcode for Product**

**Endpoint:** `POST /api/barcode/generate/:productId`

**Authentication:** Required (JWT) - **Staff and above can generate**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Path:** Replace `:productId` with product ID (e.g., `1`)

**Request (Optional - auto-generates if empty):**

```json
{
  "quantity": 1
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "barcodes": [
    {
      "id": 1,
      "productId": 1,
      "barcode": "EYE00011234AB",
      "sku": "RB-AV-001",
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator Classic",
        "description": "Classic aviator sunglasses",
        "sku": "RB-AV-001",
        "basePrice": 100.0,
        "eyewearType": "SUNGLASSES",
        "frameType": "FULL_RIM",
        "material": "Metal",
        "color": "Gold",
        "size": "58mm",
        "company": {
          "id": 1,
          "name": "Ray-Ban"
        }
      },
      "shopInventory": [
        {
          "id": 1,
          "shopId": 1,
          "productId": 1,
          "quantity": 48,
          "minStockLevel": 5,
          "maxStockLevel": 100
        }
      ],
      "createdAt": "2024-09-01T10:30:00Z",
      "updatedAt": "2024-09-01T10:30:00Z"
    }
  ]
}
```

---

#### **Step 2B.2: Generate Barcode Label (PNG Image)**

**Endpoint:** `POST /api/barcode/label`

**Authentication:** Required (JWT) - **Staff and above can generate**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Request:**

```json
{
  "barcode": "EYE00011234AB",
  "productName": "Ray-Ban Aviator Classic"
}
```

**Response (200 OK):**

```
Binary PNG image (for printing)
Content-Type: image/png
```

**Response (if you want data URL):**

```json
{
  "success": true,
  "barcode": "EYE00011234AB",
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}
```

---

#### **Step 2B.3: Generate Multiple Barcodes (Bulk)**

**Endpoint:** `POST /api/barcode/bulk-generate`

**Authentication:** Required (JWT) - **Staff and above can generate**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Max:** 100 barcodes at a time

**Request:**

```json
{
  "quantity": 10,
  "productIds": [1, 2, 3]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "30 barcodes generated successfully (10 for each product)",
  "totalGenerated": 30,
  "barcodesByProduct": {
    "1": {
      "productName": "Ray-Ban Aviator Classic",
      "count": 10,
      "barcodes": ["EYE00011234AB", "EYE00011234AC", "EYE00011234AD"]
    },
    "2": {
      "productName": "Oakley Holbrook",
      "count": 10,
      "barcodes": ["EYE00021567CD", "EYE00021567CE", "EYE00021567CF"]
    },
    "3": {
      "productName": "Ray-Ban Wayfarer",
      "count": 10,
      "barcodes": ["EYE00031890EF", "EYE00031890FG", "EYE00031890GH"]
    }
  }
}
```

---

#### **Step 2B.4: Generate SKU for Product**

**Endpoint:** `POST /api/barcode/sku/generate/:productId`

**Authentication:** Required (JWT) - **Staff and above can generate**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Path:** Replace `:productId` with product ID

**Request (Optional - auto-generates if empty):**

```json
{
  "prefix": "RB"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "productId": 1,
  "sku": "RB-AV-001",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic",
    "sku": "RB-AV-001",
    "barcode": "EYE00011234AB"
  },
  "createdAt": "2024-09-01T10:30:00Z"
}
```

---

#### **Step 2B.5: Validate Barcode (Check if Unique)**

**Endpoint:** `GET /api/barcode/validate/:barcode`

**Authentication:** Required (JWT) - **All roles can validate**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Path:** Replace `:barcode` with barcode to check

**Response - If Unique (200 OK):**

```json
{
  "isValid": true,
  "isUnique": true,
  "barcode": "EYE00011234AB",
  "message": "Barcode is unique and valid"
}
```

**Response - If Already Exists (409 Conflict):**

```json
{
  "isValid": true,
  "isUnique": false,
  "barcode": "EYE00011234AB",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic",
    "sku": "RB-AV-001"
  },
  "message": "Barcode already assigned to a product"
}
```

**Response - If Invalid Format (400 Bad Request):**

```json
{
  "isValid": false,
  "isUnique": false,
  "message": "Invalid barcode format"
}
```

---

#### **Step 2B.6: Get Products Without Barcodes**

**Endpoint:** `GET /api/barcode/missing`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "productsWithoutBarcodes": [
    {
      "id": 2,
      "sku": "OAK-HOL-001",
      "name": "Oakley Holbrook",
      "description": "Premium sports sunglasses",
      "basePrice": 300.0,
      "barcode": null,
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Plastic",
      "color": "Black",
      "size": "55mm",
      "model": "OO9102",
      "company": {
        "id": 2,
        "name": "Oakley"
      },
      "shopInventory": [
        {
          "id": 2,
          "shopId": 1,
          "productId": 2,
          "quantity": 8,
          "minStockLevel": 5,
          "maxStockLevel": 50
        }
      ],
      "createdAt": "2024-08-02T09:30:00Z",
      "updatedAt": "2024-09-01T10:30:00Z"
    }
  ],
  "totalCount": 1
}
```

---

#### **Step 2B.7: Stock Using Barcode (Quick Add)**

**Endpoint:** `POST /api/inventory/stock-by-barcode`

**Authentication:** Required (JWT) - **Staff and above can add stock**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Use When:** You have barcode but not productId

**Request:**

```json
{
  "barcode": "EYE00011234AB",
  "quantity": 10,
  "costPrice": 80.0,
  "sellingPrice": 120.0
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Stock added successfully",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic",
    "barcode": "EYE00011234AB",
    "sku": "RB-AV-001"
  },
  "inventory": {
    "id": 1,
    "shopId": 1,
    "productId": 1,
    "quantity": 58,
    "sellingPrice": 120.0,
    "lastRestockedAt": "2024-09-01T11:00:00Z"
  },
  "movement": {
    "id": 1,
    "type": "STOCK_IN",
    "quantity": 10,
    "notes": "Stock added via barcode"
  }
}
```

---

#### **Step 2B.8: Remove Stock Using Barcode (Stock Out)**

**Endpoint:** `POST /api/inventory/stock-out-by-barcode`

**Authentication:** Required (JWT) - **Staff and above can remove stock**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Use When:** Removing stock using barcode

**Request:**

```json
{
  "barcode": "EYE00011234AB",
  "quantity": 2,
  "reason": "Damaged goods"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Stock removed successfully",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic",
    "barcode": "EYE00011234AB"
  },
  "inventory": {
    "id": 1,
    "quantity": 56,
    "productId": 1
  },
  "movement": {
    "id": 2,
    "type": "STOCK_OUT",
    "quantity": 2,
    "reason": "Damaged goods"
  }
}
```

---

#### **Step 3.1: Create Stock Receipt**

**Endpoint:** `POST /api/stock-receipts`

**Authentication:** Required (JWT) - **Staff and above can create**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Requires:** `productId` from Step 2.1

**Request:**

```json
{
  "productId": 1,
  "receivedQuantity": 50,
  "supplierName": "Vision Supplies Co.",
  "deliveryNote": "Monthly stock delivery",
  "batchNumber": "BATCH-202510",
  "expiryDate": "2027-10-08"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Stock receipt created successfully. Waiting for shop admin approval.",
  "receipt": {
    "id": 1,
    "shopId": 1,
    "productId": 1,
    "receivedQuantity": 50,
    "receivedByStaffId": 1,
    "supplierName": "Vision Supplies Co.",
    "deliveryNote": "Monthly stock delivery",
    "batchNumber": "BATCH-202510",
    "expiryDate": "2027-10-08T00:00:00Z",
    "status": "PENDING",
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator Classic",
      "sku": "RB-AV-001"
    },
    "createdAt": "2024-09-01T10:30:00Z"
  }
}
```

**At this point:** Stock is PENDING approval (NOT in inventory yet)

**Save this:** `receiptId = 1`

---

#### **Step 3.2: Get Stock Receipt by ID (Verify)**

**Endpoint:** `GET /api/stock-receipts/:id`

**Authentication:** Required (JWT) - **Staff and above can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Path:** Replace `:id` with receiptId from Step 3.1

**Response:**

```json
{
  "id": 1,
  "productId": 1,
  "receivedQuantity": 50,
  "status": "PENDING",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic"
  },
  "receivedByStaff": {
    "name": "John Staff"
  },
  "verifiedByAdmin": null,
  "createdAt": "2024-09-01T10:30:00Z"
}
```

---

#### **Step 3.3: Get All Stock Receipts (View Status)**

**Endpoint:** `GET /api/stock-receipts`

**Authentication:** Required (JWT) - **Staff and above can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Query Parameters:**

- `status`: PENDING, APPROVED, REJECTED, COMPLETED

**Response:**

```json
{
  "receipts": [
    {
      "id": 1,
      "status": "PENDING",
      "product": {
        "name": "Ray-Ban Aviator Classic"
      },
      "receivedQuantity": 50,
      "supplierName": "Vision Supplies Co."
    }
  ],
  "summary": {
    "total": 1,
    "pending": 1,
    "approved": 0,
    "rejected": 0,
    "completed": 0
  }
}
```

---

### **Phase 4: Stock Receipt Approval** ⭐ SHOP ADMIN ONLY

#### **Step 4.1: Approve Stock Receipt**

**Endpoint:** `PATCH /api/stock-receipts/:id/approve`

**Authentication:** Required (JWT) - **SHOP_ADMIN role ONLY**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Who Can Do This:** Shop Admin Only

**Path:** Replace `:id` with receiptId

**Request:** (empty body or optional notes)

```json
{
  "notes": "Stock verified and accepted"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Stock receipt approved. Stock added to inventory.",
  "receipt": {
    "id": 1,
    "status": "COMPLETED",
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator Classic"
    },
    "receivedQuantity": 50
  }
}
```

**What Happens:**

- Status changes from PENDING → COMPLETED
- Stock is NOW added to shopInventory table
- Product now has quantity = 50

---

#### **Step 4.2: Reject Stock Receipt (If needed)**

**Endpoint:** `PATCH /api/stock-receipts/:id/reject`

**Authentication:** Required (JWT) - **SHOP_ADMIN role ONLY**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Who Can Do This:** Shop Admin Only

**Request:**

```json
{
  "reason": "Damaged goods received"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Stock receipt rejected",
  "receipt": {
    "id": 1,
    "status": "REJECTED",
    "reason": "Damaged goods received"
  }
}
```

---

### **Phase 5: Stock Verification After Approval**

#### **Step 5.1: Get Product by ID (Check New Stock)**

**Endpoint:** `GET /api/inventory/product/:productId`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**After approval, response now shows:**

```json
{
  "id": 1,
  "name": "Ray-Ban Aviator Classic",
  "inventory": {
    "quantity": 50,           ← NOW HAS STOCK!
    "sellingPrice": 150.0,
    "stockStatus": {
      "currentStock": 50,
      "stockLevel": "MEDIUM",
      "statusMessage": "Stock available"
    }
  }
}
```

---

#### **Step 5.2: View Current Inventory**

**Endpoint:** `GET /api/inventory/`

**Authentication:** Required (JWT) - **All roles can view**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Response shows all products with current stock:**

```json
[
  {
    "id": 1,
    "productId": 1,
    "quantity": 50,
    "minStockLevel": 10,
    "maxStockLevel": 100,
    "product": {
      "name": "Ray-Ban Aviator Classic"
    },
    "stockLevel": "MEDIUM"
  }
]
```

---

### **Phase 6: Manual Stock Adjustment** (Alternative to Receipt)

#### **Step 6.1: Add Stock by Product ID (Direct)**

**Endpoint:** `POST /api/inventory/stock-in`

**Authentication:** Required (JWT) - **Staff and above can add**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Use When:** Manual stock addition without receipt (emergency/adjustment)

**Request:**

```json
{
  "productId": 1,
  "quantity": 10,
  "costPrice": 80.0,
  "sellingPrice": 120.0
}
```

**Response:**

```json
{
  "message": "Stock added successfully",
  "inventory": {
    "id": 1,
    "quantity": 60,           ← Updated from 50 to 60
    "productId": 1
  }
}
```

---

#### **Step 6.2: Remove Stock (Destock)**

**Endpoint:** `POST /api/inventory/stock-out`

**Authentication:** Required (JWT) - **Staff and above can remove**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Use When:** Removing damaged/expired goods

**Request:**

```json
{
  "productId": 1,
  "quantity": 5
}
```

**Response:**

```json
{
  "message": "Stock removed successfully",
  "inventory": {
    "id": 1,
    "quantity": 55,           ← Reduced from 60 to 55
    "productId": 1
  }
}
```

---

#### **Step 6.3: Stock by Barcode**

**Endpoint:** `POST /api/inventory/stock-by-barcode`

**Authentication:** Required (JWT) - **Staff and above can update**

**Headers:**

```json
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

**Use When:** Using barcode instead of productId

**Request:**

```json
{
  "barcode": "EYE00011234AB",
  "quantity": 10,
  "action": "add"
}
```

**Response:**

```json
{
  "message": "Stock updated successfully",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic",
    "barcode": "EYE00011234AB"
  }
}
```

---

## 📋 COMPLETE WORKFLOW SUMMARY TABLE

| Step     | Endpoint                                 | Method   | Requires       | Status                             | Can Staff Do? | Can Admin Do?   |
| -------- | ---------------------------------------- | -------- | -------------- | ---------------------------------- | ------------- | --------------- |
| 1.1      | `/inventory/company`                     | POST     | -              | Creates company                    | ❌ Admin      | ✅ YES          |
| 1.2      | `/inventory/companies`                   | GET      | -              | Lists companies                    | ✅ YES        | ✅ YES          |
| 2.1      | `/inventory/product`                     | POST     | companyId      | Creates product                    | ✅ YES        | ✅ YES          |
| 2.2      | `/inventory/product/:id`                 | GET      | productId      | Views product                      | ✅ YES        | ✅ YES          |
| 2.3      | `/inventory/product/:id`                 | PUT      | productId      | Updates product                    | ✅ YES        | ✅ YES          |
| 2.4      | `/inventory/products`                    | GET      | -              | Lists all products                 | ✅ YES        | ✅ YES          |
| 2.5      | `/inventory/product/barcode/:barcode`    | GET      | barcode        | Get by barcode                     | ✅ YES        | ✅ YES          |
| 2.6      | `/inventory/company/:companyId/products` | GET      | companyId      | Get company products               | ✅ YES        | ✅ YES          |
| **2.7**  | **/inventory/product/scan-to-add**       | **POST** | **barcode**    | **Create product by barcode scan** | **✅ YES**    | **✅ YES**      |
| **2B.1** | **/barcode/generate/:productId**         | **POST** | **productId**  | **Generate barcode**               | **✅ YES**    | **✅ YES**      |
| **2B.2** | **/barcode/label**                       | **POST** | **barcode**    | **Print label (PNG)**              | **✅ YES**    | **✅ YES**      |
| **2B.3** | **/barcode/bulk-generate**               | **POST** | **productIds** | **Bulk barcodes**                  | **✅ YES**    | **✅ YES**      |
| **2B.4** | **/barcode/sku/generate/:productId**     | **POST** | **productId**  | **Generate SKU**                   | **✅ YES**    | **✅ YES**      |
| **2B.5** | **/barcode/validate/:barcode**           | **GET**  | **barcode**    | **Check uniqueness**               | **✅ YES**    | **✅ YES**      |
| **2B.6** | **/barcode/missing**                     | **GET**  | -              | **No barcode products**            | **✅ YES**    | **✅ YES**      |
| **2B.7** | **/inventory/stock-by-barcode**          | **POST** | **barcode**    | **Add stock via barcode**          | **✅ YES**    | **✅ YES**      |
| **2B.8** | **/inventory/stock-out-by-barcode**      | **POST** | **barcode**    | **Remove stock via barcode**       | **✅ YES**    | **✅ YES**      |
| 3.1      | `/stock-receipts`                        | POST     | productId      | Creates receipt (PENDING)          | ✅ YES        | ✅ YES          |
| 3.2      | `/stock-receipts/:id`                    | GET      | receiptId      | Views receipt                      | ✅ YES        | ✅ YES          |
| 3.3      | `/stock-receipts`                        | GET      | -              | Lists all receipts                 | ✅ YES        | ✅ YES          |
| 4.1      | `/stock-receipts/:id/approve`            | PATCH    | receiptId      | **Approves receipt (COMPLETED)**   | ❌ NO         | ✅ **YES ONLY** |
| 4.2      | `/stock-receipts/:id/reject`             | PATCH    | receiptId      | Rejects receipt                    | ❌ NO         | ✅ **YES ONLY** |
| 5.1      | `/inventory/product/:id`                 | GET      | productId      | Checks updated stock               | ✅ YES        | ✅ YES          |
| 5.2      | `/inventory/`                            | GET      | -              | Views all inventory                | ✅ YES        | ✅ YES          |
| 6.1      | `/inventory/stock-in`                    | POST     | productId      | Direct stock add (bypass receipt)  | ✅ YES        | ✅ YES          |
| 6.2      | `/inventory/stock-out`                   | POST     | productId      | Remove stock                       | ✅ YES        | ✅ YES          |
| 6.3      | `/inventory/stock-by-barcode`            | POST     | barcode        | Update via barcode                 | ✅ YES        | ✅ YES          |

---

## 🎯 TYPICAL WORKFLOW SCENARIO

### Scenario: New Shipment of Ray-Ban Sunglasses Arrives

**Day 1 - Monday Morning:**

1. **Admin adds company** (if not exists):

   ```
   POST /api/inventory/company
   → companyId = 1 (Ray-Ban)
   ```

2. **Staff adds product**:

   ```
   POST /api/inventory/product
   → productId = 1 (Ray-Ban Aviator)
   ```

3. **Staff generates barcode** (if not auto-assigned):

   ```
   POST /api/barcode/generate/1
   → barcode = "EYE00011234AB"
   ```

4. **Staff generates barcode label** (optional - for printing):

   ```
   POST /api/barcode/label
   → Returns PNG image for printing
   ```

5. **Staff validates barcode uniqueness**:

   ```
   GET /api/barcode/validate/EYE00011234AB
   → Returns isUnique: true ✅
   ```

6. **Staff creates stock receipt**:

   ```
   POST /api/stock-receipts
   → receiptId = 1 (50 units, PENDING)
   Status: PENDING ⏳
   ```

7. **Staff verifies receipt**:
   ```
   GET /api/stock-receipts/1
   → Status still PENDING
   ```

**Day 1 - Afternoon (Admin Inspection):**

8. **Admin approves receipt**:
   ```
   PATCH /api/stock-receipts/1/approve
   Status: COMPLETED ✅
   Stock is NOW in inventory!
   ```

**Day 2 - Verification & Sales:**

9. **Staff checks product stock by barcode**:

   ```
   GET /api/inventory/product/barcode/EYE00011234AB
   → quantity = 50 ✅
   → Can now sell!
   ```

10. **Staff checks all inventory**:

    ```
    GET /api/inventory/
    → Shows Ray-Ban Aviator with quantity 50
    ```

11. **Staff sells 2 units (stock out)**:
    ```
    POST /api/inventory/stock-out-by-barcode
    barcode: "EYE00011234AB", quantity: 2
    → quantity now = 48
    ```

## ⚠️ IMPORTANT NOTES

### Company Addition

- ✅ **Must be done FIRST** before any products
- Only admin can add companies
- Cannot create duplicate companies (name is unique)

### Product Addition

- ✅ **Requires valid companyId**
- Staff can add products
- Barcode must be unique
- SKU must be unique
- Product starts with 0 stock

### Stock Receipt Flow

- ✅ **Receipt is PENDING until approved**
- Staff creates receipts
- **Only admin can approve/reject**
- Stock ONLY appears after approval
- Cannot sell products until approved

### Direct Stock Add (No Receipt)

- ✅ Can bypass receipt system
- Use `/stock-in` for manual additions
- Useful for emergency restocking
- Doesn't need admin approval

---

## 🔄 DECISION TREE

```
START: Need to add stock?
│
├─→ NEW COMPANY?
│   └─→ POST /api/inventory/company ✅
│       │
│       └─→ Save companyId
│
├─→ NEW PRODUCT?
│   ├─→ Create manually with details?
│   │   └─→ POST /api/inventory/product ✅
│   │       │
│   │       ├─→ Product needs BARCODE?
│   │       │   └─→ POST /api/barcode/generate/:productId ✅
│   │       │       │
│   │       │       ├─→ Need LABEL for printing?
│   │       │       │   └─→ POST /api/barcode/label ✅
│   │       │       │       └─→ Returns PNG image
│   │       │       │
│   │       │       └─→ Need to validate uniqueness?
│   │       │           └─→ GET /api/barcode/validate/:barcode ✅
│   │       │               └─→ Returns isUnique: true/false
│   │       │
│   │       ├─→ Need to find products WITHOUT barcodes?
│   │       │   └─→ GET /api/barcode/missing ✅
│   │       │
│   │       ├─→ Find product BY BARCODE?
│   │       │   └─→ GET /api/inventory/product/barcode/:barcode ✅
│   │       │
│   │       ├─→ Get all products from THIS company?
│   │       │   └─→ GET /api/inventory/company/:companyId/products ✅
│   │       │
│   │       └─→ Save productId
│   │
│   └─→ Create by SCANNING barcode (Auto-parse)?
│       └─→ POST /api/inventory/product/scan-to-add ✅
│           │
│           ├─→ System auto-extracts: brand, model, color, material, type
│           ├─→ Company auto-created if needed
│           ├─→ Initial stock can be set
│           │
│           └─→ Product ready to use!
│
├─→ Stock arrival via SUPPLIER (Official)?
│   └─→ POST /api/stock-receipts ✅
│       │
│       ├─→ Need SKU generated?
│       │   └─→ POST /api/barcode/sku/generate/:productId ✅
│       │
│       └─→ Status = PENDING (Wait for admin approval)
│           │
│           └─→ PATCH /api/stock-receipts/:id/approve ✅
│               └─→ Status = COMPLETED
│                   └─→ Stock now in system!
│
├─→ BULK generate barcodes (Multiple products)?
│   └─→ POST /api/barcode/bulk-generate ✅
│       └─→ Max 100 barcodes at once
│
├─→ Add stock BY BARCODE (Quick)?
│   └─→ POST /api/inventory/stock-by-barcode ✅
│       └─→ Stock added immediately!
│
├─→ Remove stock BY BARCODE?
│   └─→ POST /api/inventory/stock-out-by-barcode ✅
│       └─→ Stock removed immediately!
│
├─→ EMERGENCY stock addition (No receipt)?
│   └─→ POST /api/inventory/stock-in ✅
│       └─→ Stock added immediately!
│
└─→ Remove stock (Damaged/Expired)?
    └─→ POST /api/inventory/stock-out ✅
        └─→ Stock removed immediately!
```

---

## 📞 Common Questions

**Q: Can I create a product without a company?**
A: No. Company MUST exist first.

**Q: Can staff approve stock receipts?**
A: No. Only shop admin can approve/reject receipts.

**Q: What happens if I add stock directly without receipt?**
A: It bypasses the approval process and adds immediately to inventory.

**Q: Can I sell products before receipt is approved?**
A: No. Stock only counts after receipt approval.

**Q: Can I have duplicate company names?**
A: No. Company names are unique in the system.

**Q: What if I need to add stock urgently?**
A: Use `/stock-in` endpoint to bypass receipt system.

---

## 🏷️ BARCODE RELATED QUESTIONS

**Q: Is barcode required for a product?**
A: No. Products can exist without barcodes, but recommended for inventory tracking.

**Q: Can I generate barcode manually?**
A: Yes. Use `POST /api/barcode/generate/:productId` to create barcode.

**Q: Can I have duplicate barcodes?**
A: No. Every barcode must be unique. Use `GET /api/barcode/validate/:barcode` to check.

**Q: What's the difference between barcode and SKU?**
A:

- **SKU** = Stock Keeping Unit (e.g., RB-AV-001) - for product identification
- **Barcode** = EAN/UPC code (e.g., EYE00011234AB) - for scanning/POS systems

**Q: Can I generate barcodes in bulk?**
A: Yes. Use `POST /api/barcode/bulk-generate` to generate up to 100 at once.

**Q: What happens if I don't assign a barcode?**
A: Product still works but you cannot use barcode-based operations. View missing barcodes with `GET /api/barcode/missing`.

**Q: Can I update a barcode?**
A: No. Update the product details with `PUT /api/inventory/product/:productId`, but barcode cannot be changed after assignment.

**Q: Can I add stock using barcode instead of productId?**
A: Yes. Use `POST /api/inventory/stock-by-barcode` for quick stock addition.

**Q: Can I generate a printable label for the barcode?**
A: Yes. Use `POST /api/barcode/label` to get PNG image for printing.

**Q: What's the barcode format?**
A: Format is `EYE` + category + sequence (e.g., EYE00011234AB)

- Position 1-3: `EYE` (fixed)
- Position 4-6: Category code (001=SUNGLASSES, 002=GLASSES, etc.)
- Position 7-13: Sequence number
- Position 14-15: Check digits

---

## 🎫 BARCODE SCANNING TO ADD PRODUCTS

**Q: Can I create a product just by scanning a barcode?**
A: Yes! Use `POST /api/inventory/product/scan-to-add` with ONLY the scanned barcode. System auto-parses everything!

**Q: What information does the system auto-extract from barcode?**
A: The system intelligently extracts:

- Brand/Company name
- Model/Product type
- Color
- Material
- Size
- Eyewear type (SUNGLASSES, READING, etc.)
- Frame type (FULL_RIM, HALF_RIM, etc.)

**Q: What barcode formats are supported?**
A: Three formats supported:

1. **Structured:** `RAY-AVIATOR-L-BLACK-METAL-SUNGLASS` (Brand-Model-Size-Color-Material-Type)
2. **Simple:** `RAY001234567890` (Brand + Numbers)
3. **Custom:** Any barcode (system uses intelligent fallback parsing)

**Q: What if the barcode doesn't parse correctly?**
A: You can override any field manually in the request:

```json
{
  "scannedBarcode": "UNKNOWN-BARCODE-123",
  "name": "Ray-Ban Aviator",
  "eyewearType": "SUNGLASSES",
  "basePrice": 100.0
}
```

**Q: Can I add initial stock while creating product by scan?**
A: Yes! Include `quantity` in request and system creates inventory immediately.

**Q: Will company be auto-created if it doesn't exist?**
A: Yes. System auto-creates company based on parsed brand name, or you can specify `companyId`.

**Q: Can I override the selling price after scan?**
A: Yes. Include `sellingPrice` in request to override default price.

**Q: What if barcode already exists?**
A: System returns error and suggests existing product name/ID.

**Q: Is scan-to-add faster than manual product creation?**
A: YES! Manual creation requires 20+ fields. Scan-to-add requires ONLY the barcode - everything else is auto-filled!

---
