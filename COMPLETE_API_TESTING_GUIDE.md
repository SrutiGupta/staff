## 2️⃣ COMPANY MANAGEMENT ENDPOINTS

### 2.1 Add Company/Brand

```
POST /api/inventory/company
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "name": "Ray-Ban",
  "description": "Premium sunglasses and eyewear brand"
}
```

**Response Body:**

```json
{
  "id": 1,
  "name": "Ray-Ban",
  "description": "Premium sunglasses and eyewear brand",
  "createdAt": "2025-09-03T10:30:00.000Z",
  "updatedAt": "2025-09-03T10:30:00.000Z"
}
```

### 2.2 Get All Companies

```
GET /api/inventory/companies
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
[
  {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium sunglasses and eyewear brand",
    "createdAt": "2025-09-03T10:30:00.000Z",
    "updatedAt": "2025-09-03T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Oakley",
    "description": "Sports and lifestyle eyewear"
  }
]
```

### 2.3 Get Company Products

```
GET /api/inventory/company/1/products
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
{
  "company": {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium sunglasses and eyewear brand"
  },
  "products": [
    {
      "id": 3,
      "name": "Ray-Ban Aviator Classic",
      "price": 150.0,
      "barcode": "RB3025001",
      "sku": "RAY-SUN-AVI-0003-5678",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR"
    }
  ]
}
```

---

## 3️⃣ PRODUCT MANAGEMENT ENDPOINTS

### 3.1 Add New Product

```
POST /api/inventory/product
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses with metal frame",
  "price": 150.0,
  "barcode": "RB3025001",
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "L",
  "model": "RB3025"
}
```

**Response Body:**

```json
{
  "id": 3,
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses with metal frame",
  "price": 150.0,
  "barcode": "RB3025001",
  "sku": null,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "L",
  "model": "RB3025",
  "createdAt": "2025-09-03T10:30:00.000Z",
  "updatedAt": "2025-09-03T10:30:00.000Z"
}
```

**Valid EyewearType Values:**

- `GLASSES`
- `SUNGLASSES`
- `LENSES`

**Valid FrameType Values:**

- `RECTANGULAR`, `OVAL`, `ROUND`, `SQUARE`
- `AVIATOR`, `WAYFARER`, `CAT_EYE`, `CLUBMASTER`
- `RIMLESS`, `SEMI_RIMLESS`, `WRAP_AROUND`

### 3.2 Update Product

```
PUT /api/inventory/product/3
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "name": "Ray-Ban Aviator Classic Updated",
  "price": 160.0,
  "color": "Black"
}
```

