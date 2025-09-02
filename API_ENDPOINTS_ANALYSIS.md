# API Endpoints Analysis - Staff Management System

## Overview

This document provides a comprehensive analysis of all API endpoints in the Staff Management System, categorizing them by functionality and identifying overlapping features.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Staff & Attendance Management](#staff--attendance-management)
3. [Patient Management](#patient-management)
4. [Product & Inventory Management](#product--inventory-management)
5. [Invoice & Sales Management](#invoice--sales-management)
6. [Customer Management](#customer-management)
7. [Prescription Management](#prescription-management)
8. [Payment Processing](#payment-processing)
9. [Gift Card Management](#gift-card-management)
10. [Royalty Points System](#royalty-points-system)
11. [Reporting & Analytics](#reporting--analytics)
12. [Utility Services](#utility-services)
13. [Endpoint Overlaps & Similarities](#endpoint-overlaps--similarities)

---

## 1. Authentication & Authorization

### Base URL: `/api/auth`

| Endpoint    | Method | Purpose                      | Authentication | Controller Function       |
| ----------- | ------ | ---------------------------- | -------------- | ------------------------- |
| `/register` | POST   | Register new staff member    | None           | `authController.register` |
| `/login`    | POST   | Staff login with credentials | None           | `authController.login`    |
| `/logout`   | POST   | Staff logout (stateless)     | None           | `authController.logout`   |

**Functionality:**

- **Register**: Creates new staff account with hashed password, returns JWT token
- **Login**: Validates credentials, returns JWT token and staff info
- **Logout**: Simple response (stateless JWT system)

---

## 2. Staff & Attendance Management

### Base URL: `/api/attendance`

| Endpoint    | Method | Purpose                           | Authentication | Controller Function                         |
| ----------- | ------ | --------------------------------- | -------------- | ------------------------------------------- |
| `/login`    | POST   | Staff login + attendance tracking | None           | `attendanceController.login`                |
| `/`         | GET    | Get all attendance records        | Required       | `attendanceController.getAttendance`        |
| `/:staffId` | GET    | Get attendance by specific staff  | Required       | `attendanceController.getAttendanceByStaff` |

**Functionality:**

- **Login**: Similar to auth login but also records attendance entry
- **Get All**: Returns all attendance records with staff details
- **Get By Staff**: Returns attendance history for specific staff member

---

## 3. Patient Management

### Base URL: `/api/patient`

| Endpoint | Method | Purpose                   | Authentication | Controller Function               |
| -------- | ------ | ------------------------- | -------------- | --------------------------------- |
| `/`      | POST   | Create new patient record | Required       | `patientController.createPatient` |

**Functionality:**

- **Create Patient**: Adds new patient with personal details (name, age, gender, phone, address, medical history)

---

## 4. Product & Inventory Management

### Base URL: `/api/product`

| Endpoint | Method | Purpose          | Authentication | Controller Function |
| -------- | ------ | ---------------- | -------------- | ------------------- |
| `/`      | GET    | Get all products | Required       | Inline controller   |
| `/`      | POST   | Add new product  | Required       | Inline controller   |

### Base URL: `/api/inventory`

| Endpoint              | Method | Purpose                       | Authentication | Controller Function                        |
| --------------------- | ------ | ----------------------------- | -------------- | ------------------------------------------ |
| `/stock-by-barcode`   | POST   | Update stock using barcode    | Required       | `inventoryController.updateStockByBarcode` |
| `/product`            | POST   | Add product to inventory      | Required       | `inventoryController.addProduct`           |
| `/stock-in`           | POST   | Add stock to existing product | Required       | `inventoryController.stockIn`              |
| `/stock-out`          | POST   | Remove stock from product     | Required       | `inventoryController.stockOut`             |
| `/`                   | GET    | Get current inventory status  | Required       | `inventoryController.getInventory`         |
| `/product/:productId` | PUT    | Update product details        | Required       | `inventoryController.updateProduct`        |

**Functionality:**

- **Product Management**: Basic CRUD operations for products
- **Inventory Control**: Stock management with barcode scanning capability
- **Real-time Updates**: Track stock levels and product details

---

## 5. Invoice & Sales Management

### Base URL: `/api/invoice`

| Endpoint       | Method | Purpose                          | Authentication | Controller Function                        |
| -------------- | ------ | -------------------------------- | -------------- | ------------------------------------------ |
| `/`            | POST   | Create new invoice for patient   | Required       | `invoiceController.createInvoice`          |
| `/:id`         | GET    | Get invoice details by ID        | None           | `invoiceController.getInvoice`             |
| `/:id/pdf`     | GET    | Generate PDF invoice             | None           | `invoiceController.generateInvoicePdf`     |
| `/:id/thermal` | GET    | Generate thermal printer receipt | None           | `invoiceController.generateInvoiceThermal` |

**Functionality:**

- **Invoice Creation**: Creates invoices for existing patients with prescription linking
- **Invoice Retrieval**: Fetch complete invoice details
- **PDF Generation**: Professional invoice PDFs
- **Thermal Printing**: Receipt format for thermal printers

---

## 6. Customer Management

### Base URL: `/api/customer`

| Endpoint    | Method | Purpose                             | Authentication | Controller Function                           |
| ----------- | ------ | ----------------------------------- | -------------- | --------------------------------------------- |
| `/invoice`  | POST   | Create invoice for walk-in customer | Required       | `customerController.createCustomerAndInvoice` |
| `/hotspots` | GET    | Get popular customer addresses      | Required       | `customerController.getAddressHotspots`       |

**Functionality:**

- **Walk-in Sales**: Create customer and invoice in single transaction
- **Address Analytics**: Track popular delivery/customer locations

---

## 7. Prescription Management

### Base URL: `/api/prescription`

| Endpoint | Method | Purpose                 | Authentication | Controller Function                         |
| -------- | ------ | ----------------------- | -------------- | ------------------------------------------- |
| `/`      | POST   | Create new prescription | Required       | `prescriptionController.createPrescription` |
| `/:id`   | GET    | Get prescription by ID  | Required       | `prescriptionController.getPrescription`    |

**Functionality:**

- **Prescription Creation**: Store eye prescription data with JSON format
- **Prescription Retrieval**: Get prescription with patient details

---

## 8. Payment Processing

### Base URL: `/api/payment`

| Endpoint | Method | Purpose                     | Authentication | Controller Function                |
| -------- | ------ | --------------------------- | -------------- | ---------------------------------- |
| `/`      | POST   | Process payment for invoice | None           | `paymentController.processPayment` |

**Functionality:**

- **Payment Processing**: Record payments against invoices with method tracking

---

## 9. Gift Card Management

### Base URL: `/api/gift-card`

| Endpoint  | Method | Purpose                 | Authentication | Controller Function                 |
| --------- | ------ | ----------------------- | -------------- | ----------------------------------- |
| `/issue`  | POST   | Issue new gift card     | Required       | `giftCardController.issueCard`      |
| `/redeem` | POST   | Redeem gift card value  | Required       | `giftCardController.redeemCard`     |
| `/:code`  | GET    | Check gift card balance | Required       | `giftCardController.getCardBalance` |

**Functionality:**

- **Gift Card Issuance**: Create gift cards with unique codes and initial balance
- **Redemption**: Use gift card balance for purchases
- **Balance Inquiry**: Check remaining balance on gift cards

---

## 10. Royalty Points System

### Base URL: `/api/royalty`

| Endpoint      | Method | Purpose                       | Authentication | Controller Function           |
| ------------- | ------ | ----------------------------- | -------------- | ----------------------------- |
| `/`           | POST   | Add royalty points to patient | Required       | `royaltyController.addPoints` |
| `/:patientId` | GET    | Get patient's royalty points  | Required       | `royaltyController.getPoints` |

**Functionality:**

- **Points Addition**: Award loyalty points to patients
- **Points Inquiry**: Check current points balance

---

## 11. Reporting & Analytics

### Base URL: `/api/reporting`

| Endpoint                      | Method | Purpose                        | Authentication | Controller Function                             |
| ----------------------------- | ------ | ------------------------------ | -------------- | ----------------------------------------------- |
| `/daily`                      | GET    | Get daily sales report         | Required       | `reportingController.getDailyReport`            |
| `/monthly`                    | GET    | Get monthly sales report       | Required       | `reportingController.getMonthlyReport`          |
| `/staff-sales`                | GET    | Get staff performance report   | Required       | `reportingController.getStaffSalesReport`       |
| `/sales-by-price-tier`        | GET    | Sales analysis by price ranges | Required       | `reportingController.getSalesByPriceTier`       |
| `/best-sellers-by-price-tier` | GET    | Top products by price category | Required       | `reportingController.getBestSellersByPriceTier` |

**Functionality:**

- **Time-based Reports**: Daily and monthly sales summaries
- **Staff Analytics**: Individual staff member performance
- **Product Analytics**: Sales performance by price tiers and best sellers

---

## 12. Utility Services

### Base URL: `/api/barcode`

| Endpoint | Method | Purpose                                  | Authentication | Controller Function                      |
| -------- | ------ | ---------------------------------------- | -------------- | ---------------------------------------- |
| `/`      | POST   | Generate barcode label with product info | None           | `barcodeController.generateBarcodeLabel` |

**Functionality:**

- **Barcode Generation**: Creates custom barcode labels with product information and pricing

---

## 13. Endpoint Overlaps & Similarities

### 🔄 **Duplicate Login Functionality**

- **Issue**: Two different login endpoints with similar functionality
  - `/api/auth/login` - Basic authentication only
  - `/api/attendance/login` - Authentication + attendance tracking
- **Recommendation**: Consolidate or clearly differentiate use cases

### 🔄 **Product Management Split**

- **Issue**: Product operations spread across two modules
  - `/api/product/*` - Basic product CRUD
  - `/api/inventory/product` - Product creation with inventory
- **Recommendation**: Consolidate product management into single module

### 🔄 **Invoice Creation Patterns**

- **Similarity**: Two different invoice creation workflows
  - `/api/invoice/` - For existing patients with prescriptions
  - `/api/customer/invoice` - For walk-in customers
- **Status**: ✅ **Appropriate separation** - Different business workflows

### 🔄 **Staff Management Distribution**

- **Issue**: Staff-related operations across multiple endpoints
  - `/api/auth/*` - Staff authentication
  - `/api/attendance/*` - Staff attendance tracking
  - `/api/reporting/staff-sales` - Staff performance
- **Status**: ✅ **Acceptable** - Different functional domains

### 🔄 **Payment Processing**

- **Observation**: Multiple payment recording mechanisms
  - Direct in invoice creation (both customer and patient invoices)
  - Separate `/api/payment/` endpoint
- **Recommendation**: Standardize payment processing workflow

### 🔄 **Authentication Requirements**

- **Inconsistency**: Some endpoints require auth, others don't
  - Invoice viewing (no auth required)
  - PDF/thermal generation (no auth required)
  - Payment processing (no auth required)
- **Security Concern**: Consider adding authentication to sensitive operations

---

## Summary

The API provides comprehensive functionality for a medical/optical retail system with clear separation between:

1. **Patient-based transactions** (with prescriptions)
2. **Walk-in customer transactions** (without prescriptions)
3. **Staff management and tracking**
4. **Inventory and product management**
5. **Reporting and analytics**

### Key Strengths:

- ✅ Comprehensive feature coverage
- ✅ Clear business logic separation
- ✅ Good reporting capabilities
- ✅ Multiple invoice formats (PDF, thermal)

### Areas for Improvement:

- 🔧 Consolidate duplicate login functionality
- 🔧 Unify product management
- 🔧 Standardize payment processing
- 🔧 Review authentication requirements for security
- 🔧 Consider API versioning for future updates
