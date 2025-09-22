# Shop Admin Portal API Testing Guide 🧪

## Base URL Configuration

```
Development: http://localhost:8080
Production: https://your-domain.com
```

## API Base Path

```
/shop-admin
```

**Note**: The shop admin API is mounted at `/shop-admin` not `/api/shop-admin`

---

# Authentication Endpoints

## 1. Shop Admin Login

**POST** `/shop-admin/auth/login`

### Request Body

```json
{
  "email": "admin@shop1.com",
  "password": "admin123456"
}
```

### Success Response (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "shopAdmin": {
    "id": 1,
    "name": "Shop Owner",
    "email": "admin@shop1.com",
    "shop": {
      "id": 1,
      "name": "Optical Shop 1",
      "address": "123 Main Street",
      "phone": "+1234567890",
      "email": "shop1@example.com",
      "lowStockThreshold": 10
    }
  },
  "message": "Login successful"
}
```

### Error Responses

```json
// Invalid credentials (401)
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}

// Rate limited (429)
{
  "error": "Too many shop admin authentication attempts, please try again later.",
  "retryAfter": "15 minutes",
  "portal": "shopadmin"
}

// Validation error (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "field": "email"
}
```

### cURL Test

```bash
curl -X POST http://localhost:8080/shop-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shop1.com",
    "password": "admin123456"
  }'
```

### PowerShell Test

```powershell
$body = @{
  email = "admin@shop1.com"
  password = "admin123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/shop-admin/auth/login" -Method Post -ContentType "application/json" -Body $body
```

---

## 2. Shop Admin Registration

**POST** `/api/shop-admin/auth/register`

### Request Body

```json
{
  "name": "John Doe",
  "email": "admin@newshop.com",
  "password": "securePassword123",
  "shop": {
    "name": "New Optical Shop",
    "address": "456 Business Ave",
    "phone": "+1987654321",
    "email": "contact@newshop.com"
  }
}
```

### Success Response (201)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "shopAdmin": {
    "id": 2,
    "name": "John Doe",
    "email": "admin@newshop.com",
    "shop": {
      "id": 2,
      "name": "New Optical Shop",
      "address": "456 Business Ave",
      "phone": "+1987654321",
      "email": "contact@newshop.com",
      "lowStockThreshold": 10
    }
  },
  "message": "Shop admin account created successfully"
}
```

### Error Responses

```json
// Duplicate email (400)
{
  "error": "VALIDATION_ERROR",
  "message": "An account with this email already exists",
  "field": "email"
}

// Duplicate shop email (400)
{
  "error": "VALIDATION_ERROR",
  "message": "A shop with this email already exists",
  "field": "shop.email"
}
```

---

# Dashboard Endpoints

## 3. Dashboard Metrics

**GET** `/api/shop-admin/dashboard/metrics`

### Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Success Response (200)

```json
{
  "invoices": {
    "total": 150,
    "revenue": 45000.5
  },
  "inventory": {
    "totalProducts": 320,
    "lowStockCount": 12,
    "lowStockItems": [
      {
        "id": 15,
        "name": "Ray-Ban Aviator",
        "sku": "RB-AV-001",
        "quantity": 5,
        "minStockLevel": 10
      }
    ]
  },
  "staff": {
    "totalActive": 8
  },
  "lastUpdated": "2025-09-22T10:30:00.000Z",
  "cached": false
}
```

### cURL Test

```bash
curl -X GET http://localhost:8080/api/shop-admin/dashboard/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. Dashboard Growth Data

**GET** `/api/shop-admin/dashboard/growth?period=monthly`

### Query Parameters

- `period`: `daily`, `weekly`, `monthly`, `yearly`

### Success Response (200)

```json
{
  "period": "monthly",
  "data": [
    {
      "period": "2025-08",
      "revenue": 32000.0,
      "invoices": 95,
      "growth": 12.5
    },
    {
      "period": "2025-09",
      "revenue": 36000.0,
      "invoices": 108,
      "growth": 12.5
    }
  ],
  "lastUpdated": "2025-09-22T10:30:00.000Z",
  "cached": false
}
```

---

## 5. Recent Activities

**GET** `/api/shop-admin/dashboard/activities?page=1&limit=20&type=all&days=7`

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `type`: Activity type filter (default: "all")
- `days`: Days to look back (default: 7, max: 30)

### Success Response (200)

```json
{
  "data": [
    {
      "id": 101,
      "action": "STOCK_IN",
      "description": "Added 50 units of Ray-Ban Wayfarer",
      "timestamp": "2025-09-22T08:15:00.000Z",
      "user": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": false
  },
  "filters": {
    "type": "all",
    "days": 7
  },
  "lastUpdated": "2025-09-22T10:30:00.000Z",
  "cached": false
}
```

---

# Report Endpoints

## 6. Staff Attendance Report

**GET** `/api/shop-admin/reports/staff/attendance?startDate=2025-09-01&endDate=2025-09-22&format=json`

### Query Parameters

- `startDate`: Start date (YYYY-MM-DD) **required**
- `endDate`: End date (YYYY-MM-DD) **required**
- `staffId`: Specific staff ID (optional)
- `format`: Response format (`json`, `csv`, `pdf`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 200)

### Success Response (200)

```json
{
  "data": [
    {
      "staffId": 5,
      "staffName": "Alice Johnson",
      "date": "2025-09-22",
      "checkIn": "09:00:00",
      "checkOut": "18:00:00",
      "hoursWorked": 8.0,
      "status": "PRESENT"
    }
  ],
  "summary": {
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 2,
    "attendanceRate": 90.9
  },
  "reportPeriod": {
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-09-22T23:59:59.000Z",
    "days": 22
  },
  "generatedAt": "2025-09-22T10:30:00.000Z"
}
```

### Error Responses

```json
// Missing date range (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Start date and end date are required",
  "field": "dateRange"
}

// Invalid date format (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid date format. Use YYYY-MM-DD",
  "field": "dateFormat"
}

