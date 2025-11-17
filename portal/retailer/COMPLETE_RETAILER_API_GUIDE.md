# Retailer Portal - Complete API Testing Guide

## 🎯 Overview

This comprehensive guide covers all **39 endpoints** in the Retailer Portal, organized by functionality with complete request/response examples for Postman testing.

**Base URL:** `http://localhost:8080/retailer`

---

## 🔐 AUTHENTICATION ENDPOINTS (6)

### 1. Register Retailer

**POST** `/auth/register`

**Description:** Register a new retailer account

**Request Body:**

```json
{
  "name": "Optical World Retailer",
  "email": "retailer@opticalworld.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Business Street, City, State",
  "businessType": "WHOLESALE"
}
```

**Response (201):**

```json
{
  "message": "Retailer registered successfully",
  "retailer": {
    "id": 1,
    "name": "Optical World Retailer",
    "email": "retailer@opticalworld.com",
    "phone": "+1234567890",
    "address": "123 Business Street, City, State",
    "businessType": "WHOLESALE",
    "createdAt": "2025-09-23T05:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login Retailer

**POST** `/auth/login`

**Description:** Login to retailer account

**Request Body:**

```json
{
  "email": "retailer@opticalworld.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "message": "Login successful",
  "retailer": {
    "id": 1,
    "name": "Optical World Retailer",
    "email": "retailer@opticalworld.com",
    "businessType": "WHOLESALE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Retailer Profile

**GET** `/auth/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "retailer": {
    "id": 1,
    "name": "Optical World Retailer",
    "email": "retailer@opticalworld.com",
    "phone": "+1234567890",
    "address": "123 Business Street, City, State",
    "businessType": "WHOLESALE",
    "createdAt": "2025-09-23T05:00:00.000Z",
    "updatedAt": "2025-09-23T05:00:00.000Z"
  }
}
```

### 4. Update Retailer Profile

**PUT** `/auth/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Updated Optical World Retailer",
  "phone": "+1234567899",
  "address": "456 New Business Street, City, State"
}
```

**Response (200):**

```json
{
  "message": "Profile updated successfully",
  "retailer": {
    "id": 1,
    "name": "Updated Optical World Retailer",
    "email": "retailer@opticalworld.com",
    "phone": "+1234567899",
    "address": "456 New Business Street, City, State",
    "businessType": "WHOLESALE",
    "updatedAt": "2025-09-23T05:30:00.000Z"
  }
}
```

### 5. Change Password

**PUT** `/auth/change-password`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

**Response (200):**

```json
{
  "message": "Password updated successfully"
}
```

### 6. Logout

**POST** `/auth/logout`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## 📊 DASHBOARD ENDPOINTS (4)

### 7. Dashboard Overview

**GET** `/dashboard/overview`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "salesSummary": {
    "today": {
      "totalSales": 0,
      "orderCount": 0
    },
    "thisMonth": {
      "totalSales": 0,
      "orderCount": 0
    }
  },
  "inventoryStatus": {
    "totalProducts": 3,
    "totalStock": 105,
    "availableStock": 105,
    "allocatedStock": 0,
    "lowStockProducts": 0,
    "outOfStockProducts": 0
  },
  "monthlyOverview": {
    "productsSold": 0,
    "revenueGenerated": 0,
    "distributionCount": 2,
    "activeShops": 2
  },
  "topProducts": []
}
```

### 8. Sales Analytics

**GET** `/dashboard/sales-analytics`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `period` (optional): "week", "month", "quarter", "year"

**Response (200):**

```json
{
  "period": "month",
  "salesData": {
    "totalRevenue": 0,
    "totalOrders": 0,
    "averageOrderValue": 0,
    "growthRate": 0
  },
  "chartData": [],
  "topSellingProducts": []
}
```

### 9. Inventory Analytics

**GET** `/dashboard/inventory-analytics`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "inventoryMetrics": {
    "totalValue": 15150,
    "turnoverRate": 0,
    "lowStockCount": 0,
    "outOfStockCount": 0
  },
  "categoryBreakdown": [
    {
      "category": "SUNGLASSES",
      "productCount": 2,
      "totalStock": 80,
      "value": 12900
    },
    {
      "category": "GLASSES",
      "productCount": 1,
      "totalStock": 25,
      "value": 2250
    }
  ]
}
```

### 10. Shop Performance

**GET** `/dashboard/shop-performance`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `period` (optional): "week", "month", "quarter"

**Response (200):**

```json
{
  "period": "month",
  "shopPerformance": [
    {
      "shopId": 1,
      "shopName": "Optical World Test Branch",
      "totalDistributions": 2,
      "totalAmount": 2900,
      "paymentStatus": "PENDING"
    }
  ]
}
```

---

## 📋 REPORTS ENDPOINTS (5)

### 11. Get All Reports

**GET** `/reports`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**

```json
{
  "reports": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

### 12. Generate Profit & Loss Report

**GET** `/reports/profit-loss`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**

```json
{
  "reportType": "profit-loss",
  "generatedAt": "2025-09-23T05:15:00.000Z",
  "period": {
    "startDate": "2025-09-01",
    "endDate": "2025-09-30"
  },
  "summary": {
    "totalRevenue": 0,
    "totalCosts": 0,
    "grossProfit": 0,
    "netProfit": 0
  },
  "details": []
}
```

### 13. Generate Tax Report

**GET** `/reports/tax-report`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "reportType": "tax-report",
  "generatedAt": "2025-09-23T05:15:00.000Z",
  "taxSummary": {
    "totalTaxableAmount": 0,
    "totalTaxAmount": 0,
    "gstBreakdown": []
  }
}
```

### 14. Generate Stock Valuation Report

**GET** `/reports/stock-valuation`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "generatedAt": "2025-09-23T05:15:00.000Z",
  "valuationMethod": "FIFO",
  "summary": {
    "totalProducts": 3,
    "totalStockValue": 0,
    "totalPotentialRevenue": 15150,
    "totalExpectedProfit": 15150
  },
  "stockValuation": [
    {
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator Classic Updated"
      },
      "inventory": {
        "totalStock": 50,
        "availableStock": 50
      },
      "valuation": {
        "unitCost": 0,
        "totalValue": 0,
        "sellingPrice": 150
      }
    }
  ],
  "companyBreakdown": [
    {
      "company": "Generic Brand",
      "productCount": 1,
      "totalStock": 50,
      "totalValue": 0,
      "totalPotentialRevenue": 7500,
      "averageValue": 0
    },
    {
      "company": "Oakley",
      "productCount": 1,
      "totalStock": 30,
      "totalValue": 0,
      "totalPotentialRevenue": 5400,
      "averageValue": 0
    },
    {
      "company": "Ray-Ban",
      "productCount": 1,
      "totalStock": 25,
      "totalValue": 0,
      "totalPotentialRevenue": 2250,
      "averageValue": 0
    }
  ],
  "typeBreakdown": [
    {
      "eyewearType": "SUNGLASSES",
      "productCount": 2,
      "totalStock": 80,
      "totalValue": 0,
      "totalPotentialRevenue": 12900,
      "averageValue": 0
    },
    {
      "eyewearType": "GLASSES",
      "productCount": 1,
      "totalStock": 25,
      "totalValue": 0,
      "totalPotentialRevenue": 2250,
      "averageValue": 0
    }
  ]
}
```

### 15. Delete Report

**DELETE** `/reports/:reportId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "message": "Report deleted successfully"
}
```

---

## 🏪 INVENTORY MANAGEMENT ENDPOINTS (10)

### 16. Get Companies

**GET** `/inventory/companies`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Generic Brand",
    "description": "Default company for existing products",
    "createdAt": "2025-09-19T19:58:31.320Z",
    "updatedAt": "2025-09-19T19:58:31.320Z",
    "_count": {
      "products": 1
    }
  },
  {
    "id": 2,
    "name": "Ray-Ban",
    "description": "Premium eyewear brand",
    "createdAt": "2025-09-19T20:11:15.090Z",
    "updatedAt": "2025-09-19T20:11:15.090Z",
    "_count": {
      "products": 1
    }
  }
]
```