**Response Body:**

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 3,
    "name": "Ray-Ban Aviator Classic Updated",
    "price": 160.0,
    "color": "Black",
    "updatedAt": "2025-09-03T11:00:00.000Z"
  }
}
```

### 3.3 Get All Products (Basic)

```
GET /api/product
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
[
  {
    "id": 3,
    "name": "Ray-Ban Aviator Classic",
    "price": 150.0,
    "barcode": "RB3025001",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR"
  }
]
```

---

## 4️⃣ BARCODE SYSTEM ENDPOINTS

### 4.1 Generate Barcode for Product

```
POST /api/barcode/generate/3
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "companyPrefix": "RAY"
}
```

**Response Body:**

```json
{
  "message": "Barcode generated successfully",
  "product": {
    "id": 3,
    "name": "Ray-Ban Aviator Classic",
    "barcode": "RAY0003567890",
    "sku": null,
    "eyewearType": "SUNGLASSES",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    }
  },
  "generatedBarcode": "RAY0003567890",
  "canNowScan": true,
  "nextStep": "Use this barcode for stock-in/stock-out operations"
}
```

### 4.2 Generate SKU for Product

```
POST /api/barcode/sku/generate/3
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "companyCode": "RAY"
}
```

**Response Body:**

```json
{
  "message": "SKU generated successfully",
  "product": {
    "id": 3,
    "sku": "RAY-SUN-AVI-0003-5678",
    "name": "Ray-Ban Aviator Classic"
  },
  "generatedSKU": "RAY-SUN-AVI-0003-5678",
  "skuBreakdown": {
    "company": "RAY",
    "eyewearType": "SUN",
    "frameType": "AVI",
    "productId": "0003",
    "timestamp": "5678"
  },
  "nextStep": "SKU can now be used for internal tracking and inventory management"
}
```

### 4.3 Get Products Without Barcodes

```
GET /api/barcode/missing
```

**Auth Required:** ✅ Yes

**Query Parameters (Optional):**

```
?companyId=1&eyewearType=SUNGLASSES
```

**Request Body:** None

**Response Body:**

```json
{
  "message": "Products without barcodes found",
  "count": 2,
  "products": [
    {
      "id": 5,
      "name": "Local Brand Reading Glasses",
      "eyewearType": "GLASSES",
      "company": {
        "id": 3,
        "name": "Local Brand"
      },
      "barcode": null
    }
  ],
  "suggestion": "Use POST /api/barcode/generate/:productId to generate barcodes for these products"
}
```

### 4.4 Generate Barcode Label

```
POST /api/barcode/label
```

**Auth Required:** ✅ Yes

**Request Body (Option 1 - With Product ID):**

```json
{
  "productId": 3
}
```

**Request Body (Option 2 - Manual Details):**

```json
{
  "name": "Custom Product",
  "description": "Custom description",
  "price": "$99.99",
  "data": "CUSTOM123456",
  "bcid": "code128",
  "scale": 3,
  "height": 20
}
```

**Response:** PNG image file (barcode label)

### 4.5 Legacy Barcode Label Generation

```
POST /api/barcode
```

**Auth Required:** ✅ Yes

**Request Body:** (Same as 4.4)

**Response:** PNG image file (barcode label)

**Note:** This is a legacy route for backward compatibility

### 4.6 Get Products Without SKUs

```
GET /api/barcode/sku/missing
```

**Auth Required:** ✅ Yes

**Query Parameters (Optional):**

```
?companyId=1&eyewearType=SUNGLASSES
```

**Request Body:** None

**Response Body:**

```json
{
  "message": "Products without SKUs found",
  "count": 3,
  "products": [
    {
      "id": 4,
      "name": "Oakley Frogskins",
      "sku": null,
      "barcode": "OAK789456",
      "eyewearType": "SUNGLASSES",
      "company": {
        "id": 2,
        "name": "Oakley"
      }
    }
  ],
  "suggestion": "Use POST /api/barcode/sku/generate/:productId to generate SKUs for these products"
}
```

---

## 5️⃣ PRODUCT ENLISTING (BARCODE LOOKUP) ENDPOINTS

### 5.1 Product Lookup by Barcode Scan

```
GET /api/inventory/product/barcode/RB3025001
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
{
  "success": true,
  "message": "Product found successfully",
  "product": {
    "id": 3,
    "sku": "RAY-SUN-AVI-0003-5678",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with metal frame",
    "price": 150.0,
    "barcode": "RB3025001",

    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",

    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "description": "Premium sunglasses and eyewear brand"
    },

    "material": "Metal",
    "color": "Gold",
    "size": "L",
    "model": "RB3025",

    "inventory": {
      "quantity": 25,
      "lastUpdated": "2025-09-03T10:30:00.000Z",
      "stockStatus": "In Stock"
    },

    "createdAt": "2025-09-03T09:00:00.000Z",
    "updatedAt": "2025-09-03T10:30:00.000Z"
  },
  "scanResult": {
    "scannedBarcode": "RB3025001",
    "productFound": true,
    "quickInfo": "Ray-Ban SUNGLASSES - Ray-Ban Aviator Classic ($150)"
  }
}
```

---

## 6️⃣ INVENTORY MANAGEMENT ENDPOINTS

### 6.1 Get All Inventory

```
GET /api/inventory
```

**Auth Required:** ✅ Yes

**Query Parameters (Optional):**

```
?eyewearType=SUNGLASSES&companyId=1&frameType=AVIATOR
```

**Request Body:** None

**Response Body:**

```json
{
  "inventory": [
    {
      "id": 3,
      "productId": 3,
      "quantity": 25,
      "lastUpdated": "2025-09-03T10:30:00.000Z",
      "product": {
        "id": 3,
        "sku": "RAY-SUN-AVI-0003-5678",
        "name": "Ray-Ban Aviator Classic",
        "barcode": "RB3025001",
        "price": 150.0,
        "eyewearType": "SUNGLASSES",
        "frameType": "AVIATOR",
        "company": {
          "id": 1,
          "name": "Ray-Ban"
        }
      },
      "stockStatus": "In Stock",
      "stockLevel": "HIGH"
    }
  ],
  "summary": {
    "totalProducts": 1,
    "totalStock": 25,
    "byEyewearType": {
      "SUNGLASSES": 1,
      "GLASSES": 0,
      "LENSES": 0
    }
  }
}
```

---

## 7️⃣ STOCK OPERATIONS ENDPOINTS

### 7.1 Stock-In by Barcode (Dedicated)

```
POST /api/inventory/stock-by-barcode
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "barcode": "RB3025001",
  "quantity": 10,
  "price": 155.0
}
```

**Response Body:**

```json
{
  "success": true,
  "message": "Stock updated successfully via barcode scan",
  "inventory": {
    "id": 3,
    "productId": 3,
    "quantity": 35,
    "lastUpdated": "2025-09-03T11:00:00.000Z"
  },
  "productDetails": {
    "id": 3,
    "sku": "RAY-SUN-AVI-0003-5678",
    "barcode": "RB3025001",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with metal frame",

    "model": "RB3025",
    "size": "L",
    "color": "Gold",
    "material": "Metal",
    "price": 155.0,

    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",

    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "description": "Premium sunglasses and eyewear brand"
    }
  },
  "stockInDetails": {
    "method": "barcode_scan",
    "scannedBarcode": "RB3025001",
    "productName": "Ray-Ban Aviator Classic",
    "productId": 3,
    "sku": "RAY-SUN-AVI-0003-5678",
    "model": "RB3025",
    "size": "L",
    "color": "Gold",
    "price": 155.0,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "addedQuantity": 10,
    "newQuantity": 35,
    "previousQuantity": 25,
    "stockOperation": "STOCK_IN",
    "timestamp": "2025-09-03T11:00:00.000Z"
  },
  "inventoryStatus": {
    "currentStock": 35,
    "stockLevel": "HIGH",
    "statusMessage": "In Stock"
  }
}
```

### 7.2 Stock-In (Enhanced Traditional)

```
POST /api/inventory/stock-in
```

**Auth Required:** ✅ Yes

**Request Body (Option 1 - By Barcode):**

```json
{
  "barcode": "RB3025001",
  "quantity": 5
}
```

**Request Body (Option 2 - By Product ID):**

```json
{
  "productId": 3,
  "quantity": 5
}
```

**Response Body:** (Similar to stock-by-barcode with method indicated)

### 7.3 Stock-Out by Barcode (Dedicated)

```
POST /api/inventory/stock-out-by-barcode
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "barcode": "RB3025001",
  "quantity": 3
}
```

**Response Body:**

```json
{
  "success": true,
  "message": "Stock-out successful via barcode scan",
  "inventory": {
    "id": 3,
    "productId": 3,
    "quantity": 32,
    "lastUpdated": "2025-09-03T11:05:00.000Z"
  },
  "productDetails": {
    "id": 3,
    "sku": "RAY-SUN-AVI-0003-5678",
    "barcode": "RB3025001",
    "name": "Ray-Ban Aviator Classic"
  },
  "stockOutDetails": {
    "method": "barcode_scan",
    "scannedBarcode": "RB3025001",
    "removedQuantity": 3,
    "newQuantity": 32,
    "previousQuantity": 35,
    "stockOperation": "STOCK_OUT",
    "timestamp": "2025-09-03T11:05:00.000Z"
  },
  "inventoryStatus": {
    "currentStock": 32,
    "stockLevel": "HIGH",
    "statusMessage": "In Stock"
  }
}
```

### 7.4 Stock-Out (Enhanced Traditional)

```
POST /api/inventory/stock-out
```

**Auth Required:** ✅ Yes

**Request Body (Option 1 - By Barcode):**

```json
{
  "barcode": "RB3025001",
  "quantity": 2
}
```

**Request Body (Option 2 - By Product ID):**

```json
{
  "productId": 3,
  "quantity": 2
}
```

**Response Body:** (Similar to stock-out-by-barcode)

---

## 8️⃣ REPORTING ENDPOINTS (EYEWEAR-SPECIFIC)

### 8.1 Daily Sales Report

```
GET /api/reporting/daily
```

**Auth Required:** ✅ Yes

**Query Parameters (Optional):**

```
?date=2025-09-03
```

**Request Body:** None

**Response Body:**

```json
{
  "date": "2025-09-03",
  "attendance": [
    {
      "staffId": 1,
      "name": "John Doe",
      "loginTime": "2025-09-03T09:00:00.000Z",
      "logoutTime": "2025-09-03T17:00:00.000Z"
    }
  ],
  "inventory": [
    {
      "id": 3,
      "quantity": 35,
      "product": {
        "name": "Ray-Ban Aviator Classic",
        "eyewearType": "SUNGLASSES",
        "company": { "name": "Ray-Ban" }
      }
    }
  ]
}
```

### 8.2 Monthly Sales Report

```
GET /api/reporting/monthly
```

**Auth Required:** ✅ Yes

**Query Parameters (Optional):**

```
?month=2025-09
```

**Request Body:** None

**Response Body:**

```json
{
  "month": "2025-09",
  "attendance": [...],
  "inventory": [...],
  "summary": {
    "totalStaff": 5,
    "totalProducts": 25,
    "totalStock": 1250
  }
}
```

### 8.3 Staff Sales Report

```
GET /api/reporting/staff-sales
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
{
  "staffSales": [
    {
      "staffId": 1,
      "name": "John Doe",
      "totalSales": 15000.0,
      "totalInvoices": 45,
      "eyewearBreakdown": {
        "SUNGLASSES": 8000.0,
        "GLASSES": 5000.0,
        "LENSES": 2000.0
      }
    }
  ]
}
```

### 8.4 Sales by Price Tier

```
GET /api/reporting/sales-by-price-tier
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
{
  "priceTiers": {
    "budget": {
      "range": "Under $100",
      "totalSales": 25000.0,
      "products": ["Local Brand Glasses", "Reading Glasses"]
    },
    "premium": {
      "range": "$100-$200",
      "totalSales": 75000.0,
      "products": ["Ray-Ban Aviator", "Oakley Frogskins"]
    },
    "luxury": {
      "range": "Over $200",
      "totalSales": 35000.0,
      "products": ["Designer Frames", "Premium Lenses"]
    }
  }
}
```

### 8.5 Best Sellers by Price Tier

```
GET /api/reporting/best-sellers-by-price-tier
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
{
  "bestSellers": {
    "budget": [
      {
        "id": 7,
        "name": "Local Brand Reading Glasses",
        "totalSold": 125,
        "revenue": 3750.0,
        "eyewearType": "GLASSES"
      }
    ],
    "premium": [
      {
        "id": 3,
        "name": "Ray-Ban Aviator Classic",
        "totalSold": 85,
        "revenue": 12750.0,
        "eyewearType": "SUNGLASSES"
      }
    ]
  }
}
```

---

## 9️⃣ CUSTOMER MANAGEMENT ENDPOINTS

### 9.1 Create Customer Invoice

```
POST /api/customer/invoice
```

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "customer": {
    "name": "John Customer",
    "phone": "+1234567890",
    "email": "john@customer.com",
    "address": "123 Main St, City"
  },
  "items": [
    {
      "productId": 3,
      "quantity": 1,
      "price": 150.0
    }
  ],
  "paymentMethod": "CASH"
}
```