// Date range too large (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Date range cannot exceed 90 days",
  "field": "dateRange"
}
```

---

## 7. Sales Report

**GET** `/api/shop-admin/reports/sales?period=daily&startDate=2025-09-01&endDate=2025-09-22`

### Query Parameters

- `period`: `daily`, `weekly`, `monthly`, `yearly`
- `startDate`: Start date (optional)
- `endDate`: End date (optional)
- `category`: Product category filter (optional)
- `staffId`: Staff member filter (optional)
- `format`: Response format (default: "json")
- `includeItems`: Include item details (default: false)

### Success Response (200)

```json
{
  "data": [
    {
      "date": "2025-09-22",
      "revenue": 2450.0,
      "invoices": 8,
      "averageOrderValue": 306.25,
      "topProducts": [
        {
          "productId": 15,
          "productName": "Ray-Ban Aviator",
          "quantity": 3,
          "revenue": 750.0
        }
      ]
    }
  ],
  "summary": {
    "totalRevenue": 45000.0,
    "totalInvoices": 150,
    "averageDaily": 2045.45,
    "growthRate": 12.5
  },
  "reportConfig": {
    "period": "daily",
    "dateRange": {
      "startDate": "2025-09-01T00:00:00.000Z",
      "endDate": "2025-09-22T23:59:59.000Z",
      "days": 22
    },
    "filters": {
      "category": "all",
      "staffId": "all"
    }
  },
  "generatedAt": "2025-09-22T10:30:00.000Z",
  "cached": false
}
```

---

# Inventory Management Endpoints

## 8. Stock In (Add Inventory)

**POST** `/api/shop-admin/inventory/stock-in`

### Request Body

```json
{
  "productId": 15,
  "quantity": 50,
  "notes": "Weekly restock from supplier",
  "supplierId": 3
}
```

### Success Response (200)

```json
{
  "productId": 15,
  "previousQuantity": 25,
  "newQuantity": 75,
  "quantityAdded": 50,
  "updatedAt": "2025-09-22T10:30:00.000Z",
  "message": "Successfully stocked in 50 units",
  "timestamp": "2025-09-22T10:30:00.000Z"
}
```

### Error Responses

```json
// Invalid quantity (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Quantity must be a positive number",
  "field": "quantity"
}

// Product not found (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Product not found or does not belong to this shop",
  "field": "productId"
}