### 17. Add Company

**POST** `/inventory/companies`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Oakley",
  "description": "Sports and lifestyle eyewear"
}
```

**Response (201):**

```json
{
  "message": "Company added successfully",
  "company": {
    "id": 3,
    "name": "Oakley",
    "description": "Sports and lifestyle eyewear",
    "createdAt": "2025-09-21T11:07:18.539Z",
    "updatedAt": "2025-09-21T11:07:18.539Z"
  }
}
```

### 18. Get Products by Company

**GET** `/inventory/companies/:companyId/products`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "products": [
    {
      "id": 1,
      "name": "Ray-Ban Aviator Classic Updated",
      "description": "Updated description",
      "basePrice": 150,
      "barcode": "RAY0015678902",
      "sku": "SKU-001",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "companyId": 1,
      "material": "Premium Metal",
      "color": "Black/Green",
      "size": "62mm",
      "model": "RB3025-L",
      "company": {
        "id": 1,
        "name": "Generic Brand",
        "description": "Default company for existing products"
      },
      "_count": {
        "retailerProducts": 1
      }
    }
  ]
}
```

### 19. Add Product

**POST** `/inventory/products`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Aviator Classic",
  "description": "Classic aviator sunglasses",
  "companyId": 2,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "material": "METAL",
  "basePrice": 180.0,
  "sku": "RB-AVI-001",
  "barcode": "1234567890123"
}
```

**Response (201):**

```json
{
  "message": "Product added successfully",
  "product": {
    "id": 2,
    "name": "Aviator Classic",
    "description": "Classic aviator sunglasses",
    "basePrice": 180,
    "barcode": "1234567890123",
    "sku": "RB-AVI-001",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "companyId": 2,
    "material": "METAL",
    "company": {
      "id": 2,
      "name": "Ray-Ban",
      "description": "Premium eyewear brand"
    }
  }
}
```

### 20. Update Product

**PUT** `/inventory/products/:productId`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Updated Aviator Classic",
  "description": "Updated description",
  "basePrice": 190.0
}
```

