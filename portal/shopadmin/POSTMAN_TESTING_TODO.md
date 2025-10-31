# Shop Admin Portal Postman Testing TODO List

## Complete Route Coverage with Request/Response Bodies

---

## 🔧 **SETUP TODOS**

### 1. **Environment Setup**

- **Description**: Set up Postman environment variables for base URL and authentication token
- **Environment Variables**:
  ```json
  {
    "baseUrl": "http://localhost:8080",
    "token": "{{loginToken}}"
  }
  ```
- **Status**: Not Started

---

## 🔐 **AUTHENTICATION ENDPOINTS (PUBLIC)**

### 2. **POST /shop-admin/auth/login**

- **Description**: Test shop admin login and capture JWT token
- **Method**: POST
- **URL**: `{{baseUrl}}/shop-admin/auth/login`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "email": "admin@shop1.com",
    "password": "admin123456"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Post-request Script**:
  ```javascript
  pm.test("Login successful", function () {
    pm.response.to.have.status(200);
  });
  pm.test("Token exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.environment.set("loginToken", jsonData.token);
  });
  ```
- **Status**: Not Started

### 3. **POST /shop-admin/auth/register**

- **Description**: Test shop admin registration with new shop creation
- **Method**: POST
- **URL**: `{{baseUrl}}/shop-admin/auth/register`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "name": "Test Admin",
    "email": "testadmin@newshop.com",
    "password": "securePassword123",
    "shop": {
      "name": "Test Optical Shop",
      "address": "123 Test Street, Test City",
      "phone": "+1234567890",
      "email": "contact@testshop.com"
    }
  }
  ```
- **Expected Response (201)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "shopAdmin": {
      "id": 2,
      "name": "Test Admin",
      "email": "testadmin@newshop.com"
    },
    "message": "Shop admin account created successfully"
  }
  ```
- **Status**: Not Started

---

## 📊 **DASHBOARD ENDPOINTS (PROTECTED)**

### 4. **GET /shop-admin/dashboard/metrics**

- **Description**: Test dashboard overview metrics endpoint
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/dashboard/metrics`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "today": {
      "sales": 0,
      "orders": 0,
      "patients": 0,
      "staff": 0
    },
    "monthly": {
      "sales": 0,
      "orders": 0,
      "salesGrowth": 0,
      "orderGrowth": 0
    },
    "inventory": {
      "totalProducts": 0,
      "lowStockAlerts": 0
    },
    "lastUpdated": "2025-09-22T04:28:43.046Z",
    "cached": false
  }
  ```
- **Status**: Not Started

### 5. **GET /shop-admin/dashboard/growth**

- **Description**: Test dashboard growth data with different periods
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/dashboard/growth?period=monthly`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `period`: "daily", "weekly", "monthly", "yearly"
- **Expected Response (200)**:
  ```json
  {
    "0": {
      "period": "Oct 2024",
      "sales": 0,
      "orders": 0,
      "patients": 0
    },
    "period": "monthly",
    "lastUpdated": "2025-09-22T04:29:08.434Z",
    "cached": false
  }
  ```
- **Status**: Not Started

### 6. **GET /shop-admin/dashboard/activities**

- **Description**: Test recent activities tracking
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/dashboard/activities?page=1&limit=20&type=all&days=7`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `page`: 1
  - `limit`: 20
  - `type`: "all", "sales", "inventory", "attendance"
  - `days`: 7
- **Expected Response (200)**:
  ```json
  {
    "pagination": {
      "page": 1,
      "limit": 20,
      "hasMore": false
    },
    "filters": {
      "type": "all",
      "days": 7
    },
    "lastUpdated": "2025-09-22T04:30:53.081Z",
    "cached": false
  }
  ```
- **Status**: Not Started

---

## 📈 **REPORT ENDPOINTS (PROTECTED)**

### 7. **GET /shop-admin/reports/staff/attendance**

