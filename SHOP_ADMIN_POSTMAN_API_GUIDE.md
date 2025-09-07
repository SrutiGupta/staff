# Shop Admin Portal - Complete Postman API Testing Guide

## 📋 Table of Contents

1. [Authentication Setup](#authentication-setup)
2. [Environment Variables](#environment-variables)
3. [Public Routes (No Auth)](#public-routes-no-auth)
4. [Protected Routes (Auth Required)](#protected-routes-auth-required)
5. [Testing Scenarios](#testing-scenarios)
6. [Error Handling](#error-handling)

---

## 🔐 Authentication Setup

### Base URL

```
http://localhost:8080
```

### JWT Token Usage

All protected routes require JWT token in Authorization header:

```
Authorization: Bearer {{jwt_token}}
```

---

## 🌐 Environment Variables

Create these variables in Postman Environment:

| Variable        | Value                                  | Description          |
| --------------- | -------------------------------------- | -------------------- |
| `base_url`      | `http://localhost:8080`                | API base URL         |
| `jwt_token`     | `{{login_response.token}}`             | JWT token from login |
| `shop_admin_id` | `{{login_response.shopAdmin.id}}`      | Shop Admin ID        |
| `shop_id`       | `{{login_response.shopAdmin.shop.id}}` | Shop ID              |

---

## 🚪 Public Routes (No Auth)

### 1. **Shop Admin Registration**

**Endpoint**: `POST /shop-admin/auth/register`

**Headers**:

```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:

```json
{
  "name": "John Admin",
  "email": "admin@opticalshop.com",
  "password": "admin123456",
  "shop": {
    "name": "Vision Care Center",
    "address": "123 Main Street, Downtown, City 12345",
    "phone": "+1-234-567-8900",
    "email": "contact@visioncare.com"
  }
}
```

**Response (201 Created)**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "shopAdmin": {
    "id": 1,
    "name": "John Admin",
    "email": "admin@opticalshop.com",
    "shop": {
      "id": 1,
      "name": "Vision Care Center",
      "address": "123 Main Street, Downtown, City 12345",
      "phone": "+1-234-567-8900"
    }
  }
}
```

**Postman Test Script**:

```javascript
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Response has token", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.token).to.be.a("string");
  pm.environment.set("jwt_token", jsonData.token);
});
```

---

### 2. **Shop Admin Login**

**Endpoint**: `POST /shop-admin/auth/login`

**Headers**:

```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:

```json
{
  "email": "admin@opticalshop.com",
  "password": "admin123456"
}
```

**Response (200 OK)**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "shopAdmin": {
    "id": 1,
    "name": "John Admin",
    "email": "admin@opticalshop.com",
    "shop": {
      "id": 1,
      "name": "Vision Care Center",
      "address": "123 Main Street, Downtown, City 12345",
      "phone": "+1-234-567-8900"
    }
  }
}
```

**Postman Test Script**:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Login successful", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.token).to.be.a("string");
  pm.environment.set("jwt_token", jsonData.token);
  pm.environment.set("shop_admin_id", jsonData.shopAdmin.id);
  pm.environment.set("shop_id", jsonData.shopAdmin.shop.id);
});
```

---

## 🔒 Protected Routes (Auth Required)

### **Common Headers for All Protected Routes**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{jwt_token}}"
}
```

---

## 📊 Dashboard Routes

### 3. **Get Dashboard Metrics**

**Endpoint**: `GET /shop-admin/dashboard/metrics`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Request Body**: None (GET request)

**Response (200 OK)**:

```json
{
  "today": {
    "sales": 15750.5,
    "orders": 23,
    "patients": 18,
    "staff": 5
  },
  "monthly": {
    "sales": 125000.75,
    "orders": 156,
    "salesGrowth": 12.5,
    "orderGrowth": 8.3
  },
  "inventory": {
    "totalProducts": 2450,
    "lowStockAlerts": 8
  }
}
```

**Postman Test Script**:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Dashboard metrics structure", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("today");
  pm.expect(jsonData).to.have.property("monthly");
  pm.expect(jsonData).to.have.property("inventory");
});
```

---

### 4. **Get Dashboard Growth Data**

**Endpoint**: `GET /shop-admin/dashboard/growth`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?period=monthly
```

_Options: `daily`, `monthly`_

**Response (200 OK)**:

```json
[
  {
    "period": "Jan 2025",
    "sales": 45000.0,
    "orders": 87,
    "patients": 65
  },
  {
    "period": "Feb 2025",
    "sales": 52000.0,
    "orders": 95,
    "patients": 72
  },
  {
    "period": "Mar 2025",
    "sales": 48000.0,
    "orders": 89,
    "patients": 68
  }
]
```

---

### 5. **Get Recent Activities**

**Endpoint**: `GET /shop-admin/dashboard/activities`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Response (200 OK)**:

```json
[
  {
    "type": "sale",
    "message": "Alice Johnson created invoice #INV-001 for John Doe",
    "amount": 250.0,
    "timestamp": "2025-09-08T14:30:00Z"
  },
  {
    "type": "attendance",
    "message": "Bob Smith checked in",
    "timestamp": "2025-09-08T09:15:00Z"
  },
  {
    "type": "inventory",
    "message": "Ray-Ban Sunglasses - STOCK_IN (25 units)",
    "timestamp": "2025-09-08T11:20:00Z"
  }
]
```

---

## 📈 Reports Routes

### 6. **Get Staff Attendance Report**

**Endpoint**: `GET /shop-admin/reports/staff/attendance`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?startDate=2025-09-01&endDate=2025-09-30&staffId=1
```

**Response (200 OK)**:

```json
[
  {
    "staff": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@shop.com",
      "role": "SALES_STAFF"
    },
    "totalDays": 22,
    "totalHours": 176.5,
    "avgHours": 8.02,
    "records": [
      {
        "date": "2025-09-08T00:00:00Z",
        "checkIn": "2025-09-08T09:00:00Z",
        "checkOut": "2025-09-08T17:30:00Z",
        "hoursWorked": 8.5
      }
    ]
  }
]
```

---

### 7. **Get Staff Performance Report**

**Endpoint**: `GET /shop-admin/reports/staff/performance`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?startDate=2025-09-01&endDate=2025-09-30
```

**Response (200 OK)**:

```json
[
  {
    "staff": {
      "id": 1,
      "name": "Alice Johnson",
      "role": "SALES_STAFF"
    },
    "totalSales": 45000.0,
    "totalOrders": 89,
    "avgOrderValue": 505.62
  },
  {
    "staff": {
      "id": 2,
      "name": "Bob Smith",
      "role": "OPTOMETRIST"
    },
    "totalSales": 38000.0,
    "totalOrders": 76,
    "avgOrderValue": 500.0
  }
]
```

---

### 8. **Get Sales Report**

**Endpoint**: `GET /shop-admin/reports/sales`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?period=monthly
```

_Options: `today`, `week`, `month`, `year` or custom with `startDate` & `endDate`_

**Response (200 OK)**:

```json
{
  "summary": {
    "totalSales": 125000.75,
    "totalOrders": 234,
    "avgOrderValue": 534.19,
    "totalTax": 15000.09,
    "subtotal": 110000.66
  },
  "details": [
    {
      "id": "INV-001",
      "date": "2025-09-08T14:30:00Z",
      "staff": "Alice Johnson",
      "patient": "John Doe",
      "amount": 250.0,
      "items": 2,
      "products": [
        {
          "name": "Ray-Ban Aviator",
          "sku": "RB-AVI-001",
          "quantity": 1,
          "price": 150.0
        },
        {
          "name": "Blue Light Filter",
          "sku": "BLF-001",
          "quantity": 1,
          "price": 100.0
        }
      ]
    }
  ]
}
```

---

### 9. **Get Product Sales Report**

**Endpoint**: `GET /shop-admin/reports/sales/products`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?startDate=2025-09-01&endDate=2025-09-30&productId=1
```

**Response (200 OK)**:

```json
[
  {
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator",
      "sku": "RB-AVI-001",
      "category": "SUNGLASSES",
      "company": "Ray-Ban"
    },
    "totalQuantitySold": 45,
    "totalRevenue": 6750.0,
    "totalTransactions": 38,
    "avgPricePerUnit": 150.0
  }
]
```

---

### 10. **Get Sales by Staff Report**

**Endpoint**: `GET /shop-admin/reports/sales/staff`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?startDate=2025-09-01&endDate=2025-09-30
```

**Response (200 OK)**:

```json
[
  {
    "staff": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@shop.com",
      "role": "SALES_STAFF"
    },
    "totalSales": 45000.0,
    "totalOrders": 89,
    "avgOrderValue": 505.62
  }
]
```

---

## 📦 Inventory Reports

### 11. **Get Inventory Report**

**Endpoint**: `GET /shop-admin/reports/inventory`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?type=all&startDate=2025-09-01&endDate=2025-09-30
```

