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

#### 1. **POST** `/logout`

- **Description**: Mark logout time for authenticated staff
- **Authentication**: Required  (JWT)
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
- **Error Responses**:
  - `401`: User not authenticated
  - `500`: Something went wrong

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

- **Description**: Get attendance records for specific staff member
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

- **Description**: Generate barcode label (with or without productId)
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
    "productId": 1,
    "format": "png",
    "width": 200,
    "height": 100
  }
  ```
- **Response**: Binary image data (PNG/SVG)

#### 2. **POST** `/generate/:productId`

- **Description**: Generate and assign barcode to product without barcode
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `productId` (integer): Product ID
- **Response**:
  ```json
  {
    "productId": 1,
    "barcode": "1234567890123",
    "message": "Barcode generated and assigned successfully"
  }
  ```

#### 3. **POST** `/sku/generate/:productId`

- **Description**: Generate and assign SKU to product without SKU
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `productId` (integer): Product ID
- **Response**:
  ```json
  {
    "productId": 1,
    "sku": "SKU12345",
    "message": "SKU generated and assigned successfully"
  }
  ```

#### 4. **GET** `/missing`

- **Description**: Get products that don't have barcodes
- **Authentication**: Required (JWT)
- **Response**:
  ```json
  [
    {
      "id": 1,
      "name": "Product Name",
      "barcode": null,
      "sku": null
    }
  ]
  ```

#### 5. **POST** `/` (Legacy route)

- **Description**: Same as `/label` for backward compatibility
- **Authentication**: Required (JWT)

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
  - `page` (integer): Page number
  - `limit` (integer): Items per page
  - `status` (string): Filter by status
  - `patientId` (integer): Filter by patient
  - `customerId` (integer): Filter by customer
  - `startDate` (string): Start date filter
  - `endDate` (string): End date filter
- **Response**:
  ```json
  {
    "invoices": [
      {
        "id": "INV-001",
        "patientId": 1,
        "customerId": null,
        "totalAmount": 250.00,
        "paidAmount": 250.00,
        "status": "PAID",
        "items": [...],
        "patient": {...},
        "createdAt": "2023-09-25T10:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
  ```

#### 2. **POST** `/`

- **Description**: Create new invoice
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "patientId": 1,
    "prescriptionId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 1,
        "unitPrice": 120.0,
        "discount": 10.0,
        "cgstRate": 9.0,
        "sgstRate": 9.0
      }
    ],
    "paidAmount": 120.0,
    "paymentMethod": "CASH",
    "notes": "Regular customer"
  }
  ```
- **Response**:
  ```json
  {
    "id": "INV-002",
    "patientId": 1,
    "totalAmount": 120.00,
    "paidAmount": 120.00,
    "status": "PAID",
    "items": [...],
    "createdAt": "2023-09-25T11:00:00.000Z"
  }
  ```

#### 3. **GET** `/:id`

- **Description**: Get single invoice by ID
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response**:
  ```json
  {
    "id": "INV-001",
    "patientId": 1,
    "totalAmount": 250.00,
    "items": [...],
    "patient": {...},
    "prescription": {...}
  }
  ```

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

- **Description**: Add payment to invoice
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Request Body**:
  ```json
  {
    "amount": 100.0,
    "method": "CASH",
    "notes": "Partial payment"
  }
  ```

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

- **Description**: Generate PDF for invoice
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response**: PDF file download

#### 8. **GET** `/:id/thermal`

- **Description**: Generate thermal print receipt
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (string): Invoice ID
- **Response**: Plain text receipt for thermal printing

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