- **Description**: Test staff attendance report
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/staff/attendance?startDate=2025-09-01&endDate=2025-09-22&format=json`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
  - `format`: "json"
  - `staffId`: (optional)
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalStaff": 0,
      "presentToday": 0,
      "avgWorkingHours": 0
    },
    "details": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 8. **GET /shop-admin/reports/staff/performance**

- **Description**: Test staff performance report with sales metrics
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/staff/performance?startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalStaff": 0,
      "topPerformer": null,
      "avgSalesPerStaff": 0
    },
    "staffPerformance": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 9. **GET /shop-admin/reports/sales**

- **Description**: Test sales summary report
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/sales?startDate=2025-01-01&endDate=2025-12-31`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `period`: "today", "week", "month", "year", "custom"
  - `startDate`: "2025-01-01"
  - `endDate`: "2025-12-31"
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalSales": 0,
      "totalOrders": 0,
      "avgOrderValue": 0,
      "totalTax": 0,
      "subtotal": 0
    },
    "details": [],
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    }
  }
  ```
- **Status**: Not Started

### 10. **GET /shop-admin/reports/sales/products**

- **Description**: Test product-wise sales breakdown
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/sales/products?startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
  - `productId`: (optional)
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalProducts": 0,
      "totalRevenue": 0,
      "topSellingProduct": null
    },
    "productSales": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 11. **GET /shop-admin/reports/sales/staff**

- **Description**: Test sales by staff report
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/sales/staff?startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalStaff": 0,
      "totalSales": 0,
      "topPerformer": null
    },
    "staffSales": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 11.1 **GET /shop-admin/reports/sales/by-price-tier**

- **Description**: Test sales breakdown by product price tier (Low, Medium, High)
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/sales/by-price-tier?startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "tierDefinitions": {
      "low": {
        "max": 50
      },
      "medium": {
        "min": 50,
        "max": 500
      },
      "high": {
        "min": 500
      }
    },
    "salesByTier": {
      "low": {
        "count": 15,
        "revenue": 500.0,
        "percentage": 20.5
      },
      "medium": {
        "count": 32,
        "revenue": 8000.0,
        "percentage": 65.3
      },
      "high": {
        "count": 8,
        "revenue": 3000.0,
        "percentage": 14.2
      }
    },
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 11.2 **GET /shop-admin/reports/sales/by-month**

- **Description**: Test monthly sales breakdown with daily details
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/sales/by-month?year=2025&month=9`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `year`: 2025
  - `month`: 9 (1-12)
- **Expected Response (200)**:
  ```json
  {
    "monthYear": "September 2025",
    "summary": {
      "totalSales": 24500.0,
      "totalOrders": 55,
      "totalCustomers": 32,
      "averageOrderValue": 445.45,
      "totalDiscount": 2450.0,
      "totalTax": 3675.0,
      "netRevenue": 22050.0
    },
    "dailyBreakdown": [
      {
        "date": "2025-09-01",
        "sales": 1500.0,
        "orders": 5,
        "customers": 4
      },
      {
        "date": "2025-09-02",
        "sales": 2100.0,
        "orders": 8,
        "customers": 6
      }
    ],
    "topProducts": [
      {
        "productId": 15,
        "productName": "Premium Sunglasses",
        "unitsSold": 12,
        "revenue": 6000.0
      }
    ],
    "period": {
      "month": 9,
      "year": 2025
    }
  }
  ```
- **Status**: Not Started

### 11.3 **GET /shop-admin/reports/sales/best-sellers**

- **Description**: Test best sellers report with price tier breakdown
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/sales/best-sellers?startDate=2025-09-01&endDate=2025-09-22&limit=10`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
  - `limit`: 10 (number of top sellers per tier)
- **Expected Response (200)**:
  ```json
  {
    "tierDefinitions": {
      "low": {
        "max": 50
      },
      "medium": {
        "min": 50,
        "max": 500
      },
      "high": {
        "min": 500
      }
    },
    "bestSellers": {
      "low": [
        {
          "productName": "Basic Frames",
          "unitPrice": 35.0,
          "totalQuantity": 42,
          "totalRevenue": 1470.0,
          "rank": 1
        }
      ],
      "medium": [
        {
          "productName": "Standard Lenses",
          "unitPrice": 150.0,
          "totalQuantity": 28,
          "totalRevenue": 4200.0,
          "rank": 1
        }
      ],
      "high": [
        {
          "productName": "Premium Sunglasses",
          "unitPrice": 650.0,
          "totalQuantity": 8,
          "totalRevenue": 5200.0,
          "rank": 1
        }
      ]
    },
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 12. **GET /shop-admin/reports/inventory**

- **Description**: Test inventory movement report
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/inventory?type=all&startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `type`: "stock_in", "stock_out", "all"
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalMovements": 0,
      "stockIn": 0,
      "stockOut": 0
    },
    "movements": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 13. **GET /shop-admin/reports/inventory/status**