**Response Body:**

```json
{
  "customer": {
    "id": 15,
    "name": "John Customer",
    "phone": "+1234567890",
    "email": "john@customer.com"
  },
  "invoice": {
    "id": "inv_abc123",
    "total": 150.00,
    "items": [...],
    "createdAt": "2025-09-03T11:30:00.000Z"
  }
}
```

### 9.2 Get Customer Address Hotspots

```
GET /api/customer/hotspots
```

**Auth Required:** ✅ Yes

**Request Body:** None

**Response Body:**

```json
{
  "hotspots": [
    {
      "area": "Downtown",
      "customerCount": 125,
      "totalSales": 45000.0
    },
    {
      "area": "Uptown",
      "customerCount": 98,
      "totalSales": 38500.0
    }
  ]
}
```

---

## 🔟 ERROR RESPONSES

### Authentication Error

```json
{
  "error": "Access denied. No token provided."
}
```

### Invalid Token

```json
{
  "error": "Invalid token."
}
```

### Product Not Found (Barcode)

```json
{
  "success": false,
  "error": "Product with barcode RB3025999 not found",
  "suggestion": "Check if the barcode is correct or if the product needs to be added to the system."
}
```

### Insufficient Stock

```json
{
  "success": false,
  "error": "Insufficient stock. Available: 5, Requested: 10",
  "availableStock": 5,
  "requestedQuantity": 10
}
```