**Response (200):**

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 2,
    "name": "Updated Aviator Classic",
    "description": "Updated description",
    "basePrice": 190,
    "updatedAt": "2025-09-23T05:30:00.000Z"
  }
}
```

### 21. Get Retailer Products

**GET** `/inventory/my-products`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `companyId` (optional): Filter by company
- `eyewearType` (optional): Filter by eyewear type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**

```json
{
  "products": [
    {
      "id": 1,
      "retailerId": 1,
      "productId": 1,
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses with metal frame",
      "companyName": "Ray-Ban",
      "companyDescription": "Premium eyewear brand",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Gold",
      "size": "Medium",
      "model": "RB3025",
      "barcode": "1234567890123",
      "basePrice": 200,
      "sellingPrice": 250,
      "quantity": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "totalStock": 50,
      "allocatedStock": 0,
      "availableStock": 50,
      "stockStatus": "IN_STOCK",
      "stockValue": 12500,
      "lastUpdated": "2025-11-17T10:30:00.000Z"
    },
    {
      "id": 2,
      "retailerId": 1,
      "productId": 2,
      "sku": "OAK-HB-001",
      "name": "Oakley Holbrook",
      "description": "Lifestyle sunglasses with Prizm lens technology",
      "companyName": "Oakley",
      "companyDescription": "Sports eyewear brand",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Plastic",
      "color": "Matte Black",
      "size": "Large",
      "model": "OO9102",
      "barcode": "9876543210987",
      "basePrice": 180,
      "sellingPrice": 220,
      "quantity": 75,
      "minStockLevel": 15,
      "maxStockLevel": 150,
      "totalStock": 75,
      "allocatedStock": 5,
      "availableStock": 70,
      "stockStatus": "IN_STOCK",
      "stockValue": 16500,
      "lastUpdated": "2025-11-17T10:25:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

### 22. Get Single Retailer Product

**GET** `/inventory/my-products/:retailerProductId`

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `retailerProductId` (required): The ID of the retailer product to fetch

**Response (200):**

```json
{
  "id": 1,
  "retailerId": 1,
  "productId": 1,
  "sku": "RB-AV-001",
  "name": "Ray-Ban Aviator Classic",
  "description": "Classic aviator sunglasses with metal frame",
  "companyName": "Ray-Ban",
  "companyDescription": "Premium eyewear brand",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "material": "Metal",
  "color": "Gold",
  "size": "Medium",
  "model": "RB3025",
  "barcode": "1234567890123",
  "basePrice": 200,
  "sellingPrice": 250,
  "quantity": 50,
  "minStockLevel": 10,
  "maxStockLevel": null,
  "totalStock": 50,
  "allocatedStock": 0,
  "availableStock": 50,
  "isActive": true,
  "stockStatus": "IN_STOCK",
  "stockValue": 12500,
  "lastUpdated": "2025-11-17T10:30:00.000Z"
}
```

**Response (404):**

```json
{
  "error": "Product not found"
}
```

### 23. Update Retailer Product

**PUT** `/inventory/my-products/:retailerProductId`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "productId": 1,
  "wholesalePrice": 150.0,
  "retailPrice": 200.0
}
```

**Response (201):**

```json
{
  "message": "Product added to inventory successfully",
  "retailerProduct": {
    "id": 1,
    "retailerId": 1,
    "productId": 1,
    "wholesalePrice": 150,
    "totalStock": 0,
    "isActive": true,
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator Classic Updated",
      "company": {
        "name": "Generic Brand"
      }
    }
  }
}
```

### 24. Add Product to Retailer Inventory

**POST** `/inventory/my-products`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "wholesalePrice": 160.0,
  "retailPrice": 220.0,
  "isActive": true
}
```

**Response (200):**

```json
{
  "message": "Product updated successfully",
  "retailerProduct": {
    "id": 1,
    "wholesalePrice": 160,
    "updatedAt": "2025-09-23T05:30:00.000Z"
  }
}
```

### 25. Update Stock

**PUT** `/inventory/my-products/:retailerProductId/stock`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "quantity": 50,
  "type": "ADD",
  "reason": "Initial stock",
  "costPrice": 120.0,
  "supplier": "Direct Import"
}
```

**Response (200):**

```json
{
  "message": "Stock updated successfully",
  "retailerProduct": {
    "id": 1,
    "totalStock": 50,
    "availableStock": 50,
    "updatedAt": "2025-09-23T05:30:00.000Z"
  }
}
```

### 26. Get Inventory Summary

**GET** `/inventory/summary`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "totalProducts": 3,
  "totalStockValue": 15150,
  "lowStockProducts": 0,
  "outOfStockProducts": 0,
  "categories": {
    "SUNGLASSES": {
      "count": 2,
      "value": 12900
    },
    "GLASSES": {
      "count": 1,
      "value": 2250
    }
  }
}
```

---

## 📦 BULK OPERATIONS ENDPOINTS (5)

### 27. Get Bulk Upload Template

**GET** `/bulk/template`

**Headers:**

```
Authorization: Bearer <token>
```

**Description:** Download sample JSON template with all required fields for bulk product upload

**Response (200):**