// Quantity too large (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Quantity cannot exceed 10,000 per transaction",
  "field": "quantity"
}
```

---

## 9. Stock Adjustment

**POST** `/api/shop-admin/inventory/adjust-stock`

### Request Body

```json
{
  "productId": 15,
  "newQuantity": 45,
  "reason": "Damaged items removed during quality check - 5 units had scratched lenses",
  "adjustmentType": "damaged"
}
```

### Success Response (200)

```json
{
  "productId": 15,
  "previousQuantity": 50,
  "newQuantity": 45,
  "difference": -5,
  "adjustmentType": "damaged",
  "updatedAt": "2025-09-22T10:30:00.000Z",
  "adjustment": {
    "type": "decrease",
    "difference": -5,
    "reason": "Damaged items removed during quality check - 5 units had scratched lenses"
  },
  "message": "Stock decrease of 5 units processed successfully",
  "timestamp": "2025-09-22T10:30:00.000Z"
}
```

### Error Responses

```json
// Insufficient reason (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Adjustment reason must be at least 10 characters",
  "field": "reason"
}

// Invalid adjustment type (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid adjustment type. Must be one of: manual, damaged, expired, theft, found, correction",
  "field": "adjustmentType"
}
```

---

## 10. Inventory Status

**GET** `/api/shop-admin/inventory/status?page=1&limit=50&lowStock=false&sortBy=name&sortOrder=asc`

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 200)
- `category`: Product category filter (optional)
- `lowStock`: Show only low stock items (default: false)
- `search`: Search by product name or SKU (optional)
- `sortBy`: Sort field (`name`, `quantity`, `price`, `category`, `updatedAt`)
- `sortOrder`: Sort order (`asc`, `desc`)

### Success Response (200)

```json
{
  "products": [
    {
      "id": 15,
      "name": "Ray-Ban Aviator",
      "sku": "RB-AV-001",
      "category": "SUNGLASSES",
      "quantity": 45,
      "minStockLevel": 10,
      "price": 250.0,
      "isLowStock": false,
      "lastRestocked": "2025-09-22T10:30:00.000Z"
    }
  ],
  "summary": {
    "totalProducts": 320,
    "lowStockCount": 12,
    "totalValue": 125000.0,
    "averageStockLevel": 35.5
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": true
  },
  "filters": {
    "category": null,
    "lowStock": false,
    "search": null,
    "sortBy": "name",
    "sortOrder": "asc"
  },
  "lastUpdated": "2025-09-22T10:30:00.000Z",
  "cached": false
}
```

---

# Export Endpoints

## 11. Export Report as PDF

**GET** `/api/shop-admin/reports/export/pdf?reportType=sales&startDate=2025-09-01&endDate=2025-09-22&format=standard`

### Query Parameters

- `reportType`: `sales`, `inventory`, `staff`, `patients`, `general`, `attendance`, `performance`
- `startDate`: Start date (optional)
- `endDate`: End date (optional)
- `format`: `standard`, `detailed`, `summary`

### Success Response (200)

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="sales-report-2025-09-22.pdf"
Content-Length: 245760

[PDF Binary Data]
```

### Error Responses

```json
// Invalid report type (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid report type. Valid types are: sales, inventory, staff, patients, general, attendance, performance",
  "field": "reportType"
}

// Date range too large (400)
{
  "error": "VALIDATION_ERROR",
  "message": "Date range cannot exceed 365 days for PDF export",
  "field": "dateRange"
}
```

---

## 12. Export Report as Excel

**GET** `/api/shop-admin/reports/export/excel?reportType=inventory&format=detailed&includeCharts=true`

### Query Parameters

- `reportType`: Same as PDF export
- `startDate`: Start date (optional)
- `endDate`: End date (optional)
- `format`: `standard`, `detailed`, `summary`, `pivot`
- `includeCharts`: Include charts in Excel (default: false)

### Success Response (200)

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="inventory-report-2025-09-22.xlsx"
Content-Length: 524288