_type options: `stock_in`, `stock_out`, `all`_

**Response (200 OK)**:

```json
{
  "summary": [
    {
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator",
        "sku": "RB-AVI-001",
        "category": "SUNGLASSES"
      },
      "type": "STOCK_IN",
      "totalQuantity": 50,
      "movements": [
        {
          "id": 1,
          "quantity": 25,
          "notes": "Weekly delivery",
          "date": "2025-09-01T10:00:00Z"
        },
        {
          "id": 2,
          "quantity": 25,
          "notes": "Restock order",
          "date": "2025-09-15T14:00:00Z"
        }
      ]
    }
  ],
  "details": [
    {
      "id": 1,
      "productId": 1,
      "type": "STOCK_IN",
      "quantity": 25,
      "notes": "Weekly delivery",
      "createdAt": "2025-09-01T10:00:00Z"
    }
  ]
}
```

---

### 12. **Get Stock Status Report**

**Endpoint**: `GET /shop-admin/reports/inventory/status`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Response (200 OK)**:

```json
{
  "summary": {
    "totalProducts": 150,
    "inStock": 120,
    "lowStock": 25,
    "outOfStock": 5
  },
  "categorized": {
    "inStock": [
      {
        "id": 1,
        "quantity": 45,
        "product": {
          "id": 1,
          "name": "Ray-Ban Aviator",
          "sku": "RB-AVI-001",
          "category": "SUNGLASSES",
          "company": "Ray-Ban"
        }
      }
    ],
    "lowStock": [
      {
        "id": 2,
        "quantity": 5,
        "product": {
          "id": 2,
          "name": "Oakley Sport",
          "sku": "OAK-SPT-001",
          "category": "SUNGLASSES",
          "company": "Oakley"
        }
      }
    ],
    "outOfStock": [
      {
        "id": 3,
        "quantity": 0,
        "product": {
          "id": 3,
          "name": "Blue Light Filter",
          "sku": "BLF-001",
          "category": "LENSES",
          "company": "Essilor"
        }
      }
    ]
  }
}
```