- **Description**: Test current stock status report
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/inventory/status`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalProducts": 0,
      "inStock": 0,
      "lowStock": 0,
      "outOfStock": 0
    },
    "inventory": []
  }
  ```
- **Status**: Not Started

### 14. **GET /shop-admin/reports/inventory/alerts**

- **Description**: Test low stock alerts
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/inventory/alerts`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  []
  ```
- **Status**: Not Started

### 15. **GET /shop-admin/reports/patients**

- **Description**: Test patient report
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/patients?type=all&startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `type`: "active", "new", "all"
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalPatients": 0,
      "newPatients": 0,
      "activePatients": 0
    },
    "patients": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

### 16. **GET /shop-admin/reports/patients/visits**

- **Description**: Test patient visit history
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/reports/patients/visits?startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `patientId`: (optional)
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "summary": {
      "totalVisits": 0,
      "uniquePatients": 0,
      "avgVisitsPerPatient": 0
    },
    "visits": [],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

---

## 👥 **STAFF MANAGEMENT ENDPOINTS (PROTECTED)**

### 17. **GET /shop-admin/staff**

- **Description**: Test get all staff under the shop
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/staff?page=1&limit=20&status=ACTIVE`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `page`: 1
  - `limit`: 20
  - `status`: "ACTIVE", "INACTIVE", "ALL"
- **Expected Response (200)**:
  ```json
  {
    "staff": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "hasMore": false
    },
    "summary": {
      "totalStaff": 0,
      "activeStaff": 0,
      "inactiveStaff": 0
    }
  }
  ```
- **Status**: Not Started

### 18. **GET /shop-admin/staff/:staffId**

- **Description**: Test get detailed information about specific staff member
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/staff/5`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "staff": {
      "id": 5,
      "name": "John Staff",
      "email": "john@shop1.com",
      "role": "OPTICIAN",
      "isActive": true,
      "joinDate": "2025-01-15",
      "lastLogin": "2025-09-22T10:30:00.000Z"
    },
    "performance": {
      "totalSales": 0,
      "totalOrders": 0,
      "avgOrderValue": 0
    },
    "attendance": {
      "presentDays": 0,
      "totalDays": 0,
      "attendanceRate": 0
    }
  }
  ```
- **Status**: Not Started

### 19. **GET /shop-admin/staff/activities**

- **Description**: Test monitor staff activities and performance
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/staff/activities?staffId=5&startDate=2025-09-01&endDate=2025-09-22`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `staffId`: (optional)
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
- **Expected Response (200)**:
  ```json
  {
    "activities": [],
    "summary": {
      "totalActivities": 0,
      "salesActivities": 0,
      "inventoryActivities": 0
    },
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-22"
    }
  }
  ```
- **Status**: Not Started

---

## 👨‍⚕️ **DOCTOR MANAGEMENT ENDPOINTS (PROTECTED)**

### 20. **POST /shop-admin/doctors/add**

- **Description**: Test add a new doctor (OPTOMETRIST) to the shop
- **Method**: POST
- **URL**: `{{baseUrl}}/shop-admin/doctors/add`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "email": "doctor@shop1.com",
    "password": "doctorPassword123",
    "name": "Dr. John Optometrist",
    "specialization": "OPTOMETRY",
    "licenseNumber": "OPT123456",
    "experience": 5
  }
  ```
- **Expected Response (201)**:
  ```json
  {
    "doctor": {
      "id": 3,
      "name": "Dr. John Optometrist",
      "email": "doctor@shop1.com",
      "role": "OPTOMETRIST",
      "isActive": true
    },
    "message": "Doctor added successfully"
  }
  ```
- **Status**: Not Started

### 21. **GET /shop-admin/doctors**

- **Description**: Test get all doctors (OPTOMETRISTS) in the shop
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/doctors`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "doctors": [],
    "summary": {
      "totalDoctors": 0,
      "activeDoctors": 0,
      "inactiveDoctors": 0
    }
  }
  ```
- **Status**: Not Started

### 22. **PUT /shop-admin/doctors/:doctorId/status**

- **Description**: Test update doctor status (activate/deactivate)
- **Method**: PUT
- **URL**: `{{baseUrl}}/shop-admin/doctors/3/status`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "doctor": {
      "id": 3,
      "name": "Dr. John Optometrist",
      "isActive": false
    },
    "message": "Doctor status updated successfully"
  }
  ```