[Excel Binary Data]
```

---

# Staff Management Endpoints

## 13. Get All Staff

**GET** `/api/shop-admin/staff?page=1&limit=20&status=ACTIVE`

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Staff status filter (`ACTIVE`, `INACTIVE`, `SUSPENDED`)

### Success Response (200)

```json
{
  "staff": [
    {
      "id": 5,
      "name": "Alice Johnson",
      "email": "alice@shop1.com",
      "phone": "+1234567890",
      "role": "SALES_ASSOCIATE",
      "status": "ACTIVE",
      "hireDate": "2025-01-15T00:00:00.000Z",
      "lastLogin": "2025-09-22T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "hasMore": false
  },
  "summary": {
    "active": 8,
    "inactive": 2,
    "suspended": 0
  }
}
```

---

## 14. Get Staff Details

**GET** `/api/shop-admin/staff/5`

### Success Response (200)

```json
{
  "id": 5,
  "name": "Alice Johnson",
  "email": "alice@shop1.com",
  "phone": "+1234567890",
  "role": "SALES_ASSOCIATE",
  "status": "ACTIVE",
  "hireDate": "2025-01-15T00:00:00.000Z",
  "lastLogin": "2025-09-22T08:30:00.000Z",
  "performance": {
    "salesThisMonth": 15000.0,
    "invoicesThisMonth": 45,
    "averageOrderValue": 333.33,
    "attendanceRate": 95.5
  },
  "recentActivity": [
    {
      "action": "INVOICE_CREATED",
      "description": "Created invoice #INV-2025-001234",
      "timestamp": "2025-09-22T14:30:00.000Z"
    }
  ]
}
```

---

# Error Handling Standards

## HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests (Rate Limited)
- `500`: Internal Server Error

## Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "field": "fieldName (for validation errors)",
  "timestamp": "2025-09-22T10:30:00.000Z"
}
```

---

# Rate Limiting Information

## Authentication Endpoints

- **Limit**: 5 attempts per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## General API Endpoints

- **Limit**: 100 requests per minute per user
- **Identification**: By user ID if authenticated, otherwise by IP

## Export Endpoints

- **Limit**: 3 exports per 5 minutes per user
- **Purpose**: Prevent server overload from large report generation

## Report Endpoints

- **Slow Down**: After 5 requests per 15 minutes, add 500ms delay per request
- **Maximum Delay**: 20 seconds

---

# Authentication Requirements

## JWT Token

All protected endpoints require JWT token in header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Token Information

- **Expiration**: 24 hours
- **Issuer**: "optical-shop-admin"
- **Audience**: "shop-admin"
- **Payload**: Contains `shopAdminId`, `shopId`, `iat`

---

# Testing Scripts

## Full Test Suite (PowerShell)

```powershell
# Set base URL
$baseUrl = "http://localhost:8080"

# Login and get token
$loginData = @{
  email = "admin@shop1.com"
  password = "admin123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/shop-admin/auth/login" -Method Post -ContentType "application/json" -Body $loginData
$token = $loginResponse.token

# Set headers for authenticated requests
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# Test dashboard metrics
$dashboardMetrics = Invoke-RestMethod -Uri "$baseUrl/api/shop-admin/dashboard/metrics" -Method Get -Headers $headers
Write-Output "Dashboard Metrics: $($dashboardMetrics | ConvertTo-Json -Depth 3)"

# Test inventory status
$inventoryStatus = Invoke-RestMethod -Uri "$baseUrl/api/shop-admin/inventory/status?page=1&limit=10" -Method Get -Headers $headers
Write-Output "Inventory Status: $($inventoryStatus | ConvertTo-Json -Depth 3)"

# Test staff list
$staffList = Invoke-RestMethod -Uri "$baseUrl/api/shop-admin/staff" -Method Get -Headers $headers
Write-Output "Staff List: $($staffList | ConvertTo-Json -Depth 3)"
```

## Performance Testing

```bash
# Install Apache Bench
# Test login endpoint performance
ab -n 100 -c 10 -p login.json -T application/json http://localhost:8080/api/shop-admin/auth/login

# Test dashboard endpoint (with auth header)
ab -n 1000 -c 50 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/shop-admin/dashboard/metrics
```

---

This comprehensive testing guide covers all Shop Admin Portal endpoints with detailed request/response examples, error handling, rate limiting information, and testing scripts. Use this guide to thoroughly test the API functionality and ensure production readiness.