```json
{
  "template": {
    "products": [
      {
        "sku": "RB-AV-001",
        "barcode": "123456789012",
        "name": "Ray-Ban Aviator Classic",
        "description": "Premium aviator sunglasses",
        "companyName": "Ray-Ban",
        "companyDescription": "Premium eyewear brand",
        "eyewearType": "SUNGLASSES",
        "frameType": "FULL_RIM",
        "material": "Metal",
        "color": "Black",
        "size": "62mm",
        "model": "RB3025",
        "basePrice": 150,
        "sellingPrice": 200,
        "quantity": 50,
        "minStockLevel": 10,
        "maxStockLevel": 100
      },
      {
        "sku": "RB-RX-002",
        "barcode": "234567890123",
        "name": "Ray-Ban Prescription Frame",
        "description": "Full rim prescription ready frame",
        "companyName": "Ray-Ban",
        "companyDescription": "Premium eyewear brand",
        "eyewearType": "GLASSES",
        "frameType": "FULL_RIM",
        "material": "Acetate",
        "color": "Brown",
        "size": "55mm",
        "model": "RB5228",
        "basePrice": 120,
        "sellingPrice": 180,
        "quantity": 30,
        "minStockLevel": 5,
        "maxStockLevel": 75
      }
    ]
  },
  "fieldReference": {
    "sku": "Product SKU (unique identifier)",
    "barcode": "Product barcode (12-14 digits)",
    "name": "Product display name",
    "description": "Product description",
    "companyName": "Brand/Company name (auto-creates if not exists)",
    "companyDescription": "Brand/Company description",
    "eyewearType": "SUNGLASSES | GLASSES | LENSES | ACCESSORIES | CONTACT_LENS",
    "frameType": "FULL_RIM | SEMI_RIM | RIMLESS | AVIATOR | CAT_EYE",
    "material": "Material type (Metal, Acetate, Titanium, etc.)",
    "color": "Color description",
    "size": "Size specification (e.g., 62mm)",
    "model": "Model number",
    "basePrice": "Cost/wholesale price",
    "sellingPrice": "Retail selling price",
    "quantity": "Initial stock quantity",
    "minStockLevel": "Minimum threshold for reordering",
    "maxStockLevel": "Maximum stock capacity"
  }
}
```

**Status:** ✅ **WORKING**

---

### 28. Bulk Upload Products

**POST** `/bulk/products/upload`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Description:** Upload up to 1000 products at once. Auto-creates companies if they don't exist. Handles duplicates by updating existing products.

**Request Body:**

```json
{
  "products": [
    {
      "sku": "RB-AV-001",
      "barcode": "123456789012",
      "name": "Ray-Ban Aviator Classic",
      "description": "Premium aviator sunglasses",
      "companyName": "Ray-Ban",
      "companyDescription": "Premium eyewear brand",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Black",
      "size": "62mm",
      "model": "RB3025",
      "basePrice": 150,
      "sellingPrice": 200,
      "quantity": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100
    },
    {
      "sku": "OAK-HM-001",
      "barcode": "234567890123",
      "name": "Oakley Half Jacket",
      "description": "Sport performance sunglasses",
      "companyName": "Oakley",
      "companyDescription": "Sports and lifestyle eyewear",
      "eyewearType": "SUNGLASSES",
      "frameType": "SEMI_RIM",
      "material": "O-Matter",
      "color": "Blue/Black",
      "size": "60mm",
      "model": "OJ9154",
      "basePrice": 180,
      "sellingPrice": 250,
      "quantity": 30,
      "minStockLevel": 5,
      "maxStockLevel": 60
    }
  ]
}
```

**Response (201):**

```json
{
  "message": "Products uploaded successfully",
  "summary": {
    "totalProcessed": 2,
    "successCount": 2,
    "errorCount": 0,
    "companiesCreated": 1,
    "productsCreated": 2,
    "productsUpdated": 0
  },
  "products": [
    {
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "companyName": "Ray-Ban",
      "quantity": 50,
      "status": "CREATED",
      "id": 1
    },
    {
      "sku": "OAK-HM-001",
      "name": "Oakley Half Jacket",
      "companyName": "Oakley",
      "quantity": 30,
      "status": "CREATED",
      "id": 2
    }
  ],
  "errors": []
}
```

**Error Response (400) - Validation Failed:**

```json
{
  "error": "Validation failed for some products",
  "summary": {
    "totalProcessed": 2,
    "successCount": 1,
    "errorCount": 1
  },
  "products": [
    {
      "sku": "RB-AV-001",
      "status": "CREATED",
      "id": 1
    }
  ],
  "errors": [
    {
      "index": 1,
      "sku": "OAK-HM-001",
      "error": "Product name is required",
      "details": ["name: String cannot be null"]
    }
  ]
}
```

**Validation Rules:**

- ✅ SKU must be unique
- ✅ Name is required
- ✅ Company name is required (auto-creates if not exists)
- ✅ Base price must be > 0
- ✅ Eyewear type is required
- ✅ Frame type required only for SUNGLASSES and GLASSES
- ✅ Max 1000 products per upload
- ✅ All monetary values must be positive numbers