### Validation Error

```json
{
  "error": "Barcode and quantity are required.",
  "examples": {
    "barcodeScan": { "barcode": "RB3025001", "quantity": 10 }
  }
}
```

---

## 9️⃣ POSTMAN TESTING SEQUENCE

### Step 1: Setup Environment

1. Create new Postman environment
2. Add variable: `baseUrl` = `http://localhost:8080`
3. Add variable: `token` = (will be set after login)

### Step 2: Authentication

1. **Register Staff** → Get staff created
2. **Login Staff** → Copy token and set in environment variable
3. Set Authorization header for all subsequent requests: `Bearer {{token}}`

### Step 3: Company & Product Setup

1. **Add Company** (Ray-Ban)
2. **Add Company** (Oakley)
3. **Get All Companies** → Verify companies exist
4. **Add Product** → Create eyewear products
5. **Generate Barcode** → For products without barcodes
6. **Generate SKU** → For internal tracking

### Step 4: Product Enlisting Tests

1. **Product Lookup by Barcode** → Test barcode scanning
2. **Get Products Without Barcodes** → Find products needing barcodes
3. **Get Products Without SKUs** → Find products needing SKUs
4. **Get Company Products** → View products by brand

### Step 5: Inventory Operations

1. **Get All Inventory** → See current stock levels
2. **Stock-In by Barcode** → Add inventory via scanning
3. **Stock-Out by Barcode** → Remove inventory via scanning
4. **Stock-In Traditional** → Add inventory by product ID
5. **Get All Inventory** → Verify stock changes

