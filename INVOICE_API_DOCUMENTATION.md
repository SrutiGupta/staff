# Complete Invoice System API Documentation

## Overview

This comprehensive API documentation covers the complete invoice system including patient management, customer management, prescription handling, invoice generation, PDF creation, and thermal printing.

## Authentication

All endpoints require Bearer Token authentication:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Base URL

```
http://localhost:3000/api
```

---

## 🏥 PATIENT MANAGEMENT

### 1. Create Patient

**POST** `/api/patient`

**Request Body:**

```json
{
  "name": "John Doe",
  "age": 35,
  "gender": "Male",
  "phone": "+91-9876543210",
  "address": "123 Main Street, City",
  "medicalHistory": "No significant medical history"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "John Doe",
  "age": 35,
  "gender": "Male",
  "phone": "+91-9876543210",
  "address": "123 Main Street, City",
  "medicalHistory": "No significant medical history",
  "createdAt": "2025-09-04T10:30:00.000Z",
  "updatedAt": "2025-09-04T10:30:00.000Z"
}
```

### 2. Get All Patients

**GET** `/api/patient?page=1&limit=10&search=john`

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or phone

**Response (200):**

```json
{
  "patients": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 35,
      "gender": "Male",
      "phone": "+91-9876543210",
      "address": "123 Main Street, City",
      "medicalHistory": "No significant medical history",
      "createdAt": "2025-09-04T10:30:00.000Z",
      "updatedAt": "2025-09-04T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 3. Get Single Patient

**GET** `/api/patient/:id`

**Response (200):**

```json
{
  "id": 1,
  "name": "John Doe",
  "age": 35,
  "gender": "Male",
  "phone": "+91-9876543210",
  "address": "123 Main Street, City",
  "medicalHistory": "No significant medical history",
  "prescriptions": [
    {
      "id": 1,
      "rightEye": { "sph": "-1.25", "cyl": "-0.50", "axis": "180" },
      "leftEye": { "sph": "-1.50", "cyl": "-0.75", "axis": "170" },
      "createdAt": "2025-09-04T10:35:00.000Z"
    }
  ],
  "invoices": [
    {
      "id": "cmf47cx1r0001uswopqybr7e4",
      "totalAmount": 4220.0,
      "status": "PAID"
    }
  ],
  "createdAt": "2025-09-04T10:30:00.000Z",
  "updatedAt": "2025-09-04T10:30:00.000Z"
}
```

---

## 👥 CUSTOMER MANAGEMENT

### 1. Create Customer

**POST** `/api/customer`

**Request Body:**

```json
{
  "name": "Jane Smith",
  "phone": "+91-9876543210",
  "address": "456 Oak Ave, Sometown, USA"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Jane Smith",
  "phone": "+91-9876543210",
  "address": "456 Oak Ave, Sometown, USA",
  "createdAt": "2025-09-04T10:30:00.000Z",
  "updatedAt": "2025-09-04T10:30:00.000Z"
}
```

### 2. Get All Customers

**GET** `/api/customer?page=1&limit=10&search=jane`

**Response (200):**

```json
{
  "customers": [
    {
      "id": 1,
      "name": "Jane Smith",
      "phone": "+91-9876543210",
      "address": "456 Oak Ave, Sometown, USA",
      "createdAt": "2025-09-04T10:30:00.000Z",
      "updatedAt": "2025-09-04T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 3. Get Single Customer

**GET** `/api/customer/:id`

**Response (200):**

```json
{
  "id": 1,
  "name": "Jane Smith",
  "phone": "+91-9876543210",
  "address": "456 Oak Ave, Sometown, USA",
  "invoices": [
    {
      "id": "cmf47cx1r0001uswopqybr7e4",
      "totalAmount": 150.0,
      "status": "PAID",
      "items": [
        {
          "id": 1,
          "quantity": 1,
          "unitPrice": 150.0,
          "product": {
            "name": "Ray-Ban Aviator Classic"
          }
        }
      ]
    }
  ],
  "createdAt": "2025-09-04T10:30:00.000Z",
  "updatedAt": "2025-09-04T10:30:00.000Z"
}
```

### 4. Create Customer + Invoice (Walk-in)

**POST** `/api/customer/invoice`

**Request Body:**

```json
{
  "customer": {
    "name": "Walk-in Customer",
    "phone": "+91-9876543210",
    "address": "123 Street, City"
  },
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 2500,
      "discount": 250
    }
  ],
  "staffId": 1,
  "paidAmount": 1000,
  "paymentMethod": "cash"
}
```

### 5. Get Address Hotspots

**GET** `/api/customer/hotspots`

**Response (200):**

```json
[
  {
    "address": "Main Street",
    "customerCount": 15
  },
  {
    "address": "Oak Avenue",
    "customerCount": 12
  }
]
```

---

## 👁️ PRESCRIPTION MANAGEMENT

### 1. Create Prescription

**POST** `/api/prescription`

**Request Body:**

```json
{
  "patientId": 1,
  "rightEye": {
    "sph": "-1.25",
    "cyl": "-0.50",
    "axis": "180",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.50",
    "cyl": "-0.75",
    "axis": "170",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  }
}
```

**Response (201):**

```json
{
  "id": 1,
  "patientId": 1,
  "rightEye": {
    "sph": "-1.25",
    "cyl": "-0.50",
    "axis": "180",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.50",
    "cyl": "-0.75",
    "axis": "170",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "createdAt": "2025-09-04T10:35:00.000Z",
  "updatedAt": "2025-09-04T10:35:00.000Z"
}
```

### 2. Get All Prescriptions

**GET** `/api/prescription?page=1&limit=10&patientId=1`

**Response (200):**

```json
{
  "prescriptions": [
    {
      "id": 1,
      "patientId": 1,
      "rightEye": { "sph": "-1.25", "cyl": "-0.50", "axis": "180" },
      "leftEye": { "sph": "-1.50", "cyl": "-0.75", "axis": "170" },
      "patient": {
        "id": 1,
        "name": "John Doe"
      },
      "createdAt": "2025-09-04T10:35:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 3. Get Single Prescription

**GET** `/api/prescription/:id`

**Response (200):**

```json
{
  "id": 1,
  "patientId": 1,
  "rightEye": {
    "sph": "-1.25",
    "cyl": "-0.50",
    "axis": "180",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.50",
    "cyl": "-0.75",
    "axis": "170",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "patient": {
    "id": 1,
    "name": "John Doe",
    "age": 35,
    "gender": "Male"
  },
  "createdAt": "2025-09-04T10:35:00.000Z",
  "updatedAt": "2025-09-04T10:35:00.000Z"
}
```

---

## 🧾 INVOICE MANAGEMENT

### 1. Create Invoice

**POST** `/api/invoice`

**For Patient Invoice:**

```json
{
  "patientId": 1,
  "prescriptionId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 2500,
      "discount": 250
    },
    {
      "productId": 2,
      "quantity": 2,
      "unitPrice": 800,
      "discount": 80
    }
  ]
}
```

**For Customer Invoice:**

```json
{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 150,
      "discount": 0
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "cmf47cx1r0001uswopqybr7e4",
  "patientId": 1,
  "customerId": null,
  "staffId": 1,
  "prescriptionId": 1,
  "subtotal": 3770.0,
  "totalDiscount": 330.0,
  "totalIgst": 0.0,
  "totalCgst": 332.1,
  "totalSgst": 332.1,
  "totalAmount": 4104.2,
  "paidAmount": 0.0,
  "status": "UNPAID",
  "createdAt": "2025-09-04T10:40:00.000Z",
  "updatedAt": "2025-09-04T10:40:00.000Z",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 1,
      "unitPrice": 2500.0,
      "discount": 250.0,
      "cgst": 202.5,
      "sgst": 202.5,
      "totalPrice": 2250.0,
      "product": {
        "name": "Premium Frame Model XYZ",
        "company": {
          "name": "Acme Eyewear"
        }
      }
    }
  ],
  "patient": {
    "id": 1,
    "name": "John Doe"
  }
}
```

### 2. Get All Invoices

**GET** `/api/invoice?page=1&limit=10&status=PAID&patientId=1&prescriptionId=1`

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: UNPAID, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED
- `patientId`: Filter by patient ID
- `customerId`: Filter by customer ID
- `staffId`: Filter by staff ID
- `prescriptionId`: Filter by prescription ID
- `startDate`: Filter by date (YYYY-MM-DD)
- `endDate`: Filter by date (YYYY-MM-DD)

**Response (200):**

```json
{
  "invoices": [
    {
      "id": "cmf47cx1r0001uswopqybr7e4",
      "patientId": 1,
      "totalAmount": 4104.2,
      "status": "PAID",
      "createdAt": "2025-09-04T10:40:00.000Z",
      "patient": {
        "name": "John Doe"
      },
      "items": [
        {
          "quantity": 1,
          "product": {
            "name": "Premium Frame Model XYZ"
          }
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 3. Get Single Invoice

**GET** `/api/invoice/:id`

**Response (200):**

```json
{
  "id": "cmf47cx1r0001uswopqybr7e4",
  "patientId": 1,
  "prescriptionId": 1,
  "subtotal": 3770.0,
  "totalAmount": 4104.2,
  "status": "PAID",
  "patient": {
    "id": 1,
    "name": "John Doe",
    "phone": "+91-9876543210"
  },
  "prescription": {
    "id": 1,
    "rightEye": { "sph": "-1.25", "cyl": "-0.50", "axis": "180" },
    "leftEye": { "sph": "-1.50", "cyl": "-0.75", "axis": "170" }
  },
  "items": [
    {
      "id": 1,
      "quantity": 1,
      "unitPrice": 2500.0,
      "totalPrice": 2250.0,
      "product": {
        "name": "Premium Frame Model XYZ",
        "company": {
          "name": "Acme Eyewear"
        }
      }
    }
  ],
  "transactions": [
    {
      "id": 1,
      "amount": 4104.2,
      "paymentMethod": "CASH",
      "createdAt": "2025-09-04T11:00:00.000Z"
    }
  ]
}
```

### 4. Update Invoice Status

**PATCH** `/api/invoice/:id/status`

**Request Body:**

```json
{
  "status": "PAID"
}
```

**Valid Statuses:** UNPAID, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED

### 5. Add Payment

**POST** `/api/invoice/:id/payment`

**Request Body:**

```json
{
  "amount": 2000.0,
  "paymentMethod": "CASH",
  "giftCardId": 5
}
```

**Valid Payment Methods:** CASH, CARD, UPI, GIFT_CARD, BANK_TRANSFER

### 6. Cancel Invoice

**DELETE** `/api/invoice/:id`

---

## 📄 PDF GENERATION

### 1. Generate Invoice PDF (Direct)

**GET** `/api/invoice/:id/pdf`

**Response:** PDF file download with:

- Clear Eyes Optical branding
- Barcode with invoice ID
- Customer/Patient information
- Eye power table (for patients with prescriptions)
- Product details with pricing
- Tax breakdown and totals

**Example:**

```bash
curl -X GET "http://localhost:3000/api/invoice/cmf47cx1r0001uswopqybr7e4/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf
```

### 2. Generate PDF from Prescription ID

**GET** `/api/prescription/:id/pdf`

**Description:** Finds the invoice associated with the prescription and generates PDF

**Response:** Same PDF format as direct invoice PDF

**Example:**

```bash
curl -X GET "http://localhost:3000/api/prescription/1/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output prescription-invoice.pdf
```

**Error Response (404):**

```json
{
  "error": "No invoice found for this prescription ID. Please create an invoice that uses prescriptionId: 1 first."
}
```

---

## 🖨️ THERMAL PRINTING

### 1. Generate Thermal Receipt (Direct)

**GET** `/api/invoice/:id/thermal`

**Response:** Plain text formatted for thermal printers

### 2. Generate Thermal Print from Prescription ID

**GET** `/api/prescription/:id/thermal`

**Description:** Finds the invoice associated with the prescription and generates thermal print

**Response:** Same thermal format as direct invoice thermal

**Example:**

```bash
curl -X GET "http://localhost:3000/api/prescription/1/thermal" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```
            Tax Invoice
          Clear Eyes Optical
      68 Jessore Road, Diamond Plaza
        Kolkata +91-96765 43210
------------------------------------------------
Order #: cmf47cx1r0001uswopqybr7e4
Date: 9/4/2025
Total Qty: 3
------------------------------------------------
Bill To & Delivery Address:
John Doe
123 Main Street, City
+91-9876543210
------------------------------------------------
Prescription Details:
Eye   SPH     CYL     Axis    Add     PD      BC
------------------------------------------------
R     -1.25   -0.50   180     0.00    32      8.6
L     -1.50   -0.75   170     0.00    32      8.6
------------------------------------------------
Items
Name/Price                     Qty x Total
------------------------------------------------
Premium Frame Model XYZ (Acme Eyewear)
  @ 2500.00                         1 x 2250.00
  Discount:                               -250.00
  CGST:                                   202.50
  SGST:                                   202.50
------------------------------------------------
Subtotal:                               3770.00
Total Discount:                         -330.00
CGST:                                   332.10
SGST:                                   332.10
------------------------------------------------
Grand Total:                            4104.20
------------------------------------------------
      Thank You for Shopping with Us!
       Visit again. Follow us on Instagram
            @cleareyes_optical
------------------------------------------------
```

---

## 🧪 COMPLETE TESTING WORKFLOW

### Prescription to Invoice to PDF Generation

Follow these steps to test the complete workflow from prescription creation to PDF/thermal generation:

#### Step 1: Check if Prescription Exists

**GET** `/api/prescription/:id`

```bash
curl -X GET "http://localhost:3000/api/prescription/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**

```json
{
  "id": 1,
  "patientId": 2,
  "rightEye": {
    "sph": "-1.25",
    "cyl": "-0.50",
    "axis": "180",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.50",
    "cyl": "-0.75",
    "axis": "170",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "createdAt": "2025-09-04T06:42:39.407Z",
  "updatedAt": "2025-09-04T06:42:39.407Z"
}
```

#### Step 2: Check if Any Invoice Uses This Prescription

**GET** `/api/invoice?prescriptionId=1`

```bash
curl -X GET "http://localhost:3000/api/invoice?prescriptionId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**If No Invoice Exists (Response):**

```json
{
  "invoices": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

#### Step 3: Create Invoice with Prescription ID

**POST** `/api/invoice`

```bash
curl -X POST "http://localhost:3000/api/invoice" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 2,
    "prescriptionId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 1
      }
    ]
  }'
```

**Expected Response (201):**

```json
{
  "id": "cmf5ggtzx0001usysm8uujms3",
  "patientId": 2,
  "prescriptionId": 1,
  "staffId": 2,
  "subtotal": 150,
  "totalAmount": 150,
  "status": "UNPAID",
  "items": [
    {
      "id": 2,
      "productId": 1,
      "quantity": 1,
      "unitPrice": 150,
      "totalPrice": 150,
      "product": {
        "name": "Ray-Ban Aviator Classic"
      }
    }
  ],
  "patient": {
    "name": "tanmay joddar"
  }
}
```

#### Step 4: Generate PDF or Thermal Print

**Option A: Direct Invoice PDF/Thermal**

```bash
# PDF
curl -X GET "http://localhost:3000/api/invoice/cmf5ggtzx0001usysm8uujms3/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf

# Thermal
curl -X GET "http://localhost:3000/api/invoice/cmf5ggtzx0001usysm8uujms3/thermal" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option B: Prescription-Based PDF/Thermal**

```bash
# PDF
curl -X GET "http://localhost:3000/api/prescription/1/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output prescription.pdf

# Thermal
curl -X GET "http://localhost:3000/api/prescription/1/thermal" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Alternative: PowerShell Commands for Windows

```powershell
# Login first
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"staff@example.com","password":"password"}'
$token = $response.token

# Check prescription
Invoke-RestMethod -Uri "http://localhost:3000/api/prescription/1" -Method GET -Headers @{"Authorization"="Bearer $token"}

# Create invoice
Invoke-RestMethod -Uri "http://localhost:3000/api/invoice" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} -Body '{"patientId": 2, "prescriptionId": 1, "items": [{"productId": 1, "quantity": 1}]}'

# Generate PDF
Invoke-WebRequest -Uri "http://localhost:3000/api/prescription/1/pdf" -Method GET -Headers @{"Authorization"="Bearer $token"} -OutFile "prescription.pdf"

# Generate thermal
Invoke-RestMethod -Uri "http://localhost:3000/api/prescription/1/thermal" -Method GET -Headers @{"Authorization"="Bearer $token"}
```

---

## 🚨 ERROR RESPONSES

All endpoints return consistent error formats:

### 400 Bad Request

```json
{
  "error": "Missing required fields: name and address are required."
}
```

### 401 Unauthorized

```json
{
  "error": "Access denied. No token provided."
}
```

### 404 Not Found

```json
{
  "error": "Invoice not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create invoice."
}
```

---

## 🧪 POSTMAN TESTING EXAMPLES

### 1. Complete Patient Flow

```bash
# 1. Create Patient
POST http://localhost:3000/api/patient
{
  "name": "John Doe",
  "age": 35,
  "gender": "Male",
  "phone": "+91-9876543210"
}

# 2. Create Prescription
POST http://localhost:3000/api/prescription
{
  "patientId": 1,
  "rightEye": {"sph": "-1.25", "cyl": "-0.50", "axis": "180"},
  "leftEye": {"sph": "-1.50", "cyl": "-0.75", "axis": "170"}
}

# 3. Create Invoice
POST http://localhost:3000/api/invoice
{
  "patientId": 1,
  "prescriptionId": 1,
  "items": [{"productId": 1, "quantity": 1, "unitPrice": 2500}]
}

# 4. Add Payment
POST http://localhost:3000/api/invoice/INVOICE_ID/payment
{
  "amount": 2500,
  "paymentMethod": "CASH"
}

# 5. Generate PDF
GET http://localhost:3000/api/invoice/INVOICE_ID/pdf
```

### 2. Walk-in Customer Flow

```bash
# 1. Create Customer + Invoice
POST http://localhost:3000/api/customer/invoice
{
  "customer": {"name": "Jane Doe", "address": "123 Street"},
  "items": [{"productId": 1, "quantity": 1, "unitPrice": 150}],
  "staffId": 1,
  "paidAmount": 150,
  "paymentMethod": "cash"
}

# 2. Generate Receipt
GET http://localhost:3000/api/invoice/INVOICE_ID/thermal
```

### 3. Search & Filter Examples

```bash
# Search patients
GET http://localhost:3000/api/patient?search=john&page=1&limit=5

# Filter invoices by prescription
GET http://localhost:3000/api/invoice?prescriptionId=1

# Filter invoices by date range
GET http://localhost:3000/api/invoice?startDate=2025-09-01&endDate=2025-09-30

# Get customer hotspots
GET http://localhost:3000/api/customer/hotspots
```

---

## 📝 FIELD DEFINITIONS

### Eye Power Fields:

- **SPH** (Sphere): Corrects nearsightedness (-) or farsightedness (+)
- **CYL** (Cylinder): Corrects astigmatism
- **Axis**: Direction of astigmatism correction (0-180 degrees)
- **Add**: Additional magnification for reading glasses
- **PD** (Pupillary Distance): Distance between pupils in mm
- **BC** (Base Curve): Curvature of contact lens

### Invoice Statuses:

- **UNPAID**: No payments made
- **PARTIALLY_PAID**: Some payment made, balance remaining
- **PAID**: Full payment completed
- **CANCELLED**: Invoice cancelled before completion
- **REFUNDED**: Payment refunded after completion

---

## 🎯 SUMMARY

This API provides complete functionality for:

- ✅ Patient management with prescriptions
- ✅ Customer management for walk-ins
- ✅ Comprehensive invoice system
- ✅ PDF generation with barcode
- ✅ Thermal printing support
- ✅ Payment processing
- ✅ Search and filtering
- ✅ Proper authentication and validation

All endpoints are ready for production use with proper error handling and consistent response formats.