- **Status**: Not Started

---

## 📦 **INVENTORY MANAGEMENT ENDPOINTS (PROTECTED)**

### 23. **POST /shop-admin/inventory/stock-in**

- **Description**: Test add stock to shop inventory (from retailer)
- **Method**: POST
- **URL**: `{{baseUrl}}/shop-admin/inventory/stock-in`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "productId": 15,
    "quantity": 50,
    "supplierName": "Optical Wholesale Co.",
    "batchNo": "BATCH001",
    "expiryDate": "2026-12-31",
    "unitCost": 25.5,
    "notes": "New stock arrival from supplier"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "stockMovement": {
      "id": 101,
      "productId": 15,
      "quantity": 50,
      "type": "STOCK_IN",
      "previousQty": 10,
      "newQty": 60
    },
    "message": "Stock added successfully"
  }
  ```
- **Status**: Not Started

### 24. **POST /shop-admin/inventory/adjust**

- **Description**: Test manual stock adjustment
- **Method**: POST
- **URL**: `{{baseUrl}}/shop-admin/inventory/adjust`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "productId": 15,
    "newQuantity": 45,
    "reason": "DAMAGE",
    "notes": "5 units damaged during handling"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "stockMovement": {
      "id": 102,
      "productId": 15,
      "quantity": -15,
      "type": "ADJUSTMENT",
      "previousQty": 60,
      "newQty": 45,
      "reason": "DAMAGE"
    },
    "message": "Stock adjusted successfully"
  }
  ```
- **Status**: Not Started

### 25. **GET /shop-admin/inventory/status**

- **Description**: Test get current inventory status with stock levels
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/inventory/status?page=1&limit=50&lowStock=false&sortBy=name&sortOrder=asc`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `page`: 1
  - `limit`: 50
  - `lowStock`: true/false
  - `sortBy`: "name", "quantity", "sku"
  - `sortOrder`: "asc", "desc"
- **Expected Response (200)**:
  ```json
  {
    "inventory": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 0,
      "hasMore": false
    },
    "summary": {
      "totalProducts": 0,
      "totalValue": 0,
      "lowStockItems": 0
    }
  }
  ```
- **Status**: Not Started

---

## 📤 **EXPORT ENDPOINTS (PROTECTED)**

### 26. **GET /shop-admin/export/pdf**

- **Description**: Test export any report as PDF
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/export/pdf?reportType=sales&startDate=2025-09-01&endDate=2025-09-22&format=standard`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `reportType`: "sales", "inventory", "staff", "patients"
  - `startDate`: "2025-09-01"
  - `endDate`: "2025-09-22"
  - `format`: "standard", "detailed", "summary"
- **Expected Response (200)**:
  - Content-Type: application/pdf
  - Binary PDF file for download
- **Tests**:
  ```javascript
  pm.test("PDF export successful", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.headers.get("Content-Type")).to.include(
      "application/pdf"
    );
  });
  ```
- **Status**: Not Started

### 27. **GET /shop-admin/export/excel**

- **Description**: Test export any report as Excel
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/export/excel?reportType=inventory&format=detailed&includeCharts=true`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{loginToken}}"
  }
  ```
- **Query Parameters**:
  - `reportType`: "sales", "inventory", "staff", "patients"
  - `format`: "standard", "detailed", "summary"
  - `includeCharts`: true/false
- **Expected Response (200)**:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Binary Excel file for download
- **Tests**:
  ```javascript
  pm.test("Excel export successful", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.headers.get("Content-Type")).to.include(
      "spreadsheetml.sheet"
    );
  });
  ```
- **Status**: Not Started

---

## 🔧 **ERROR HANDLING & EDGE CASES**

### 28. **Test Invalid Authentication**

- **Description**: Test endpoints with invalid/expired tokens
- **Method**: GET
- **URL**: `{{baseUrl}}/shop-admin/dashboard/metrics`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer invalid_token"
  }
  ```
- **Expected Response (401)**:
  ```json
  {
    "error": "INVALID_TOKEN",
    "message": "Invalid token."
  }
  ```
- **Status**: Not Started

### 29. **Test Rate Limiting**

- **Description**: Test rate limiting on authentication endpoints
- **Method**: POST (Multiple rapid requests)
- **URL**: `{{baseUrl}}/shop-admin/auth/login`
- **Expected Response (429)**:
  ```json
  {
    "error": "Too many shop admin authentication attempts, please try again later.",
    "retryAfter": "15 minutes",
    "portal": "shopadmin"
  }
  ```
- **Status**: Not Started

### 30. **Test Validation Errors**

- **Description**: Test endpoints with invalid request bodies
- **Method**: POST
- **URL**: `{{baseUrl}}/shop-admin/auth/login`
- **Request Body** (Invalid):
  ```json
  {
    "email": "invalid-email",
    "password": ""
  }
  ```
- **Expected Response (400)**:
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "field": "email"
  }
  ```
