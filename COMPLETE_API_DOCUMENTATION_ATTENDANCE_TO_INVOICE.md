# 🔧 Staff Management System API Documentation

**Complete Route Documentation from Attendance to Invoice Controllers**

## 📋 Table of Contents

1. [Attendance Controller](#attendance-controller)
2. [Auth Controller](#auth-controller)
3. [Barcode Controller](#barcode-controller)
4. [Customer Controller](#customer-controller)
5. [Gift Card Controller](#gift-card-controller)
6. [Inventory Controller](#inventory-controller)
7. [Invoice Controller](#invoice-controller)

---

## 📊 Attendance Controller

### Base URL: `/api/attendance`

#### 2. **GET** `/`

- **Description**: Get all attendance records for the shop
- **Authentication**: Required shopadmin dont include(JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <jwt_token>"
  }
  ```
- **Request Body**: None
- **Response**:
  ```json
  [
    {
      "id": 1,
      "staffId": 1,
      "loginTime": "2023-09-25T09:00:00.000Z",
      "logoutTime": "2023-09-25T17:00:00.000Z",
      "staff": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
  ```

#### 3. **GET** `/:staffId`

- **Description**: Get attendance records for specific staff member shopadmin
- **Authentication**: Required (JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <jwt_token>"
  }
  ```
- **Path Parameters**:
  - `staffId` (integer): Staff member ID
- **Response**: Same as above, filtered by staffId
- **Error Responses**:
  - `403`: Access denied. Staff belongs to different shop
  - `500`: Something went wrong

---

## 🔐 Auth Controller

### Base URL: `/api/auth`

#### 1. **POST** `/register`

- **Description**: Register new staff (Shop Admin only)
- **Authentication**: Required (Shop Admin JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <shop_admin_jwt_token>",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "email": "staff@example.com",
    "password": "password123",
    "name": "Staff Name",
    "role": "SALES_STAFF",
    "shopId": 1
  }
  ```
- **Response**:
  ```json
  {
    "message": "Staff member registered successfully",
    "staff": {
      "id": 2,
      "email": "staff@example.com",
      "name": "Staff Name",
      "role": "SALES_STAFF",
      "shopId": 1,
      "shopName": "Shop Name",
      "createdAt": "2023-09-25T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `401`: Authentication required
  - `403`: Access denied. Only shop admins can register staff
  - `400`: Missing required fields / Staff with email already exists
  - `500`: Registration failed

#### 2. **POST** `/login`

- **Description**: Staff login
- **Authentication**: None required
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "email": "staff@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt_token_here",
    "staffId": 1,
    "name": "Staff Name",
    "shopId": 1,
    "shopName": "Shop Name"
  }
  ```
- **Error Responses**:
  - `400`: Invalid credentials
  - `500`: Login failed

#### 3. **POST** `/logout`

- **Description**: Staff logout (records logout time)
- **Authentication**: Required (JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**: None
- **Response**:
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

## 📱 Barcode Controller

### Base URL: `/api/barcode`

#### 1. **POST** `/label`

- **Description**: Generate barcode label with product details as PNG image. Can accept either productId or manual product details.
- **Authentication**: Required (JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
  }
  ```
- **Request Body (Option 1 - With Product ID)**:
  ```json
  {
    "productId": 1
  }
  ```
- **Request Body (Option 2 - Manual Details)**:
  ```json
  {
    "name": "Ray-Ban Aviator",
    "description": "Classic Sunglasses",
    "price": 2500.0,
    "data": "EYE00011234"
  }
  ```
- **Response** (200 OK):
  - Content-Type: `image/png`
  - Binary PNG image (400x150 pixels) containing:
    - Product name (bold, 16px, top-left)
    - Product description (12px, optional, top-left)
    - Price in Indian Rupees (bold, 14px, top-right)
    - Barcode (CODE128 format, center)
    - Barcode value as text (12px, below barcode)
    - Company name if available (10px, bottom-left)
- **Error Responses**:
  - `400`: Missing required fields (name, price, data) or Product does not have barcode
  - `404`: Product not found
  - `500`: Internal server error while generating label

#### 2. **POST** `/generate/:productId`

- **Description**: Generate and assign unique barcode to product without barcode
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `productId` (integer): Product ID
- **Request Body**:
  ```json
  {
    "companyPrefix": "EYE",
    "isClone": false
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Barcode generated successfully",
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator",
      "barcode": "EYE00011234AB",
      "company": { "name": "Ray-Ban" },
      "shopInventory": []
    },
    "generatedBarcode": "EYE00011234AB",
    "canNowScan": true,
    "nextStep": "Use this barcode for stock-in/stock-out operations"
  }
  ```
- **Error Responses**:
  - `400`: Product already has a barcode
  - `404`: Product not found
  - `500`: Unable to generate unique barcode

#### 3. **POST** `/sku/generate/:productId`

- **Description**: Generate and assign unique SKU to product without SKU
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `productId` (integer): Product ID
- **Request Body**:
  ```json
  {
    "companyCode": "RAY"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "SKU generated successfully",
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator",
      "sku": "RAY-SUN-AVI-0001-2025",
      "company": { "name": "Ray-Ban" }
    },
    "generatedSKU": "RAY-SUN-AVI-0001-2025",
    "skuBreakdown": {
      "company": "RAY",
      "eyewearType": "SUN",
      "frameType": "AVI",
      "productId": "0001",
      "timestamp": "2025"
    },
    "nextStep": "SKU can now be used for internal tracking and inventory management"
  }
  ```

#### 4. **GET** `/missing`

- **Description**: Get products that don't have barcodes assigned
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `companyId` (optional): Filter by company
  - `eyewearType` (optional): Filter by eyewear type
- **Response** (200 OK):
  ```json
  {
    "products": [
      {
        "id": 2,
        "name": "Product Name",
        "description": "Product Description",
        "barcode": null,
        "sku": null,
        "basePrice": 100.0,
        "eyewearType": "GLASSES",
        "company": { "name": "Ray-Ban" },
        "shopInventory": []
      }
    ],
    "count": 5,
    "message": "5 products need barcode generation"
  }
  ```

#### 5. **POST** `/bulk-generate`

- **Description**: Generate multiple unique barcodes in bulk (max 100 at once)
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "count": 10,
    "companyPrefix": "EYE",
    "productIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Bulk barcodes generated successfully",
    "count": 10,
    "barcodes": [
      {
        "barcode": "EYE00011234AB",
        "productId": 1,
        "index": 1
      },
      {
        "barcode": "EYE00021567CD",
        "productId": 2,
        "index": 2
      }
    ],
    "prefix": "EYE",
    "timestamp": "2025-10-31T10:30:00.000Z"
  }
  ```
- **Validation Errors** (400):
  ```json
  {
    "error": "Count must be between 1 and 100."
  }
  ```

#### 6. **GET** `/validate/:barcode`

- **Description**: Check if barcode is unique across all products
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `barcode` (string): Barcode to validate
- **Response - Unique** (200 OK):
  ```json
  {
    "isUnique": true,
    "exists": false,
    "message": "Barcode is unique and can be used"
  }
  ```
- **Response - Already Exists** (200 OK):
  ```json
  {
    "isUnique": false,
    "exists": true,
    "conflictingProduct": {
      "id": 1,
      "name": "Ray-Ban Aviator",
      "company": "Ray-Ban",
      "eyewearType": "SUNGLASSES",
      "barcode": "EYE00011234AB"
    },
    "message": "Barcode already exists in the system"
  }
  ```

---

## 👥 Customer Controller

### Base URL: `/api/customer`

#### 1. **POST** `/`

- **Description**: Create a standalone customer
- **Authentication**: Required (JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "name": "Customer Name",
    "phone": "1234567890",
    "address": "Customer Address"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Customer Name",
    "phone": "1234567890",
    "address": "Customer Address",
    "shopId": 1,
    "createdAt": "2023-09-25T10:00:00.000Z"
  }
  ```

#### 2. **GET** `/`

- **Description**: Get all customers with pagination and search
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `page` (integer, default: 1): Page number
  - `limit` (integer, default: 10): Items per page
  - `search` (string): Search by name, phone, or address
- **Response**:
  ```json
  {
    "customers": [...],
    "total": 100,
    "page": 1,
    "totalPages": 10
  }
  ```

#### 3. **GET** `/hotspots`

- **Description**: Get top customer address hotspots
- **Authentication**: Required (JWT)
- **Response**:
  ```json
  [
    {
      "address": "Downtown Area",
      "customerCount": 25
    }
  ]
  ```

#### 4. **GET** `/:id`

- **Description**: Get single customer by ID with invoices
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (integer): Customer ID
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Customer Name",
    "phone": "1234567890",
    "address": "Customer Address",
    "invoices": [...]
  }
  ```

#### 5. **POST** `/invoice`

- **Description**: Create invoice for new walk-in customer
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "customer": {
      "name": "Walk-in Customer",
      "phone": "1234567890",
      "address": "Customer Address"
    },
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 100.0
      }
    ],
    "paidAmount": 200.0,
    "paymentMethod": "CASH"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Customer and invoice created successfully",
    "customer": {...},
    "invoice": {...}
  }
  ```

---

## 🎁 Gift Card Controller

### Base URL: `/api/gift-card`

#### 1. **POST** `/issue`

- **Description**: Issue a new gift card
- **Authentication**: Required (JWT)
- **Headers**:
  ```json
  {
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "patientId": 1,
    "balance": 500.0
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "code": "GIFT123456789",
    "balance": 500.0,
    "patientId": 1,
    "createdAt": "2023-09-25T10:00:00.000Z"
  }
  ```

#### 2. **POST** `/redeem`

- **Description**: Redeem gift card amount
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "code": "GIFT123456789",
    "amount": 100.0
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "code": "GIFT123456789",
    "balance": 400.0,
    "message": "Gift card redeemed successfully"
  }
  ```
- **Error Responses**:
  - `404`: Gift card not found
  - `400`: Insufficient balance

#### 3. **GET** `/:code`

- **Description**: Get gift card balance by code
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `code` (string): Gift card code
- **Response**:
  ```json
  {
    "code": "GIFT123456789",
    "balance": 400.0,
    "patientId": 1
  }
  ```

---

## 📦 Inventory Controller

### Base URL: `/api/inventory`

#### 1. **POST** `/stock-by-barcode`

- **Description**: Update stock using barcode
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "barcode": "1234567890123",
    "quantity": 10,
    "action": "add"
  }
  ```

#### 2. **POST** `/stock-out-by-barcode`

- **Description**: Remove stock using barcode
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "barcode": "1234567890123",
    "quantity": 2
  }
  ```

#### 3. **GET** `/product/barcode/:barcode`

- **Description**: Get product by barcode
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `barcode` (string): Product barcode
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Product Name",
    "barcode": "1234567890123",
    "basePrice": 100.0,
    "inventory": {
      "quantity": 50,
      "sellingPrice": 120.0
    }
  }
  ```

#### 4. **GET** `/product/:productId`

- **Description**: Get product by ID
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `productId` (integer): Product ID

#### 5. **GET** `/products`

- **Description**: Get all products with pagination
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `page` (integer): Page number
  - `limit` (integer): Items per page
  - `search` (string): Search term
- **Response**:
  ```json
  {
    "products": [...],
    "total": 100,
    "page": 1,
    "totalPages": 10
  }
  ```

#### 6. **POST** `/product`

- **Description**: Add new product
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "name": "New Product",
    "description": "Product description",
    "basePrice": 100.0,
    "eyewearType": "GLASSES",
    "companyId": 1,
    "material": "Metal",
    "color": "Black",
    "size": "Medium"
  }
  ```

#### 7. **PUT** `/product/:productId`

- **Description**: Update existing product
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `productId` (integer): Product ID

#### 8. **POST** `/stock-in`

- **Description**: Add stock by product ID
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "productId": 1,
    "quantity": 50,
    "costPrice": 80.0,
    "sellingPrice": 120.0
  }
  ```

#### 9. **POST** `/stock-out`

- **Description**: Remove stock by product ID
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "productId": 1,
    "quantity": 2
  }
  ```

#### 10. **GET** `/`

- **Description**: Get current inventory with stock levels
- **Authentication**: Required (JWT)
- **Response**:
  ```json
  [
    {
      "id": 1,
      "productId": 1,
      "quantity": 48,
      "minThreshold": 10,
      "product": {
        "name": "Product Name",
        "barcode": "1234567890123"
      },
      "stockLevel": "MEDIUM"
    }
  ]
  ```

#### 11. **POST** `/company`

- **Description**: Add new company/brand
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "name": "Company Name",
    "description": "Company description"
  }
  ```

#### 12. **GET** `/companies`

- **Description**: Get all companies
- **Authentication**: Required (JWT)

#### 13. **GET** `/company/:companyId/products`

- **Description**: Get products by company
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `companyId` (integer): Company ID

---

## 🧾 Invoice Controller

### Base URL: `/api/invoice`

#### 1. **GET** `/`

- **Description**: Get all invoices with filtering and pagination
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `page` (integer): Page number (default: 1)
  - `limit` (integer): Items per page (default: 10)
  - `status` (string): Filter by status (UNPAID, PARTIALLY_PAID, PAID, CANCELLED)
  - `patientId` (integer): Filter by patient
  - `customerId` (integer): Filter by customer
  - `startDate` (string): Start date filter (YYYY-MM-DD)
  - `endDate` (string): End date filter (YYYY-MM-DD)
- **Response** (200 OK):
  ```json
  {
    "invoices": [
      {
        "id": "clp123abc456",
        "patientId": 1,
        "customerId": null,
        "totalAmount": 250.00,
        "paidAmount": 100.00,
        "status": "PARTIALLY_PAID",
        "subtotal": 200.00,
        "totalDiscount": 20.00,
        "totalCgst": 36.00,
        "totalSgst": 36.00,
        "totalIgst": 0.00,
        "staffId": 1,
        "items": [
          {
            "id": 1,
            "invoiceId": "clp123abc456",
            "productId": 1,
            "quantity": 2,
            "unitPrice": 100.0,
            "discount": 10.0,
            "cgst": 18.0,
            "sgst": 18.0,
            "totalPrice": 136.0,
            "product": {
              "id": 1,
              "name": "Ray-Ban Aviator Classic",
              "basePrice": 100.0
            }
          }
        ],
        "patient": {
          "id": 1,
          "name": "John Patient",
          "phone": "+1234567890"
        },
        "createdAt": "2025-10-31T11:00:00.000Z",
        "updatedAt": "2025-10-31T11:30:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
  ```

#### 2. **POST** `/`

- **Description**: Create new invoice (for Patient OR Walk-in Customer, but not both)
- **Authentication**: Required (JWT)
- **Request Body (For Patient)**:
  ```json
  {
    "patientId": 1,
    "prescriptionId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "discount": 10.0,
        "cgst": 18.0,
        "sgst": 18.0
      }
    ]
  }
  ```
- **Request Body (For Walk-in Customer)**:
  ```json
  {
    "customerId": 5,
    "items": [
      {
        "productId": 2,
        "quantity": 1,
        "discount": 0.0,
        "cgst": 9.0,
        "sgst": 9.0
      }
    ]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "clp123abc456",
    "patientId": 1,
    "customerId": null,
    "prescriptionId": 1,
    "totalAmount": 120.0,
    "paidAmount": 0.0,
    "status": "UNPAID",
    "subtotal": 100.0,
    "totalDiscount": 10.0,
    "totalCgst": 18.0,
    "totalSgst": 18.0,
    "totalIgst": 0.0,
    "staffId": 1,
    "items": [
      {
        "id": 1,
        "invoiceId": "clp123abc456",
        "productId": 1,
        "quantity": 2,
        "unitPrice": 50.0,
        "discount": 10.0,
        "cgst": 18.0,
        "sgst": 18.0,
        "totalPrice": 76.0,
        "product": {
          "id": 1,
          "name": "Ray-Ban Aviator Classic",
          "description": "Premium sunglasses",
          "basePrice": 50.0,
          "sku": "RB-AV-001",
          "barcode": "EYE00011234AB",
          "company": {
            "id": 1,
            "name": "Ray-Ban"
          }
        }
      }
    ],
    "patient": {
      "id": 1,
      "name": "John Patient",
      "phone": "+1234567890",
      "isActive": true
    },
    "createdAt": "2025-10-31T11:00:00.000Z",
    "updatedAt": "2025-10-31T11:00:00.000Z"
  }
  ```
- **Validation Errors** (400):
  ```json
  {
    "error": "Either Patient ID or Customer ID is required, but not both."
  }
  ```
- **Not Found Errors** (404):
  ```json
  {
    "error": "Patient not found."
  }
  ```
- **Access Denied** (403):
  ```json
  {
    "error": "Access denied. Patient belongs to different shop."
  }
  ```

#### 3. **GET** `/:id`

- **Description**: Get single invoice by ID
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response** (200 OK):
  ```json
  {
    "id": "clp123abc456",
    "patientId": 1,
    "customerId": null,
    "prescriptionId": 1,
    "totalAmount": 250.00,
    "paidAmount": 100.00,
    "status": "PARTIALLY_PAID",
    "subtotal": 200.00,
    "totalDiscount": 20.00,
    "totalCgst": 36.00,
    "totalSgst": 36.00,
    "totalIgst": 0.00,
    "staffId": 1,
    "items": [
      {
        "id": 1,
        "invoiceId": "clp123abc456",
        "productId": 1,
        "quantity": 2,
        "unitPrice": 100.0,
        "discount": 10.0,
        "cgst": 18.0,
        "sgst": 18.0,
        "totalPrice": 136.0,
        "product": {
          "id": 1,
          "name": "Ray-Ban Aviator Classic",
          "description": "Premium sunglasses",
          "basePrice": 100.0,
          "sku": "RB-AV-001",
          "barcode": "EYE00011234AB",
          "company": {
            "id": 1,
            "name": "Ray-Ban"
          }
        }
      }
    ],
    "patient": {
      "id": 1,
      "name": "John Patient",
      "phone": "+1234567890",
      "email": "john@example.com",
      "age": 35,
      "gender": "MALE",
      "isActive": true
    },
    "staff": {
      "id": 1,
      "name": "Jane Staff",
      "email": "jane@shop.com",
      "role": "SALES_STAFF"
    },
    "transactions": [
      {
        "id": 1,
        "invoiceId": "clp123abc456",
        "amount": 100.0,
        "paymentMethod": "CASH",
        "giftCardId": null,
        "createdAt": "2025-10-31T11:30:00.000Z",
        "updatedAt": "2025-10-31T11:30:00.000Z"
      }
    ],
    "prescription": {
      "id": 1,
      "patientId": 1,
      "rightEye": {
        "sph": "-2.00",
        "cyl": "-0.50",
        "axis": "90"
      },
      "leftEye": {
        "sph": "-1.75",
        "cyl": "-0.25",
        "axis": "85"
      }
    },
    "createdAt": "2025-10-31T11:00:00.000Z",
    "updatedAt": "2025-10-31T11:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `404`: Invoice not found
  - `403`: Access denied. Invoice belongs to different shop

#### 4. **PATCH** `/:id/status`

- **Description**: Update invoice status
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Request Body**:
  ```json
  {
    "status": "CANCELLED",
    "reason": "Customer request"
  }
  ```

#### 5. **POST** `/:id/payment`

- **Description**: Add payment to invoice (invoice ID provided in URL path)
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Request Body**:
  ```json
  {
    "amount": 100.0,
    "paymentMethod": "CASH",
    "giftCardId": null
  }
  ```
  **OR for Gift Card Payment:**
  ```json
  {
    "amount": 100.0,
    "paymentMethod": "GIFT_CARD",
    "giftCardId": 5
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "id": "clp123abc456",
    "patientId": 1,
    "customerId": null,
    "subtotal": 500.0,
    "totalAmount": 590.0,
    "paidAmount": 100.0,
    "status": "PARTIALLY_PAID",
    "totalDiscount": 50.0,
    "totalCgst": 36.0,
    "totalSgst": 36.0,
    "totalIgst": 18.0,
    "staffId": 1,
    "transactions": [
      {
        "id": 1,
        "invoiceId": "clp123abc456",
        "amount": 100.0,
        "paymentMethod": "CASH",
        "giftCardId": null,
        "createdAt": "2025-10-31T10:30:00.000Z",
        "updatedAt": "2025-10-31T10:30:00.000Z"
      }
    ],
    "createdAt": "2025-10-31T11:00:00.000Z",
    "updatedAt": "2025-10-31T10:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `400`: Payment amount exceeds remaining balance / Valid payment amount is required / Payment method is required / Insufficient gift card balance
  - `404`: Invoice not found / Gift card not found
  - `403`: Access denied. Invoice belongs to different shop
  - `500`: Failed to process payment

#### 6. **DELETE** `/:id`

- **Description**: Cancel/Delete invoice
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response**:
  ```json
  {
    "message": "Invoice cancelled successfully"
  }
  ```

#### 7. **GET** `/:id/pdf`

- **Description**: Generate and download invoice as PDF document
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response Headers**:
  ```
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="invoice-{id}.pdf"
  ```
- **Response**: Binary PDF file containing:
  - Invoice header with shop details and invoice ID
  - Invoice date and staff member name
  - Customer/Patient details
  - Itemized product list with quantities, prices, and taxes
  - Subtotal, discounts, and taxes breakdown
  - Total amount due and payment status
  - Barcode representation of invoice ID
- **Error Responses**:
  - `404`: Invoice not found
  - `403`: Access denied. Invoice belongs to different shop
  - `500`: Failed to generate PDF

#### 8. **GET** `/:id/thermal`

- **Description**: Generate thermal print receipt format for POS thermal printer
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response** (200 OK):
  ```json
  {
    "thermalContent": "========================================\n           INVOICE RECEIPT\n========================================\nInvoice ID: clp123abc456\nDate: 2025-10-31 11:00:00\nStaff: Jane Staff\n----------------------------------------\nCUSTOMER DETAILS\n----------------------------------------\nName: John Patient\nPhone: +1234567890\n----------------------------------------\nITEMS\n----------------------------------------\nRay-Ban Aviator Classic\nQty: 2 × ₹100.00 = ₹200.00\nDiscount: -₹10.00\nCGST (18%): ₹18.00\nSGST (18%): ₹18.00\n----------------------------------------\nSubtotal: ₹200.00\nTotal Discount: ₹10.00\nTotal CGST: ₹18.00\nTotal SGST: ₹18.00\n========================================\nTOTAL AMOUNT: ₹250.00\nPaid: ₹100.00\nDue: ₹150.00\nStatus: PARTIALLY_PAID\n========================================\nThank you for your purchase!\n========================================\n"
  }
  ```
- **Error Responses**:
  - `404`: Invoice not found
  - `403`: Access denied. Invoice belongs to different shop
  - `500`: Failed to generate thermal receipt

---

## 🔑 Authentication Headers

All protected routes require the following header:

```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

## 📝 Common Error Responses

### Authentication Errors

```json
{
  "error": "Authentication required"
}
```

### Authorization Errors

```json
{
  "error": "Access denied. Resource belongs to different shop."
}
```

### Validation Errors

```json
{
  "error": "Missing required fields: name and address are required."
}
```

### Server Errors

```json
{
  "error": "Something went wrong"
}
```

---

## 🚀 Postman Testing Tips

1. **Setup Environment Variables**:

   - `base_url`: `http://localhost:8080`
   - `jwt_token`: Store after login
   - `shop_admin_token`: Store after shop admin login

2. **Authentication Flow**:

   1. Login via `POST {{base_url}}/api/auth/login`
   2. Copy token from response
   3. Set as `jwt_token` environment variable
   4. Use `Bearer {{jwt_token}}` in Authorization header

3. **Testing Sequence**:

   1. Authentication (Login)
   2. Create/Get data (Customers, Products, etc.)
   3. Business operations (Create invoices, Stock management)
   4. Reports and analytics
   5. Logout

4. **Shop Isolation Testing**:
   - Test with different shop credentials
   - Verify data isolation between shops
   - Test access control for cross-shop resources

---

_This documentation covers all routes from Attendance to Invoice controllers. Each endpoint has been tested and verified for functionality and security._