---

### 13. **Get Low Stock Alerts**

**Endpoint**: `GET /shop-admin/reports/inventory/alerts`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Response (200 OK)**:

```json
[
  {
    "product": {
      "id": 2,
      "name": "Oakley Sport",
      "sku": "OAK-SPT-001",
      "category": "SUNGLASSES"
    },
    "currentStock": 5,
    "alertLevel": "medium",
    "lastUpdated": "2025-09-08T12:00:00Z"
  },
  {
    "product": {
      "id": 3,
      "name": "Blue Light Filter",
      "sku": "BLF-001",
      "category": "LENSES"
    },
    "currentStock": 0,
    "alertLevel": "critical",
    "lastUpdated": "2025-09-07T16:30:00Z"
  }
]
```

---

## 👥 Patient Reports

### 14. **Get Patient Report**

**Endpoint**: `GET /shop-admin/reports/patients`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?type=active&startDate=2025-09-01&endDate=2025-09-30
```

_type options: `active`, `new`, `all`_

**Response (200 OK)**:

```json
{
  "summary": {
    "totalPatients": 145,
    "newPatients": 23,
    "totalVisits": 278,
    "avgSpendPerPatient": 450.75
  },
  "patients": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 35,
      "gender": "Male",
      "phone": "+1234567890",
      "registrationDate": "2025-08-15T10:30:00Z",
      "totalSpent": 750.0,
      "totalOrders": 3,
      "totalPrescriptions": 2,
      "lastVisit": "2025-09-05T14:20:00Z"
    }
  ],
  "visits": [
    {
      "id": 1,
      "patient": {
        "id": 1,
        "name": "John Doe"
      },
      "visitDate": "2025-09-05T14:20:00Z",
      "purpose": "Eye examination",
      "notes": "Regular checkup"
    }
  ]
}
```

---

### 15. **Get Patient Visit History**

**Endpoint**: `GET /shop-admin/reports/patients/visits`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?patientId=1&startDate=2025-09-01&endDate=2025-09-30
```

**Response (200 OK)**:

```json
[
  {
    "id": 1,
    "visitDate": "2025-09-05T14:20:00Z",
    "purpose": "Eye examination",
    "notes": "Regular checkup",
    "patient": {
      "id": 1,
      "name": "John Doe",
      "age": 35,
      "phone": "+1234567890"
    }
  },
  {
    "id": 2,
    "visitDate": "2025-08-15T10:30:00Z",
    "purpose": "New prescription",
    "notes": "First time visit",
    "patient": {
      "id": 1,
      "name": "John Doe",
      "age": 35,
      "phone": "+1234567890"
    }
  }
]
```

---

## 👨‍💼 Staff Management

### 16. **Get All Staff**

**Endpoint**: `GET /shop-admin/staff`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Response (200 OK)**:

```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@shop.com",
    "role": "SALES_STAFF",
    "isActive": true,
    "lastAttendance": {
      "id": 15,
      "checkIn": "2025-09-08T09:00:00Z",
      "checkOut": null,
      "staffId": 1
    },
    "totalSales": 45000.0,
    "totalOrders": 89,
    "joinDate": "2025-01-15T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Bob Smith",
    "email": "bob@shop.com",
    "role": "OPTOMETRIST",
    "isActive": true,
    "lastAttendance": {
      "id": 16,
      "checkIn": "2025-09-08T08:30:00Z",
      "checkOut": null,
      "staffId": 2
    },
    "totalSales": 38000.0,
    "totalOrders": 76,
    "joinDate": "2025-02-01T00:00:00Z"
  }
]
```

---

### 17. **Get Staff Details**

**Endpoint**: `GET /shop-admin/staff/:staffId`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Path Parameters**:

- `staffId`: `1`

**Response (200 OK)**:

```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice@shop.com",
  "role": "SALES_STAFF",
  "isActive": true,
  "createdAt": "2025-01-15T00:00:00Z",
  "shopId": 1,
  "attendance": [
    {
      "id": 15,
      "checkIn": "2025-09-08T09:00:00Z",
      "checkOut": null,
      "staffId": 1
    },
    {
      "id": 14,
      "checkIn": "2025-09-07T09:15:00Z",
      "checkOut": "2025-09-07T17:30:00Z",
      "staffId": 1
    }
  ],
  "invoices": [
    {
      "id": "INV-001",
      "totalAmount": 250.0,
      "createdAt": "2025-09-08T14:30:00Z",
      "patient": {
        "name": "John Doe"
      }
    }
  ],
  "prescriptions": [
    {
      "id": 1,
      "createdAt": "2025-09-08T14:00:00Z",
      "patient": {
        "name": "John Doe"
      }
    }
  ]
}
```

---

### 18. **Get Staff Activities**

**Endpoint**: `GET /shop-admin/staff/activities`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?staffId=1&startDate=2025-09-01&endDate=2025-09-30
```

**Response (200 OK)**:

```json
[
  {
    "type": "invoice",
    "staff": "Alice Johnson",
    "description": "Created invoice #INV-001 for John Doe",
    "amount": 250.0,
    "timestamp": "2025-09-08T14:30:00Z"
  },
  {
    "type": "prescription",
    "staff": "Alice Johnson",
    "description": "Created prescription for John Doe",
    "timestamp": "2025-09-08T14:00:00Z"
  },
  {
    "type": "attendance",
    "staff": "Alice Johnson",
    "description": "Checked in",
    "timestamp": "2025-09-08T09:00:00Z"
  }
]
```

---

## 📦 Inventory Management

### 19. **Stock In Products**

**Endpoint**: `POST /shop-admin/inventory/stock-in`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Request Body**:

```json
{
  "productId": 1,
  "quantity": 25,
  "notes": "Weekly delivery from retailer"
}
```

**Response (201 Created)**:

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 1,
  "quantity": 70,
  "createdAt": "2025-09-08T10:00:00Z",
  "updatedAt": "2025-09-08T15:30:00Z"
}
```

**Postman Test Script**:

```javascript
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Stock updated successfully", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("quantity");
  pm.expect(jsonData.quantity).to.be.above(0);
});
```

---

### 20. **Adjust Stock**

**Endpoint**: `POST /shop-admin/inventory/adjust`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Request Body**:

```json
{
  "productId": 1,
  "newQuantity": 50,
  "reason": "Damaged items removed from inventory"
}
```