**Status:** ✅ **WORKING**

---

### 29. Bulk Update Inventory

**POST** `/bulk/inventory/update`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Description:** Update prices, quantities, and stock levels for multiple products in one request

**Request Body:**

```json
{
  "updates": [
    {
      "retailerProductId": 1,
      "sellingPrice": 220,
      "quantity": 75,
      "minStockLevel": 15,
      "maxStockLevel": 120
    },
    {
      "retailerProductId": 2,
      "sellingPrice": 280,
      "quantity": 45,
      "minStockLevel": 8,
      "maxStockLevel": 80
    }
  ]
}
```

**Response (200):**

```json
{
  "message": "Inventory updated successfully",
  "summary": {
    "totalUpdated": 2,
    "successCount": 2,
    "errorCount": 0
  },
  "updatedProducts": [
    {
      "id": 1,
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "sellingPrice": 220,
      "quantity": 75,
      "minStockLevel": 15,
      "maxStockLevel": 120,
      "updatedAt": "2025-11-17T10:30:00.000Z"
    },
    {
      "id": 2,
      "sku": "OAK-HM-001",
      "name": "Oakley Half Jacket",
      "sellingPrice": 280,
      "quantity": 45,
      "minStockLevel": 8,
      "maxStockLevel": 80,
      "updatedAt": "2025-11-17T10:30:00.000Z"
    }
  ],
  "errors": []
}
```

**Error Response (400) - Validation Failed:**

```json
{
  "error": "Validation failed for some updates",
  "summary": {
    "totalUpdated": 2,
    "successCount": 1,
    "errorCount": 1
  },
  "updatedProducts": [
    {
      "id": 1,
      "sku": "RB-AV-001",
      "sellingPrice": 220,
      "quantity": 75
    }
  ],
  "errors": [
    {
      "index": 1,
      "retailerProductId": 2,
      "error": "Selling price must be greater than 0",
      "details": ["sellingPrice: Must be positive number"]
    }
  ]
}
```

**Validation Rules:**

- ✅ All monetary values must be positive
- ✅ Quantities must be non-negative integers
- ✅ Retailer product must belong to authenticated retailer
- ✅ Min stock level must be ≤ max stock level
- ✅ At least one field must be provided for update

**Status:** ✅ **WORKING**

---

### 30. Bulk Distribute to Shops

**POST** `/bulk/distributions/create`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Description:** Distribute multiple products to one or more shops in a single batch operation. Automatically deducts from retailer inventory.

**Request Body:**

```json
{
  "distributions": [
    {
      "retailerShopId": 1,
      "products": [
        {
          "retailerProductId": 1,
          "quantity": 10,
          "unitPrice": 200
        },
        {
          "retailerProductId": 2,
          "quantity": 5,
          "unitPrice": 250
        }
      ],
      "notes": "Monthly stock replenishment"
    },
    {
      "retailerShopId": 2,
      "products": [
        {
          "retailerProductId": 1,
          "quantity": 8,
          "unitPrice": 200
        }
      ],
      "notes": "Branch restock"
    }
  ],
  "paymentTerms": "NET_30",
  "deliveryExpectedDate": "2025-11-25T00:00:00Z"
}
```

**Response (201):**

```json
{
  "message": "Bulk distributions created successfully",
  "summary": {
    "totalShops": 2,
    "totalDistributions": 3,
    "totalAmount": 5050,
    "itemsDistributed": 23
  },
  "distributionsByShop": [
    {
      "shopId": 1,
      "shopName": "Test Optical Shop",
      "distributionCount": 2,
      "amount": 3050,
      "items": [
        {
          "id": 1,
          "productName": "Ray-Ban Aviator Classic",
          "quantity": 10,
          "unitPrice": 200,
          "totalAmount": 2000,
          "status": "PENDING"
        },
        {
          "id": 2,
          "productName": "Oakley Half Jacket",
          "quantity": 5,
          "unitPrice": 250,
          "totalAmount": 1250,
          "status": "PENDING"
        }
      ]
    },
    {
      "shopId": 2,
      "shopName": "Optical World Branch",
      "distributionCount": 1,
      "amount": 1600,
      "items": [
        {
          "id": 3,
          "productName": "Ray-Ban Aviator Classic",
          "quantity": 8,
          "unitPrice": 200,
          "totalAmount": 1600,
          "status": "PENDING"
        }
      ]
    }
  ],
  "errors": []
}
```

**Error Response (400) - Insufficient Stock:**

```json
{
  "error": "Stock validation failed for some items",
  "summary": {
    "totalShops": 2,
    "successfulShops": 1,
    "failedShops": 1
  },
  "successfulDistributions": [
    {
      "shopId": 1,
      "shopName": "Test Optical Shop",
      "distributionCount": 1,
      "amount": 2000
    }
  ],
  "errors": [
    {
      "shopIndex": 1,
      "retailerShopId": 2,
      "productIndex": 0,
      "retailerProductId": 1,
      "productName": "Ray-Ban Aviator Classic",
      "requestedQuantity": 50,
      "availableQuantity": 15,
      "error": "Insufficient stock available for distribution"
    }
  ]
}
```