### Step 6: Reporting & Analytics

1. **Daily Report** → Check daily sales and inventory
2. **Monthly Report** → Check monthly performance
3. **Staff Sales** → View staff performance
4. **Price Tier Analysis** → Analyze sales by price ranges
5. **Best Sellers** → Check top-performing products

### Step 7: Customer Management

1. **Create Customer Invoice** → Test walk-in customer flow
2. **Get Customer Hotspots** → Analyze customer locations

### Step 8: Advanced Testing

1. Test with invalid barcodes → Verify error handling
2. Test insufficient stock scenarios → Verify validation
3. Test price updates during stock-in → Verify price changes
4. Test different eyewear types and frame types
5. Test all filter parameters → eyewearType, companyId, frameType

---

## 🎯 COMPLETE TESTING CHECKLIST

### Authentication ✅

- [ ] Register staff successfully
- [ ] Login and receive JWT token
- [ ] Access protected endpoints with token
- [ ] Verify unauthorized access blocked

### Company Management ✅

- [ ] Add companies (Ray-Ban, Oakley, Local Brand)
- [ ] Get all companies list
- [ ] Get products by company

### Product Management ✅

- [ ] Add products with eyewear categorization
- [ ] Update product details
- [ ] Test all eyewear types (GLASSES, SUNGLASSES, LENSES)
- [ ] Test all frame types (AVIATOR, RECTANGULAR, etc.)

### Barcode System ✅

- [ ] Generate barcodes for products
- [ ] Generate SKUs for products
- [ ] Find products without barcodes
- [ ] Find products without SKUs
- [ ] Generate barcode labels
- [ ] Test legacy barcode generation route

### Product Enlisting ✅

- [ ] Scan barcode to view complete product details
- [ ] Verify all information returned (ID, SKU, barcode, specs)
- [ ] Test with invalid barcodes

### Inventory Operations ✅

- [ ] View all inventory with filters
- [ ] Stock-in via barcode scanning
- [ ] Stock-out via barcode scanning
- [ ] Stock-in via product ID
- [ ] Stock-out via product ID
- [ ] Verify quantity updates
- [ ] Test price updates during stock-in

### Reporting & Analytics ✅

- [ ] Generate daily sales reports
- [ ] Generate monthly sales reports
- [ ] View staff sales performance
- [ ] Analyze sales by price tier
- [ ] Check best sellers by price tier

### Customer Management ✅

- [ ] Create customer invoices
- [ ] Get customer address hotspots
- [ ] Test walk-in customer flow

### Error Handling ✅

- [ ] Invalid barcode responses
- [ ] Insufficient stock validation
- [ ] Missing authentication
- [ ] Invalid data validation

**Your complete eyewear inventory, barcode, reporting, and customer system is ready for comprehensive testing!** 🎉