**Response (200 OK)**:

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 1,
  "quantity": 50,
  "createdAt": "2025-09-08T10:00:00Z",
  "updatedAt": "2025-09-08T15:45:00Z"
}
```

---

### 21. **Get Inventory Status**

**Endpoint**: `GET /shop-admin/inventory/status`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Response (200 OK)**:

```json
[
  {
    "id": 1,
    "quantity": 50,
    "value": 7500.0,
    "status": "good",
    "lastUpdated": "2025-09-08T15:45:00Z",
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator",
      "sku": "RB-AVI-001",
      "category": "SUNGLASSES",
      "company": "Ray-Ban",
      "price": 150.0
    }
  },
  {
    "id": 2,
    "quantity": 5,
    "value": 750.0,
    "status": "low",
    "lastUpdated": "2025-09-07T12:30:00Z",
    "product": {
      "id": 2,
      "name": "Oakley Sport",
      "sku": "OAK-SPT-001",
      "category": "SUNGLASSES",
      "company": "Oakley",
      "price": 150.0
    }
  }
]
```

---

## 📄 Export Routes

### 22. **Export Report as PDF**

**Endpoint**: `GET /shop-admin/export/pdf`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?reportType=sales&startDate=2025-09-01&endDate=2025-09-30
```

**Response**: PDF file download

- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename=sales-report.pdf`

---

### 23. **Export Report as Excel**

**Endpoint**: `GET /shop-admin/export/excel`

**Headers**: [Common Protected Headers](#common-headers-for-all-protected-routes)

**Query Parameters**:

```
?reportType=inventory&startDate=2025-09-01&endDate=2025-09-30
```

**Response**: Excel file download

- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename=inventory-report.xlsx`

---

## 🧪 Testing Scenarios

### **Complete Testing Flow**

1. **Register Shop Admin** → Save token
2. **Login Shop Admin** → Verify token works
3. **Get Dashboard Metrics** → Verify data structure
4. **Create Stock Movement** → Test inventory management
5. **Generate Reports** → Test all report types
6. **Export Data** → Test PDF/Excel exports

### **Postman Collection Structure**

```
📁 Shop Admin Portal
├── 📁 Authentication
│   ├── Register Shop Admin
│   └── Login Shop Admin
├── 📁 Dashboard
│   ├── Get Metrics
│   ├── Get Growth Data
│   └── Get Activities
├── 📁 Reports
│   ├── 📁 Staff Reports
│   │   ├── Attendance Report
│   │   └── Performance Report
│   ├── 📁 Sales Reports
│   │   ├── Sales Summary
│   │   ├── Product Sales
│   │   └── Sales by Staff
│   ├── 📁 Inventory Reports
│   │   ├── Inventory History
│   │   ├── Stock Status
│   │   └── Low Stock Alerts
│   └── 📁 Patient Reports
│       ├── Patient Summary
│       └── Visit History
├── 📁 Staff Management
│   ├── Get All Staff
│   ├── Get Staff Details
│   └── Get Staff Activities
├── 📁 Inventory Management
│   ├── Stock In
│   ├── Adjust Stock
│   └── Get Status
└── 📁 Export
    ├── Export PDF
    └── Export Excel
```

---

## ❌ Error Handling

### **Common Error Responses**

#### **401 Unauthorized**

```json
{
  "message": "Invalid credentials"
}
```

#### **400 Bad Request**

```json
{
  "message": "Validation Error",
  "details": ["shopId is required", "email must be valid"]
}
```

#### **404 Not Found**

```json
{
  "message": "Staff member not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Internal Server Error",
  "error": "Database connection failed"
}
```

### **Postman Error Testing**

```javascript
pm.test("Handle authentication errors", function () {
  if (pm.response.code === 401) {
    pm.expect(pm.response.json().message).to.include("credentials");
  }
});

pm.test("Handle validation errors", function () {
  if (pm.response.code === 400) {
    pm.expect(pm.response.json()).to.have.property("message");
  }
});
```

---

## 🚀 Quick Start Collection

### **Import into Postman**

1. Create new collection "Shop Admin Portal"
2. Set up environment variables
3. Import all endpoints above
4. Run authentication first
5. Test all protected routes

### **Pre-request Script for Authentication**

```javascript
// Auto-include JWT token for protected routes
if (
  pm.request.url.toString().includes("/shop-admin/") &&
  !pm.request.url.toString().includes("/auth/")
) {
  pm.request.headers.add({
    key: "Authorization",
    value: "Bearer " + pm.environment.get("jwt_token"),
  });
}
```

---

_Last Updated: September 8, 2025_  
_API Version: Shop Admin Portal v1.0_  
_Total Endpoints: 23_