**Validation Rules:**

- ✅ Shop must be active and connected to retailer
- ✅ Product must belong to retailer's inventory
- ✅ Sufficient stock must be available
- ✅ Unit prices must be positive
- ✅ All-or-nothing for each shop (if any product fails, shop distribution fails)
- ✅ Other shops in batch still process if one fails
- ✅ Max 100 shops per batch request
- ✅ Max 1000 items per batch request

**Status:** ✅ **WORKING**

---

### 30. Export Retailer Products

**GET** `/bulk/products/export`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `format` (optional): "json" (default) or "csv"
- `companyId` (optional): Export only products from specific company
- `eyewearType` (optional): Export only specific eyewear type

**Response (200) - JSON Format:**

```json
{
  "exportDate": "2025-11-17T10:45:00.000Z",
  "retailerId": 1,
  "totalProducts": 2,
  "products": [
    {
      "sku": "RB-AV-001",
      "barcode": "123456789012",
      "name": "Ray-Ban Aviator Classic",
      "description": "Premium aviator sunglasses",
      "companyName": "Ray-Ban",
      "companyDescription": "Premium eyewear brand",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Black",
      "size": "62mm",
      "model": "RB3025",
      "basePrice": 150,
      "sellingPrice": 200,
      "quantity": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "allocatedStock": 15,
      "availableStock": 35,
      "stockStatus": "IN_STOCK",
      "stockValue": 10000,
      "lastUpdated": "2025-11-17T10:00:00.000Z"
    },
    {
      "sku": "OAK-HM-001",
      "barcode": "234567890123",
      "name": "Oakley Half Jacket",
      "description": "Sport performance sunglasses",
      "companyName": "Oakley",
      "companyDescription": "Sports and lifestyle eyewear",
      "eyewearType": "SUNGLASSES",
      "frameType": "SEMI_RIM",
      "material": "O-Matter",
      "color": "Blue/Black",
      "size": "60mm",
      "model": "OJ9154",
      "basePrice": 180,
      "sellingPrice": 250,
      "quantity": 30,
      "minStockLevel": 5,
      "maxStockLevel": 60,
      "allocatedStock": 8,
      "availableStock": 22,
      "stockStatus": "IN_STOCK",
      "stockValue": 7500,
      "lastUpdated": "2025-11-17T10:00:00.000Z"
    }
  ]
}
```

**Response (200) - CSV Format:**

```
sku,barcode,name,description,companyName,eyewearType,frameType,material,color,size,model,basePrice,sellingPrice,quantity,minStockLevel,maxStockLevel
RB-AV-001,123456789012,Ray-Ban Aviator Classic,Premium aviator sunglasses,Ray-Ban,SUNGLASSES,FULL_RIM,Metal,Black,62mm,RB3025,150,200,50,10,100
OAK-HM-001,234567890123,Oakley Half Jacket,Sport performance sunglasses,Oakley,SUNGLASSES,SEMI_RIM,O-Matter,Blue/Black,60mm,OJ9154,180,250,30,5,60
```

**File Download Response (200):**

```
Content-Type: application/json or text/csv
Content-Disposition: attachment; filename="products_export_2025-11-17.json"
```

**Status:** ✅ **WORKING**

---

## 🏪 SHOP DISTRIBUTION ENDPOINTS (9)

### 31. Get Retailer Shops

**GET** `/shops`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `isActive` (optional): Filter by active status
- `partnershipType` (optional): Filter by partnership type

**Response (200):**

```json
[
  {
    "id": 1,
    "retailerId": 1,
    "shopId": 4,
    "partnershipType": "DEALER",
    "commissionRate": 15,
    "creditLimit": 50000,
    "paymentTerms": "NET_30",
    "isActive": true,
    "shop": {
      "id": 4,
      "name": "Optical World Test Branch",
      "address": "123 Test Street, Test City",
      "phone": "+1234567890",
      "email": "testbranch@opticalworld.com"
    },
    "stats": {
      "totalDistributions": 2,
      "totalQuantityDistributed": 15,
      "totalAmountDistributed": 2900,
      "pendingPayments": 2900
    }
  }
]
```

### 32. Add Shop to Network

**POST** `/shops`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "shopId": 3,
  "partnershipType": "FRANCHISE",
  "commissionRate": 20.0,
  "creditLimit": 75000.0,
  "paymentTerms": "NET_15"
}
```

**Response (201):**

```json
{
  "message": "Shop added to network successfully",
  "retailerShop": {
    "id": 2,
    "retailerId": 1,
    "shopId": 3,
    "partnershipType": "FRANCHISE",
    "commissionRate": 20,
    "creditLimit": 75000,
    "paymentTerms": "NET_15",
    "isActive": true,
    "shop": {
      "id": 3,
      "name": "Test Optical Shop",
      "address": "456 Shop Street",
      "phone": "+1234567891"
    }
  }
}
```

### 33. Update Shop Relationship

**PUT** `/shops/:retailerShopId`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "partnershipType": "DISTRIBUTOR",
  "commissionRate": 18.0,
  "creditLimit": 60000.0,
  "isActive": true
}
```

**Response (200):**

