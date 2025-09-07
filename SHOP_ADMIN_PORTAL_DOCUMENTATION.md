# Shop Admin Portal Documentation

## Overview

The Shop Admin Portal is a comprehensive supervision and management system that allows shop administrators to monitor all staff activities, generate audit reports, manage inventory, and oversee the entire optical shop operations.

## Key Features

### 🔐 Authentication System

- **Shop Admin Registration**: Create new shop and admin account
- **Secure Login**: JWT-based authentication
- **Role-based Access**: Shop admin specific permissions

### 📊 Dashboard & Analytics

- **Real-time Metrics**: Today's sales, orders, patients, active staff
- **Growth Analytics**: Monthly/daily trends and comparisons
- **Business Insights**: Revenue growth, order volume analysis
- **Recent Activities**: Live feed of shop activities

### 👥 Staff Supervision

- **Staff Overview**: Complete list of all staff members
- **Performance Monitoring**: Sales metrics by staff member
- **Attendance Tracking**: Real-time attendance reports
- **Activity Monitoring**: Track all staff actions and transactions

### 📈 Comprehensive Reports

#### Audit Reports

- **Staff Attendance Report**: Detailed attendance tracking with hours worked
- **Staff Performance Report**: Sales performance and productivity metrics
- **Activity Logs**: Complete audit trail of all staff activities

#### Sales Reports

- **Sales Summary**: Daily, weekly, monthly, yearly sales breakdown
- **Product Sales Analysis**: Product-wise sales performance
- **Sales by Staff**: Individual staff sales contribution
- **Revenue Analytics**: Profit margins and revenue trends

#### Inventory Reports

- **Stock Movement History**: Track all inventory changes
- **Current Stock Status**: Real-time inventory levels
- **Low Stock Alerts**: Automated alerts for inventory management
- **Product Performance**: Best and worst performing products

#### Patient Reports

- **Patient Analytics**: New vs returning patients
- **Visit History**: Complete patient visit tracking
- **Patient Demographics**: Age, gender, location analysis
- **Service Utilization**: Most requested services

### 📦 Inventory Management

- **Stock In**: Add products from retailer to shop inventory
- **Stock Adjustments**: Manual inventory corrections
- **Real-time Tracking**: Live inventory status monitoring
- **Automated Alerts**: Low stock notifications

### 📁 Export & Reporting

- **PDF Export**: Professional PDF reports for all analytics
- **Excel Export**: Detailed spreadsheets for data analysis
- **Custom Date Ranges**: Flexible reporting periods
- **Automated Scheduling**: Regular report generation

## API Endpoints

### Authentication Endpoints

```
POST /shop-admin/auth/login
POST /shop-admin/auth/register
```

### Dashboard Endpoints

```
GET /shop-admin/dashboard/metrics
GET /shop-admin/dashboard/growth?period=monthly
GET /shop-admin/dashboard/activities
```

### Staff Management Endpoints

```
GET /shop-admin/staff
GET /shop-admin/staff/:staffId
GET /shop-admin/staff/activities?staffId=&startDate=&endDate=
```

### Report Endpoints

```
GET /shop-admin/reports/staff/attendance?startDate=&endDate=&staffId=
GET /shop-admin/reports/staff/performance?startDate=&endDate=
GET /shop-admin/reports/sales?period=daily&startDate=&endDate=
GET /shop-admin/reports/sales/products?startDate=&endDate=&productId=
GET /shop-admin/reports/sales/staff?startDate=&endDate=
GET /shop-admin/reports/inventory?type=all&startDate=&endDate=
GET /shop-admin/reports/inventory/status
GET /shop-admin/reports/inventory/alerts
GET /shop-admin/reports/patients?type=active&startDate=&endDate=
GET /shop-admin/reports/patients/visits?patientId=&startDate=&endDate=
```

### Inventory Management Endpoints

```
POST /shop-admin/inventory/stock-in
POST /shop-admin/inventory/adjust
GET /shop-admin/inventory/status
```

### Export Endpoints

