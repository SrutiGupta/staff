# Staff Portal - Complete API Documentation

## 🎯 Overview

This comprehensive guide covers all **21 endpoints** in the Staff Portal, organized by functionality with complete request/response examples for Postman testing.

**Base URL:** `http://localhost:8080/api`

---

## 🔐 AUTHENTICATION & JWT TOKEN

### JWT Token Usage

All protected routes require JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting JWT Token

Use the login endpoint to get your JWT token:

```javascript
POST / api / auth / login;
```

---

## 📋 TABLE OF CONTENTs

## 👥 PATIENT MANAGEMENT

### 4. Create Patient

**POST** `/api/patient`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "John Patient",
  "age": 35,
  "gender": "MALE",
  "phone": "+1234567890",
  "address": "123 Patient Street",
  "medicalHistory": "No known allergies"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "John Patient",
  "age": 35,
  "gender": "MALE",
  "phone": "+1234567890",
  "address": "123 Patient Street",
  "medicalHistory": "No known allergies",
  "isActive": true,
  "shopId": 1,
  "royalty": null,
  "giftCards": [
    {
      "id": 1,
      "patientId": 1,
      "code": "GC-ABC123XYZ",
      "balance": 250.0,
      "status": "ACTIVE",
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

### 5. Get All Patients

**GET** `/api/patient`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or phone

**Response (200):**

```json
{
  "patients": [
    {
      "id": 1,
      "name": "John Patient",
      "age": 35,
      "gender": "MALE",
      "phone": "+1234567890",
      "address": "123 Patient Street",
      "medicalHistory": "No known allergies",
      "shopId": 1,
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 6. Get Patient by ID

**GET** `/api/patient/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "name": "John Patient",
  "age": 35,
  "gender": "MALE",
  "phone": "+1234567890",
  "address": "123 Patient Street",
  "medicalHistory": "No known allergies",
  "isActive": true,
  "shopId": 1,
  "prescriptions": [
    {
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
      },
      "createdAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "invoices": [
    {
      "id": 1,
      "patientId": 1,
      "totalAmount": 566.4,
      "status": "PAID",
      "items": [
        {
          "id": 1,
          "quantity": 1,
          "unitPrice": 566.4,
          "product": {
            "name": "Ray-Ban Aviator Classic"
          }
        }
      ]
    }
  ],
  "royalty": null,
  "giftCards": [
    {
      "id": 1,
      "patientId": 1,
      "code": "GC-ABC123XYZ",
      "balance": 250.0,
      "status": "ACTIVE",
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

---

## 💳 PAYMENT PROCESSING

### 7. Process Payment

**POST** `/api/payment`

**Request Body:**

```json
{
  "invoiceId": 1,
  "amount": 566.4,
  "paymentMethod": "CARD"
}
```

**OR for Gift Card Payment:**

```json
{
  "invoiceId": 1,
  "amount": 100.0,
  "paymentMethod": "GIFT_CARD",
  "giftCardCode": "GC123456789"
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "patientId": 1,
  "customerId": null,
  "prescriptionId": null,
  "staffId": 1,
  "totalAmount": 566.4,
  "paidAmount": 566.4,
  "status": "PAID",
  "subtotal": 566.4,
  "totalDiscount": 0.0,
  "totalCgst": 0.0,
  "totalSgst": 0.0,
  "totalIgst": 0.0,
  "notes": null,
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:30:00.000Z",
  "transactions": [
    {
      "id": 1,
      "invoiceId": 1,
      "amount": 566.4,
      "paymentMethod": "CARD",
      "giftCardId": null,
      "createdAt": "2025-10-08T10:30:00.000Z",
      "updatedAt": "2025-10-08T10:30:00.000Z"
    }
  ]
}
```

**Validation Errors (400):**

```json
{
  "error": "Invoice ID, amount, and payment method are required."
}
```

```json
{
  "error": "Payment amount cannot exceed the amount due of $100.00."
}
```

```json
{
  "error": "Gift card code is required for gift card payments."
}
```

```json
{
  "error": "Insufficient gift card balance. Current balance is $50.00."
}
```

**Not Found Errors (404):**

```json
{
  "error": "Invoice not found."
}
```

```json
{
  "error": "Gift card not found."
}
```

---

## 📋 PRESCRIPTION MANAGEMENT

### 8. Create Prescription

**POST** `/api/prescription`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "patientId": 1,
  "rightEye": {
    "sph": "-2.00",
    "cyl": "-0.50",
    "axis": "90",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.75",
    "cyl": "-0.25",
    "axis": "85",
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
    "sph": "-2.00",
    "cyl": "-0.50",
    "axis": "90",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.75",
    "cyl": "-0.25",
    "axis": "85",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

**Validation Errors (400):**

```json
{
  "error": "Patient ID is required."
}
```

```json
{
  "error": "Right eye data must be an object."
}
```

```json
{
  "error": "Left eye data must be an object."
}
```

### 9. Get All Prescriptions

**GET** `/api/prescription`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `patientId` (optional): Filter by patient ID
- `valid` (optional): Filter by validity (true/false)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**

```json
{
  "prescriptions": [
    {
      "id": 1,
      "patientId": 1,
      "patient": {
        "id": 1,
        "name": "John Patient",
        "phone": "+1234567890"
      },
      "rightEye": {
        "sph": "-2.00",
        "cyl": "-0.50",
        "axis": "90"
      },
      "leftEye": {
        "sph": "-1.75",
        "cyl": "-0.25",
        "axis": "85"
      },
      "createdAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 10. Get Prescription by ID

**GET** `/api/prescription/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "patientId": 1,
  "patient": {
    "id": 1,
    "name": "John Patient",
    "phone": "+1234567890",
    "email": "patient@example.com"
  },
  "rightEye": {
    "sph": "-2.00",
    "cyl": "-0.50",
    "axis": "90",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "leftEye": {
    "sph": "-1.75",
    "cyl": "-0.25",
    "axis": "85",
    "add": "0.00",
    "pd": "32",
    "bc": "8.6"
  },
  "notes": "First prescription for patient",
  "prescribedBy": "Dr. Smith",
  "validUntil": "2026-10-08T00:00:00.000Z",
  "isValid": true,
  "invoices": [
    {
      "id": 1,
      "patientId": 1,
      "prescriptionId": 1,
      "totalAmount": 566.4,
      "status": "PAID",
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

### 11. Generate Prescription PDF

**GET** `/api/prescription/:id/pdf`

**Headers:** `Authorization: Bearer <token>`

**Response (200):** PDF file download

**Response Headers:**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="prescription-1.pdf"
```

### 12. Generate Prescription Thermal Print

**GET** `/api/prescription/:id/thermal`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "thermalContent": "===========================\n        PRESCRIPTION\n===========================\nPatient: John Patient\nPhone: +1234567890\nDate: 2025-10-08\n\nRIGHT EYE:\nSPH: -2.00  CYL: -0.50\nAXIS: 90    ADD: 0.00\nPD: 32      BC: 8.6\n\nLEFT EYE:\nSPH: -1.75  CYL: -0.25\nAXIS: 85    ADD: 0.00\nPD: 32      BC: 8.6\n\nPrescribed by: Dr. Smith\nValid until: 2026-10-08\n==========================="
}
```

---

## �️ PRODUCT MANAGEMENT

### 13. Get All Products

**GET** `/api/inventory/products`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses",
      "basePrice": 200.0,
      "barcode": "1234567890123",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Gold",
      "size": "Medium",
      "model": "RB3025",
      "company": {
        "id": 1,
        "name": "Ray-Ban",
        "description": "Ray-Ban Eyewear Brand"
      },
      "inventory": {
        "quantity": 15,
        "sellingPrice": 250.0,
        "lastRestockedAt": "2025-10-01T10:00:00.000Z",
        "lastUpdated": "2025-10-08T10:00:00.000Z",
        "stockStatus": {
          "currentStock": 15,
          "stockLevel": "ADEQUATE",
          "statusMessage": "Stock available"
        }
      },
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "grouped": {
    "Ray-Ban": {
      "SUNGLASSES": [
        {
          "id": 1,
          "sku": "RB-AV-001",
          "name": "Ray-Ban Aviator Classic",
          "description": "Classic aviator sunglasses",
          "basePrice": 200.0,
          "barcode": "1234567890123",
          "eyewearType": "SUNGLASSES",
          "frameType": "FULL_RIM",
          "material": "Metal",
          "color": "Gold",
          "size": "Medium",
          "model": "RB3025",
          "company": {
            "id": 1,
            "name": "Ray-Ban",
            "description": "Ray-Ban Eyewear Brand"
          },
          "inventory": {
            "quantity": 15,
            "sellingPrice": 250.0,
            "lastRestockedAt": "2025-10-01T10:00:00.000Z",
            "lastUpdated": "2025-10-08T10:00:00.000Z",
            "stockStatus": {
              "currentStock": 15,
              "stockLevel": "ADEQUATE",
              "statusMessage": "Stock available"
            }
          },
          "createdAt": "2025-10-08T10:00:00.000Z",
          "updatedAt": "2025-10-08T10:00:00.000Z"
        }
      ]
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalProducts": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "summary": {
    "totalProducts": 1,
    "companiesCount": 1,
    "byEyewearType": {
      "SUNGLASSES": 1
    }
  }
}
```

### 14. Add New Product

**POST** `/api/inventory/product`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Oakley Holbrook",
  "description": "Lifestyle sunglasses with Prizm lens technology",
  "basePrice": 180.0,
  "barcode": "9876543210987",
  "sku": "OAK-HB-001",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "companyId": 2,
  "material": "Plastic",
  "color": "Matte Black",
  "size": "Large",
  "model": "OO9102"
}
```

**Response (201):**

```json
{
  "id": 2,
  "name": "Oakley Holbrook",
  "description": "Lifestyle sunglasses with Prizm lens technology",
  "basePrice": 180.0,
  "barcode": "9876543210987",
  "sku": "OAK-HB-001",
  "eyewearType": "SUNGLASSES",
  "frameType": "FULL_RIM",
  "material": "Plastic",
  "color": "Matte Black",
  "size": "Large",
  "model": "OO9102",
  "companyId": 2,
  "company": {
    "id": 2,
    "name": "Oakley",
    "email": "info@oakley.com"
  },
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

**Validation Errors (400):**

```json
{
  "error": "Missing required fields: name, basePrice, eyewearType, and companyId are required."
}
```

```json
{
  "error": "Invalid eyewearType. Must be GLASSES, SUNGLASSES, or LENSES."
}
```

```json
{
  "error": "FrameType is required for glasses and sunglasses."
}
```

**Conflict Errors (409):**

```json
{
  "error": "Barcode already exists."
}
```

```json
{
  "error": "SKU already exists."
}
```

---

## �📦 STOCK RECEIPT MANAGEMENT

### 14. Create Stock Receipt

**POST** `/api/stock-receipts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "productId": 1,
  "receivedQuantity": 50,
  "supplierName": "Vision Supplies Co.",
  "deliveryNote": "Monthly stock delivery",
  "batchNumber": "BATCH-202510",
  "expiryDate": "2027-10-08"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Stock receipt created successfully. Waiting for shop admin approval.",
  "receipt": {
    "id": 1,
    "shopId": 1,
    "productId": 1,
    "receivedQuantity": 50,
    "receivedByStaffId": 1,
    "supplierName": "Vision Supplies Co.",
    "deliveryNote": "Monthly stock delivery",
    "batchNumber": "BATCH-202510",
    "expiryDate": "2027-10-08T00:00:00.000Z",
    "status": "PENDING",
    "product": {
      "id": 1,
      "name": "Ray-Ban Aviator Classic",
      "sku": "RB-AV-001",
      "company": {
        "id": 1,
        "name": "Ray-Ban"
      }
    },
    "createdAt": "2025-10-08T10:00:00.000Z",
    "updatedAt": "2025-10-08T10:00:00.000Z"
  }
}
```

**Validation Errors (400):**

```json
{
  "error": "Missing required fields: productId, receivedQuantity"
}
```

**Not Found Errors (404):**

```json
{
  "error": "Product not found"
}
```

### 15. Get All Stock Receipts

**GET** `/api/stock-receipts`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED, COMPLETED)

**Response (200):**

```json
{
  "receipts": [
    {
      "id": 1,
      "shopId": 1,
      "productId": 1,
      "receivedQuantity": 50,
      "receivedByStaffId": 1,
      "supplierName": "Vision Supplies Co.",
      "deliveryNote": "Monthly stock delivery",
      "batchNumber": "BATCH-202510",
      "expiryDate": "2027-10-08T00:00:00.000Z",
      "status": "PENDING",
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator Classic",
        "sku": "RB-AV-001",
        "company": {
          "id": 1,
          "name": "Ray-Ban"
        }
      },
      "receivedByStaff": {
        "name": "John Staff"
      },
      "verifiedByAdmin": null,
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T10:00:00.000Z"
    }
  ],
  "summary": {
    "total": 5,
    "pending": 2,
    "approved": 2,
    "rejected": 0,
    "completed": 1
  }
}
```

### 16. Get Stock Receipt by ID

**GET** `/api/stock-receipts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 1,
  "receivedQuantity": 50,
  "receivedByStaffId": 1,
  "supplierName": "Vision Supplies Co.",
  "deliveryNote": "Monthly stock delivery",
  "batchNumber": "BATCH-202510",
  "expiryDate": "2027-10-08T00:00:00.000Z",
  "status": "PENDING",
  "product": {
    "id": 1,
    "name": "Ray-Ban Aviator Classic",
    "sku": "RB-AV-001",
    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "email": "info@rayban.com"
    }
  },
  "receivedByStaff": {
    "name": "John Staff"
  },
  "verifiedByAdmin": null,
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

---

## 📊 REPORTING & ANALYTICS

### 14. Daily Report

**GET** `/api/reporting/daily`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `date` (required): Specific date (YYYY-MM-DD)

**Response (200):**

```json
{
  "attendance": [
    {
      "id": 1,
      "loginTime": "2025-10-08T09:00:00.000Z",
      "logoutTime": "2025-10-08T17:00:00.000Z",
      "staff": {
        "id": 1,
        "name": "John Staff",
        "email": "john@example.com",
        "role": "STAFF"
      }
    }
  ],
  "inventory": [
    {
      "id": 1,
      "shopId": 1,
      "productId": 1,
      "quantity": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator Classic",
        "sku": "RB-AV-001",
        "basePrice": 200.0
      }
    }
  ]
}
```

### 15. Monthly Report

**GET** `/api/reporting/monthly`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `year` (required): Year (YYYY)
- `month` (required): Month (1-12)

**Response (200):**

```json
{
  "attendance": [
    {
      "id": 1,
      "loginTime": "2025-10-01T09:00:00.000Z",
      "logoutTime": "2025-10-01T17:00:00.000Z",
      "staff": {
        "id": 1,
        "name": "John Staff",
        "email": "john@example.com",
        "role": "STAFF"
      }
    }
  ],
  "inventory": [
    {
      "id": 1,
      "shopId": 1,
      "productId": 1,
      "quantity": 45,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator Classic",
        "sku": "RB-AV-001",
        "basePrice": 200.0
      }
    }
  ]
}
```

### 16. Staff Sales Report

**GET** `/api/reporting/staff-sales`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**

```json
[
  {
    "staff": {
      "id": 1,
      "name": "John Staff",
      "email": "john@example.com",
      "role": "STAFF"
    },
    "totalSales": 15000.0,
    "invoiceCount": 45
  },
  {
    "staff": {
      "id": 2,
      "name": "Jane Staff",
      "email": "jane@example.com",
      "role": "STAFF"
    },
    "totalSales": 12000.0,
    "invoiceCount": 38
  }
]
```

### 17. Sales by Price Tier

**GET** `/api/reporting/sales-by-price-tier`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**

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
      "count": 120
    },
    "medium": {
      "count": 85
    },
    "high": {
      "count": 45
    }
  }
}
```

### 18. Best Sellers by Price Tier

**GET** `/api/reporting/best-sellers-by-price-tier`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `limit` (optional): Number of products per tier (default: 5)

**Response (200):**

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
        "productName": "Basic Reading Glasses",
        "totalQuantity": 60,
        "unitPrice": 45.0
      }
    ],
    "medium": [
      {
        "productName": "Ray-Ban Aviator Classic",
        "totalQuantity": 35,
        "unitPrice": 200.0
      }
    ],
    "high": [
      {
        "productName": "Premium Designer Frames",
        "totalQuantity": 12,
        "unitPrice": 750.0
      }
    ]
  }
}
```

---

## 👑 LOYALTY POINTS MANAGEMENT

### 19. Add Loyalty Points

**POST** `/api/royalty`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "patientId": 1
}
```

**Response (200):**

```json
{
  "id": 1,
  "patientId": 1,
  "points": 10,
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:00:00.000Z"
}
```

**Error Responses:**

```json
{
  "error": "Patient not found"
}
```

```json
{
  "error": "Access denied. Patient belongs to different shop."
}
```

### 20. Get Loyalty Points

**GET** `/api/royalty/:patientId`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "patientId": 1,
  "points": 50,
  "createdAt": "2025-10-08T10:00:00.000Z",
  "updatedAt": "2025-10-08T10:15:00.000Z"
}
```

**Error Responses:**

```json
{
  "error": "Patient not found"
}
```

```json
{
  "error": "Access denied. Patient belongs to different shop."
}
```

```json
{
  "error": "Patient not found in royalty program"
}
```

---