```json
{
  "message": "Shop relationship updated successfully",
  "retailerShop": {
    "id": 1,
    "partnershipType": "DISTRIBUTOR",
    "commissionRate": 18,
    "creditLimit": 60000,
    "updatedAt": "2025-09-23T05:30:00.000Z"
  }
}
```

### 34. Enhanced Distribute Products to Shop

**POST** `/distributions`

**Headers:**

```
Authorization: Bearer <token>
```

**Description:** Enhanced distribution endpoint with planning mode, batch validation, and improved error handling

**Request Body:**

```json
{
  "retailerShopId": 1,
  "distributions": [
    {
      "retailerProductId": 1,
      "quantity": 10,
      "unitPrice": 180.0
    },
    {
      "retailerProductId": 2,
      "quantity": 5,
      "unitPrice": 220.0
    }
  ],
  "notes": "Monthly distribution with enhanced tracking",
  "paymentDueDate": "2025-10-23T00:00:00Z",
  "deliveryExpectedDate": "2025-10-15T00:00:00Z",
  "planDistribution": false
}
```

**Planning Mode Request (planDistribution: true):**

```json
{
  "retailerShopId": 1,
  "distributions": [
    {
      "retailerProductId": 1,
      "quantity": 10,
      "unitPrice": 180.0
    }
  ],
  "planDistribution": true,
  "notes": "Test distribution plan"
}
```

**Enhanced Response (201) - Actual Distribution:**

```json
{
  "message": "Products distributed successfully",
  "distributions": [
    {
      "id": 1,
      "retailerId": 1,
      "retailerShopId": 1,
      "retailerProductId": 1,
      "quantity": 10,
      "unitPrice": 180,
      "totalAmount": 1800,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "notes": "Monthly distribution with enhanced tracking",
      "paymentDueDate": "2025-10-23T00:00:00.000Z",
      "deliveryExpectedDate": "2025-10-15T00:00:00.000Z",
      "retailerProduct": {
        "product": {
          "name": "Ray-Ban Aviator Classic Updated",
          "company": {
            "name": "Ray-Ban"
          }
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch"
        }
      }
    }
  ],
  "summary": {
    "shopName": "Optical World Test Branch",
    "totalItems": 2,
    "totalAmount": 2900,
    "distributionDate": "2025-09-23T05:45:00.000Z",
    "paymentDueDate": "2025-10-23T00:00:00.000Z",
    "deliveryExpectedDate": "2025-10-15T00:00:00.000Z"
  }
}
```

**Planning Mode Response (200):**

```json
{
  "message": "Distribution plan created successfully",
  "plan": {
    "shop": {
      "id": 1,
      "name": "Optical World Test Branch",
      "address": "456 Retail Ave, Business District"
    },
    "items": [
      {
        "productId": 1,
        "productName": "Ray-Ban Aviator Classic Updated",
        "company": "Ray-Ban",
        "quantity": 10,
        "unitPrice": 180,
        "itemTotal": 1800,
        "availableStock": 50,
        "stockAfterDistribution": 40
      }
    ],
    "totalAmount": 1800,
    "paymentDueDate": "2025-10-23T00:00:00.000Z",
    "deliveryExpectedDate": null,
    "notes": "Test distribution plan"
  }
}
```

**Enhanced Error Response (400) - Validation Errors:**

```json
{
  "error": "Validation failed for distribution items",
  "validationErrors": [
    {
      "index": 0,
      "productId": 1,
      "productName": "Ray-Ban Aviator Classic",
      "error": "Insufficient stock. Available: 5, Requested: 10"
    },
    {
      "index": 1,
      "error": "Unit price must be greater than 0"
    }
  ],
  "summary": {
    "totalItems": 2,
    "validItems": 0,
    "errorItems": 2
  }
}
```

**Features:**

- ✅ **Planning Mode**: Test distributions without committing changes
- ✅ **Batch Validation**: Validate all items before processing any
- ✅ **Enhanced Error Handling**: Detailed error messages with item indices
- ✅ **Transaction Safety**: Database consistency with Prisma transactions
- ✅ **Comprehensive Responses**: Detailed summaries and planning information
- ✅ **Delivery Tracking**: Expected delivery dates and enhanced status tracking
- ✅ **Stock Validation**: Real-time stock availability checking
- ✅ **Shop Validation**: Active shop verification with detailed information

```

### 35. Get All Distributions

**GET** `/distributions`

**Headers:**

```

Authorization: Bearer <token>

````

**Query Parameters:**

- `shopId` (optional): Filter by shop
- `status` (optional): Filter by delivery status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**

```json
{
  "distributions": [
    {
      "id": 1,
      "quantity": 10,
      "unitPrice": 180,
      "totalAmount": 1800,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "createdAt": "2025-09-23T05:06:40.000Z",
      "retailerProduct": {
        "product": {
          "name": "Ray-Ban Aviator Classic Updated"
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
````

### 36. Get Shop Specific Distributions

**GET** `/shops/:retailerShopId/distributions`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "shop": {
    "id": 1,
    "name": "Optical World Test Branch"
  },
  "distributions": [
    {
      "id": 1,
      "quantity": 10,
      "unitPrice": 180,
      "totalAmount": 1800,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "retailerProduct": {
        "product": {
          "name": "Ray-Ban Aviator Classic Updated"
        }
      }
    }
  ],
  "summary": {
    "totalDistributions": 2,
    "totalAmount": 2900,
    "pendingDeliveries": 2,
    "pendingPayments": 2900
  }
}
```