```
GET /shop-admin/export/pdf?reportType=sales&startDate=&endDate=
GET /shop-admin/export/excel?reportType=inventory&startDate=&endDate=
```

## Database Schema Integration

### New Models Added

- **Shop**: Main shop entity
- **ShopAdmin**: Shop administrator account
- **ShopInventory**: Shop-specific inventory tracking
- **StockMovement**: All inventory movement history
- **PatientVisit**: Patient visit tracking for shop

### Relationships

- Shop → ShopAdmin (One to Many)
- Shop → Staff (One to Many)
- Shop → ShopInventory (One to Many)
- Shop → StockMovement (One to Many)
- Shop → PatientVisit (One to Many)

## Usage Examples

### 1. Shop Admin Registration

```javascript
POST /shop-admin/auth/register
{
  "name": "John Doe",
  "email": "admin@opticalshop.com",
  "password": "securePassword123",
  "shop": {
    "name": "Vision Care Center",
    "address": "123 Main Street, City",
    "phone": "+1234567890",
    "email": "contact@visioncare.com"
  }
}
```

### 2. Get Dashboard Metrics

```javascript
GET /shop-admin/dashboard/metrics
Authorization: Bearer <jwt_token>

Response:
{
  "today": {
    "sales": 15000,
    "orders": 45,
    "patients": 32,
    "staff": 8
  },
  "monthly": {
    "sales": 450000,
    "orders": 1250,
    "salesGrowth": 15.5,
    "orderGrowth": 8.2
  },
  "inventory": {
    "totalProducts": 2500,
    "lowStockAlerts": 12
  }
}
```

### 3. Get Staff Performance Report

```javascript
GET /shop-admin/reports/staff/performance?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt_token>

Response:
[
  {
    "staff": {
      "id": 1,
      "name": "Alice Johnson",
      "role": "Sales Associate"
    },
    "totalSales": 125000,
    "totalOrders": 156,
    "avgOrderValue": 801.28
  },
  {
    "staff": {
      "id": 2,
      "name": "Bob Smith",
      "role": "Optician"
    },
    "totalSales": 98000,
    "totalOrders": 142,
    "avgOrderValue": 690.14
  }
]
```

### 4. Stock In Products

```javascript
POST /shop-admin/inventory/stock-in
Authorization: Bearer <jwt_token>
{
  "productId": 123,
  "quantity": 50,
  "notes": "Weekly stock delivery from retailer"
}
```

### 5. Export Sales Report as PDF

```javascript
GET /shop-admin/export/pdf?reportType=sales&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt_token>

Returns: PDF file download
```

## Business Benefits

### For Shop Owners

- **Complete Visibility**: Monitor all aspects of shop operations
- **Performance Insights**: Identify top performing staff and products
- **Inventory Control**: Prevent stockouts and optimize inventory
- **Financial Tracking**: Track revenue, profits, and growth trends

### For Staff Management

- **Attendance Monitoring**: Ensure staff punctuality and presence
- **Performance Evaluation**: Data-driven staff assessments
- **Activity Tracking**: Monitor all staff interactions and sales
- **Training Identification**: Identify skill gaps and training needs

### For Business Growth

- **Data-Driven Decisions**: Make informed business choices
- **Customer Insights**: Understand patient behavior and preferences
- **Market Analysis**: Track product performance and trends
- **Operational Efficiency**: Optimize processes and workflows

## Security Features

- JWT-based authentication
- Role-based access control
- Shop-specific data isolation
- Secure password hashing
- Input validation and sanitization
- Error handling and logging

## Technical Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Export**: PDFKit for PDF, ExcelJS for spreadsheets
- **Middleware**: Custom authentication and error handling

## Future Enhancements

- Real-time notifications
- Mobile app support
- Advanced analytics with ML
- Automated report scheduling
- Integration with accounting systems
- Multi-location shop management

## Support

For technical support or feature requests, please contact the development team at support@sparklineworld.com.

---

_Shop Admin Portal - Empowering optical shops with comprehensive management and supervision capabilities._