- **Status**: Not Started

=====================

### 31 . Staff Performance Report

**GET** `/reports/staff-performance`

**Headers:** `Authorization: Bearer <token>`
it is for shop admin ==>>.
**Query Parameters:**

- `staffId` (optional): Specific staff member
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

**Response (200):**

```json
{
  "staffPerformance": [
    {
      "staffId": 1,
      "staffName": "John Doe",
      "totalSales": 15000.0,
      "invoiceCount": 45,
      "averageOrderValue": 333.33,
      "workingDays": 20,
      "averageDailySales": 750.0,
      "attendanceRate": 95.0
    }
  ],
  "topPerformer": {
    "staffId": 1,
    "staffName": "John Doe",
    "totalSales": 15000.0
  }
}
```

---

## 📋 **POSTMAN COLLECTION STRUCTURE**

### 31. **Create Postman Collection**

- **Description**: Organize all requests into a structured Postman collection
- **Structure**:
  ```
  Shop Admin Portal API
  ├── 🔐 Authentication
  │   ├── Login
  │   └── Register
  ├── 📊 Dashboard
  │   ├── Metrics
  │   ├── Growth
  │   └── Activities
  ├── 📈 Reports
  │   ├── Staff Reports
  │   ├── Sales Reports
  │   ├── Inventory Reports
  │   └── Patient Reports
  ├── 👥 Staff Management
  │   ├── Get All Staff
  │   ├── Get Staff Details
  │   └── Staff Activities
  ├── 👨‍⚕️ Doctor Management
  │   ├── Add Doctor
  │   ├── Get Doctors
  │   └── Update Doctor Status
  ├── 📦 Inventory Management
  │   ├── Stock In
  │   ├── Adjust Stock
  │   └── Inventory Status
  ├── 📤 Export
  │   ├── PDF Export
  │   └── Excel Export
  └── 🧪 Error Testing
      ├── Invalid Auth
      ├── Rate Limiting
      └── Validation Errors
  ```
- **Status**: Not Started

### 32. **Setup Pre-request Scripts**

- **Description**: Add collection-level pre-request scripts for token management
- **Pre-request Script**:
  ```javascript
  // Auto-login if token is missing or expired
  if (!pm.environment.get("loginToken")) {
    pm.sendRequest(
      {
        url: pm.environment.get("baseUrl") + "/shop-admin/auth/login",
        method: "POST",
        header: {
          "Content-Type": "application/json",
        },
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "admin@shop1.com",
            password: "admin123456",
          }),
        },
      },
      function (err, response) {
        if (response.code === 200) {
          var jsonData = response.json();
          pm.environment.set("loginToken", jsonData.token);
        }
      }
    );
  }
  ```
- **Status**: Not Started

---

## ✅ **COMPLETION CHECKLIST**

- [ ] Environment setup with variables
- [ ] All 27 API endpoints tested
- [ ] Request bodies validated
- [ ] Response schemas verified
- [ ] Authentication flow tested
- [ ] Error scenarios covered
- [ ] Rate limiting tested
- [ ] Export functionality verified
- [ ] Collection properly organized
- [ ] Pre-request scripts configured
- [ ] Test scripts for each endpoint
- [ ] Documentation completed

---

## 📊 **SUMMARY**

**Total Endpoints to Test**: 30 (27 + 3 new sales reports)
**Authentication Endpoints**: 2
**Dashboard Endpoints**: 3
**Report Endpoints**: 13 (10 + 3 new sales reports)
**Staff Management Endpoints**: 3
**Doctor Management Endpoints**: 3
**Inventory Management Endpoints**: 3
**Export Endpoints**: 2
**Error Testing Scenarios**: 3

**Expected Testing Time**: 5-7 hours for complete coverage
**Tools Required**: Postman, Running Server, Valid Test Data