### 37. 🆕 Get Available Shops for Connection

**GET** `/shops/available`

**Headers:**

```
Authorization: Bearer <token>
```

**Description:** Discover shops that are not yet connected to your retailer network

**Response (200):**

```json
{
  "availableShops": [
    {
      "id": 1,
      "name": "Test Optical Shop",
      "address": "123 Test Street, Test City",
      "phone": "+1234567890",
      "email": "contact@testshop.com",
      "createdAt": "2025-09-30T08:11:35.195Z"
    }
  ],
  "total": 1,
  "message": "1 new shops available for connection"
}
```

**Status:** ✅ **WORKING** - Tested and verified

---

### 38. 🆕 Get My Shop Network with Enhanced Analytics

**GET** `/shops/my-network`

**Headers:**

```
Authorization: Bearer <token>
```

**Description:** Get comprehensive analytics of your connected shops with distribution statistics

**Response (200):**

```json
{
  "myShops": [
    {
      "id": 2,
      "shop": {
        "id": 1,
        "name": "Test Optical Shop",
        "address": "123 Test Street, Test City",
        "phone": "+1234567890",
        "email": "contact@testshop.com",
        "createdAt": "2025-09-30T08:11:35.195Z"
      },
      "partnershipType": "FRANCHISE",
      "joinedAt": "2025-10-07T07:55:31.041Z",
      "isActive": true,
      "stats": {
        "totalDistributions": 2,
        "totalQuantityDistributed": 8,
        "totalAmountDistributed": 885,
        "pendingDeliveries": 2,
        "pendingAmount": 885,
        "lastDistribution": {
          "date": "2025-10-07T07:59:35.124Z",
          "product": "Ray-Ban Aviator Classic",
          "quantity": 5,
          "amount": 600,
          "status": "PENDING"
        }
      }
    }
  ],
  "totalShops": 1,
  "message": "You have 1 shops in your distribution network"
}
```

**Status:** ✅ **WORKING** - Enhanced with real-time statistics

---

## 🚀 Testing Instructions

### Prerequisites

1. **Server Running:** Ensure the server is running on `http://localhost:8080`
2. **Authentication:** Login first to get the Bearer token
3. **Postman Setup:** Import this guide as a collection

### Authentication Flow

1. **Register or Login** to get your Bearer token
2. **Add token to headers** for all protected endpoints:
   ```
   Authorization: Bearer <your-token-here>
   ```

### Test Data Setup

1. **Create Companies:** Add Ray-Ban, Oakley, etc.
2. **Add Products:** Create products under different companies
3. **Add to Inventory:** Add products to retailer inventory
4. **Connect Shops:** Link existing shops to retailer
5. **Distribute Products:** Send products to connected shops

### Error Responses

All endpoints may return these common error responses:

**401 Unauthorized:**

```json
{
  "error": "Access denied. Please login."
}
```

**400 Bad Request:**

```json
{
  "error": "Validation error message"
}
```

**404 Not Found:**

```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error"
}
```

---

## ✅ Verification Checklist

### Core Functionality Tested ✅

- [x] **Authentication System** - Login, register, profile management
- [x] **Multi-Company Management** - Generic Brand, Ray-Ban, Oakley
- [x] **Multi-Eyewear Types** - SUNGLASSES, GLASSES, LENSES
- [x] **Inventory Management** - Stock tracking, pricing, valuation
- [x] **Shop Network** - Connect shops, manage partnerships
- [x] **Product Distribution** - Send products to shops, track deliveries
- [x] **Analytics & Reporting** - Dashboard metrics, stock valuation reports
- [x] **Retailer-Shop Integration** - Data flow between portals verified

### Business Logic Verified ✅

- [x] **Multi-Shop Operations** - Retailer can manage multiple shops with different partnership types
- [x] **Company-wise Analytics** - Track products and sales by company (Ray-Ban, Oakley, etc.)
- [x] **Eyewear Type Segmentation** - Analytics broken down by SUNGLASSES vs GLASSES
- [x] **Stock Management** - Add/remove stock with proper tracking
- [x] **Distribution Workflow** - Complete flow from retailer inventory to shop delivery

---

**🎯 Total Endpoints Documented: 38/38**
**📊 All Categories Covered: Authentication, Dashboard, Reports, Inventory, Bulk Operations, Shop Distribution**
**✅ Integration Verified: Retailer ↔ Shop Admin Portal**

### 🆕 ENHANCED ENDPOINTS (Updated Oct 2025)

- [x] **Shop Discovery** - GET /shops/available ✅ WORKING
- [x] **Network Analytics** - GET /shops/my-network ✅ WORKING
- [x] **Enhanced Distribution** - POST /distributions ✅ ENHANCED (Planning mode, batch validation, improved error handling)
