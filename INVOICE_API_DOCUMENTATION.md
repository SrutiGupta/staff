# Invoice API Documentation - Postman Collection Guide

## 📋 Collection Overview

**Collection Name:** Invoice Management API  
**Base URL:** `{{baseUrl}}/api/invoice`  
**Environment Variables Required:**

- `baseUrl`: `http://localhost:8080`
- `authToken`: Your JWT authentication token

## 🔐 Authentication Setup

### Step 1: Get Authentication Token

Create a folder called "**Authentication**" in your Postman collection.

**Request Name:** `Get Auth Token`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/login`

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

**Test Script (Add to Tests tab):**

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("authToken", response.token);
  pm.test("Token saved to environment", function () {
    pm.expect(pm.environment.get("authToken")).to.not.be.undefined;
  });
}
```

### Step 2: Set Collection Authorization

1. Go to your collection settings
2. Select "Authorization" tab
3. Choose "Bearer Token"
4. Token: `{{authToken}}`

## 📁 Collection Structure

```
Invoice Management API/
├── 🔐 Authentication/
│   └── Get Auth Token
├── 📄 Invoice Operations/
│   ├── Get All Invoices
│   ├── Create New Invoice
│   ├── Get Single Invoice
│   ├── Update Invoice Status
│   ├── Add Payment
│   └── Delete Invoice
├── 📄 Invoice Documents/
│   ├── Generate Invoice PDF
│   └── Generate Thermal Receipt
└── 🧪 Test Scenarios/
    ├── Complete Invoice Workflow
    ├── Gift Card Payment Flow
    └── Cancel Invoice Flow
```

## 🌐 Environment Variables

Create a new environment with these variables:

| Variable    | Initial Value           | Current Value               |
| ----------- | ----------------------- | --------------------------- |
| `baseUrl`   | `http://localhost:8080` | `http://localhost:8080`     |
| `authToken` | (leave empty)           | (will be set automatically) |
| `invoiceId` | `1`                     | `1`                         |
| `patientId` | `1`                     | `1`                         |
| `productId` | `1`                     | `1`                         |

## 📊 Quick Reference Table

| Request Name             | Method | Endpoint                             | Purpose                  |
| ------------------------ | ------ | ------------------------------------ | ------------------------ |
| Get All Invoices         | GET    | `/api/invoice/`                      | List all invoices        |
| Create New Invoice       | POST   | `/api/invoice/`                      | Create new invoice       |
| Get Single Invoice       | GET    | `/api/invoice/{{invoiceId}}`         | Get specific invoice     |
| Update Invoice Status    | PATCH  | `/api/invoice/{{invoiceId}}/status`  | Change invoice status    |
| Add Payment              | POST   | `/api/invoice/{{invoiceId}}/payment` | Add payment to invoice   |
| Delete Invoice           | DELETE | `/api/invoice/{{invoiceId}}`         | Delete/cancel invoice    |
| Generate Invoice PDF     | GET    | `/api/invoice/{{invoiceId}}/pdf`     | Download PDF invoice     |
| Generate Thermal Receipt | GET    | `/api/invoice/{{invoiceId}}/thermal` | Get thermal print format |

---

## 📄 Invoice Operations

### 1️⃣ Get All Invoices

**Request Name:** `Get All Invoices`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/`

**Params (Query Parameters):**

| Key          | Value           | Description                            |
| ------------ | --------------- | -------------------------------------- |
| `page`       | `1`             | Page number (optional, default: 1)     |
| `limit`      | `10`            | Items per page (optional, default: 10) |
| `status`     | `UNPAID`        | Filter by status (optional)            |
| `patientId`  | `{{patientId}}` | Filter by patient ID (optional)        |
| `customerId` | `1`             | Filter by customer ID (optional)       |
| `staffId`    | `1`             | Filter by staff ID (optional)          |
| `startDate`  | `2024-01-01`    | Start date filter (optional)           |
| `endDate`    | `2024-12-31`    | End date filter (optional)             |

**Headers:**

```
Authorization: Bearer {{authToken}}
```

**Success Response (200):**

```json
{
  "invoices": [
    {
      "id": 1,
      "staffId": 1,
      "patientId": 1,
      "customerId": null,
      "prescriptionId": 1,
      "subtotal": 1000.0,
      "totalDiscount": 100.0,
      "totalIgst": 0.0,
      "totalCgst": 90.0,
      "totalSgst": 90.0,
      "totalAmount": 1080.0,
      "status": "UNPAID",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "patient": {
        "id": 1,
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "address": "123 Main St"
      },
      "staff": {
        "id": 1,
        "name": "Dr. Smith",
        "shopId": 1
      },
      "items": [
        {
          "id": 1,
          "productId": 1,
          "quantity": 2,
          "unitPrice": 500.0,
          "discount": 50.0,
          "cgst": 45.0,
          "sgst": 45.0,
          "totalPrice": 540.0,
          "product": {
            "id": 1,
            "name": "Designer Glasses",
            "basePrice": 500.0,
            "company": {
              "name": "Ray-Ban"
            }
          }
        }
      ],
      "transactions": []
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 23,
    "itemsPerPage": 5
  }
}
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has invoices array", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("invoices");
  pm.expect(jsonData.invoices).to.be.an("array");
});

pm.test("Response has pagination", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("pagination");
});
```

---

### 2️⃣ Create New Invoice

**Request Name:** `Create New Invoice`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

**Body (raw JSON):**

```json
{
  "patientId": {{patientId}},
  "prescriptionId": 1,
  "totalIgst": 0,
  "items": [
    {
      "productId": {{productId}},
      "quantity": 2,
      "discount": 50.0,
      "cgst": 45.0,
      "sgst": 45.0
    }
  ]
}
```

**Alternative Body for Customer Invoice:**

```json
{
  "customerId": 1,
  "items": [
    {
      "productId": {{productId}},
      "quantity": 1,
      "discount": 25.0,
      "cgst": 22.5,
      "sgst": 22.5
    }
  ]
}
```

**Success Response (201):**

```json
{
  "id": 1,
  "staffId": 1,
  "patientId": 1,
  "customerId": null,
  "prescriptionId": 1,
  "subtotal": 1000.0,
  "totalDiscount": 50.0,
  "totalIgst": 0.0,
  "totalCgst": 45.0,
  "totalSgst": 45.0,
  "totalAmount": 990.0,
  "status": "UNPAID",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 2,
      "unitPrice": 500.0,
      "discount": 50.0,
      "cgst": 45.0,
      "sgst": 45.0,
      "totalPrice": 990.0,
      "product": {
        "id": 1,
        "name": "Designer Glasses",
        "basePrice": 500.0
      }
    }
  ],
  "patient": {
    "id": 1,
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Invoice created successfully", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData).to.have.property("status", "UNPAID");

  // Save invoice ID for other requests
  pm.environment.set("invoiceId", jsonData.id);
});

pm.test("Invoice has items", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("items");
  pm.expect(jsonData.items).to.be.an("array");
  pm.expect(jsonData.items.length).to.be.greaterThan(0);
});
```

---

### 3️⃣ Get Single Invoice

**Request Name:** `Get Single Invoice`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/{{invoiceId}}`

**Headers:**

```
Authorization: Bearer {{authToken}}
```

**Path Variables:**
| Key | Value | Description |
|-------------|------------------|----------------|
| `invoiceId` | `{{invoiceId}}` | Invoice ID |

**Success Response (200):**

```json
{
  "id": 1,
  "staffId": 1,
  "patientId": 1,
  "customerId": null,
  "prescriptionId": 1,
  "subtotal": 1000.0,
  "totalDiscount": 100.0,
  "totalIgst": 0.0,
  "totalCgst": 90.0,
  "totalSgst": 90.0,
  "totalAmount": 1080.0,
  "status": "PARTIALLY_PAID",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "patient": {
    "id": 1,
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "address": "123 Main St"
  },
  "staff": {
    "id": 1,
    "name": "Dr. Smith"
  },
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 2,
      "unitPrice": 500.0,
      "discount": 50.0,
      "cgst": 45.0,
      "sgst": 45.0,
      "totalPrice": 540.0,
      "product": {
        "id": 1,
        "name": "Designer Glasses",
        "basePrice": 500.0,
        "company": {
          "name": "Ray-Ban"
        }
      }
    }
  ],
  "transactions": [
    {
      "id": 1,
      "amount": 500.0,
      "paymentMethod": "CASH",
      "giftCardId": null,
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "prescription": {
    "id": 1,
    "rightEye": {
      "sph": "-2.00",
      "cyl": "-1.00",
      "axis": "90"
    },
    "leftEye": {
      "sph": "-1.75",
      "cyl": "-0.50",
      "axis": "85"
    }
  }
}
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Invoice details are complete", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData).to.have.property("totalAmount");
  pm.expect(jsonData).to.have.property("status");
  pm.expect(jsonData).to.have.property("items");
  pm.expect(jsonData).to.have.property("transactions");
});
```

---

### 4️⃣ Update Invoice Status

**Request Name:** `Update Invoice Status`  
**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/invoice/{{invoiceId}}/status`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

**Path Variables:**
| Key | Value | Description |
|-------------|------------------|----------------|
| `invoiceId` | `{{invoiceId}}` | Invoice ID |

**Body (raw JSON):**

```json
{
  "status": "CANCELLED"
}
```

**Available Status Values:**

- `UNPAID`
- `PAID`
- `PARTIALLY_PAID`
- `CANCELLED`
- `REFUNDED`

**Success Response (200):**

```json
{
  "id": 1,
  "staffId": 1,
  "patientId": 1,
  "status": "CANCELLED",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Status updated successfully", function () {
  const jsonData = pm.response.json();
  const requestBody = JSON.parse(pm.request.body.raw);
  pm.expect(jsonData.status).to.equal(requestBody.status);
});
```

---

### 5️⃣ Add Payment

**Request Name:** `Add Payment`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/{{invoiceId}}/payment`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

**Path Variables:**
| Key | Value | Description |
|-------------|------------------|----------------|
| `invoiceId` | `{{invoiceId}}` | Invoice ID |

**Body (raw JSON) - Cash Payment:**

```json
{
  "amount": 500.0,
  "paymentMethod": "CASH"
}
```

**Body (raw JSON) - Gift Card Payment:**

```json
{
  "amount": 200.0,
  "paymentMethod": "GIFT_CARD",
  "giftCardId": 1
}
```

**Available Payment Methods:**

- `CASH`
- `CARD`
- `UPI`
- `GIFT_CARD` (requires giftCardId)
- `BANK_TRANSFER`

**Success Response (200):**

```json
{
  "invoice": {
    "id": 1,
    "status": "PARTIALLY_PAID",
    "totalAmount": 1080.0,
    "transactions": [
      {
        "id": 1,
        "amount": 500.0,
        "paymentMethod": "CASH",
        "giftCardId": null,
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  },
  "transaction": {
    "id": 1,
    "invoiceId": 1,
    "amount": 500.0,
    "paymentMethod": "CASH",
    "giftCardId": null,
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Payment added successfully", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("transaction");
  pm.expect(jsonData).to.have.property("invoice");

  const requestBody = JSON.parse(pm.request.body.raw);
  pm.expect(jsonData.transaction.amount).to.equal(requestBody.amount);
  pm.expect(jsonData.transaction.paymentMethod).to.equal(
    requestBody.paymentMethod
  );
});
```

---

### 6️⃣ Delete Invoice

**Request Name:** `Delete Invoice`  
**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/invoice/{{invoiceId}}`

**Headers:**

```
Authorization: Bearer {{authToken}}
```

**Path Variables:**
| Key | Value | Description |
|-------------|------------------|----------------|
| `invoiceId` | `{{invoiceId}}` | Invoice ID |

**Success Response (200):**

```json
{
  "message": "Invoice deleted successfully",
  "invoice": {
    "id": 1,
    "status": "CANCELLED"
  }
}
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Invoice deleted successfully", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("message");
  pm.expect(jsonData.invoice.status).to.equal("CANCELLED");
});
```

---

## 📄 Invoice Documents

### 7️⃣ Generate Invoice PDF

**Request Name:** `Generate Invoice PDF`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/{{invoiceId}}/pdf`

**Headers:**

```
Authorization: Bearer {{authToken}}
```

**Path Variables:**
| Key | Value | Description |
|-------------|------------------|----------------|
| `invoiceId` | `{{invoiceId}}` | Invoice ID |

**Response Type:** `application/pdf`

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response is PDF", function () {
  pm.expect(pm.response.headers.get("Content-Type")).to.include(
    "application/pdf"
  );
});
```

**Note:** To save the PDF file in Postman:

1. Click "Send and Download"
2. Save as `invoice-{{invoiceId}}.pdf`

---

### 8️⃣ Generate Thermal Receipt

**Request Name:** `Generate Thermal Receipt`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/{{invoiceId}}/thermal`

**Headers:**

```
Authorization: Bearer {{authToken}}
```

**Path Variables:**
| Key | Value | Description |
|-------------|------------------|----------------|
| `invoiceId` | `{{invoiceId}}` | Invoice ID |

**Response Type:** `text/plain`

**Example Response:**

```
                Tax Invoice
           Clear Eyes Optical
       68 Jessore Road, Diamond Plaza
         Kolkata +91-96765 43210
------------------------------------------------
Order #: 1                    Date: 1/15/2024
Total Qty: 2
------------------------------------------------
Bill To & Delivery Address:
John Doe
123 Main St
+1234567890
------------------------------------------------
Prescription Details:
Eye   SPH     CYL     Axis    Add     PD      BC
------------------------------------------------
R     -2.00   -1.00   90      -       -       -
L     -1.75   -0.50   85      -       -       -
------------------------------------------------
Items
Name/Price                   Qty x Total
------------------------------------------------
Designer Glasses (Ray-Ban)
  @ 500.00                      2 x 540.00
  Discount:                        -50.00
  CGST:                             45.00
  SGST:                             45.00
------------------------------------------------
Subtotal:                         1000.00
Total Discount:                   -100.00
CGST:                              90.00
SGST:                              90.00
------------------------------------------------
Grand Total:                      1080.00
------------------------------------------------
         Thank You for Shopping with Us!
        Visit again. Follow us on Instagram
              @cleareyes_optical
------------------------------------------------
```

**Test Script (Add to Tests tab):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response is plain text", function () {
  pm.expect(pm.response.headers.get("Content-Type")).to.include("text/plain");
});

pm.test("Receipt contains invoice details", function () {
  const responseText = pm.response.text();
  pm.expect(responseText).to.include("Tax Invoice");
  pm.expect(responseText).to.include("Grand Total:");
});
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Invoice Workflow

**Folder Name:** `Complete Invoice Workflow`

This scenario demonstrates the complete lifecycle of an invoice from creation to payment.

#### Step 1: Create New Invoice for Workflow

**Request Name:** `1. Create Invoice for Workflow`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/`

**Body:**

```json
{
  "patientId": {{patientId}},
  "prescriptionId": 1,
  "items": [
    {
      "productId": {{productId}},
      "quantity": 2,
      "discount": 50.0,
      "cgst": 45.0,
      "sgst": 45.0
    }
  ]
}
```

**Test Script:**

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
  const jsonData = pm.response.json();
  pm.environment.set("workflowInvoiceId", jsonData.id);
  pm.environment.set("invoiceTotalAmount", jsonData.totalAmount);
}
```

#### Step 2: Add Partial Payment

**Request Name:** `2. Add Partial Payment`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}/payment`

**Body:**

```json
{
  "amount": 500.0,
  "paymentMethod": "CASH"
}
```

#### Step 3: Check Invoice Status

**Request Name:** `3. Check Invoice Status`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}`

#### Step 4: Complete Payment

**Request Name:** `4. Complete Payment`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}/payment`

**Body:**

```json
{
  "amount": {{invoiceTotalAmount}},
  "paymentMethod": "CARD"
}
```

**Pre-request Script:**

```javascript
// Calculate remaining amount
const totalAmount = parseFloat(pm.environment.get("invoiceTotalAmount"));
const remainingAmount = totalAmount - 500; // Subtract previous payment
pm.environment.set("remainingAmount", remainingAmount);

// Update the request body
const requestBody = JSON.parse(pm.request.body.raw);
requestBody.amount = remainingAmount;
pm.request.body.raw = JSON.stringify(requestBody);
```

#### Step 5: Generate Invoice PDF

**Request Name:** `5. Generate Final Invoice PDF`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}/pdf`

---

### Scenario 2: Gift Card Payment Flow

**Folder Name:** `Gift Card Payment Flow`

#### Step 1: Create Invoice for Gift Card

**Request Name:** `1. Create Invoice for Gift Card Payment`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/`

**Body:**

```json
{
  "customerId": 1,
  "items": [
    {
      "productId": {{productId}},
      "quantity": 1,
      "discount": 25.0,
      "cgst": 22.5,
      "sgst": 22.5
    }
  ]
}
```

#### Step 2: Pay with Gift Card

**Request Name:** `2. Pay with Gift Card`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}/payment`

**Body:**

```json
{
  "amount": 200.0,
  "paymentMethod": "GIFT_CARD",
  "giftCardId": 1
}
```

#### Step 3: Pay Remaining with Cash

**Request Name:** `3. Pay Remaining with Cash`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}/payment`

**Body:**

```json
{
  "amount": 300.0,
  "paymentMethod": "CASH"
}
```

---

### Scenario 3: Cancel Invoice Flow

**Folder Name:** `Cancel Invoice Flow`

#### Step 1: Create Invoice to Cancel

**Request Name:** `1. Create Invoice to Cancel`  
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/invoice/`

**Body:**

```json
{
  "patientId": {{patientId}},
  "items": [
    {
      "productId": {{productId}},
      "quantity": 1,
      "discount": 0,
      "cgst": 45.0,
      "sgst": 45.0
    }
  ]
}
```

#### Step 2: Cancel Invoice

**Request Name:** `2. Cancel Invoice (Restores Inventory)`  
**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}/status`

**Body:**

```json
{
  "status": "CANCELLED"
}
```

#### Step 3: Verify Cancellation

**Request Name:** `3. Verify Invoice is Cancelled`  
**Method:** `GET`  
**URL:** `{{baseUrl}}/api/invoice/{{workflowInvoiceId}}`

**Test Script:**

```javascript
pm.test("Invoice is cancelled", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.status).to.equal("CANCELLED");
});
```

---

## 🚨 Error Responses Reference

### Common Error Status Codes

| Status Code | Error Type            | Description                              |
| ----------- | --------------------- | ---------------------------------------- |
| `400`       | Bad Request           | Invalid request data or validation error |
| `401`       | Unauthorized          | Missing or invalid authentication token  |
| `403`       | Forbidden             | Access denied (wrong shop/permissions)   |
| `404`       | Not Found             | Invoice not found                        |
| `409`       | Conflict              | Business logic conflict                  |
| `500`       | Internal Server Error | Unexpected server error                  |

### Error Response Format

All error responses follow this consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Examples

**400 Bad Request:**

```json
{
  "error": "Patient ID or Customer ID is required"
}
```

**401 Unauthorized:**

```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**

```json
{
  "error": "Access denied. Invoice belongs to different shop."
}
```

**404 Not Found:**

```json
{
  "error": "Invoice not found."
}
```

**409 Conflict:**

```json
{
  "error": "Invoice must be UNPAID to be deleted"
}
```

---

## 📝 Notes and Best Practices

### 🔧 **Postman Collection Setup Tips**

1. **Import Collection:** Copy each request into Postman as separate requests
2. **Environment Setup:** Create environment with all variables listed above
3. **Test Scripts:** Add the provided test scripts to verify responses
4. **Folder Organization:** Organize requests into folders as shown in structure
5. **Authentication:** Set up collection-level authorization to avoid repeating tokens

### 💡 **API Usage Guidelines**

1. **Authentication:** All endpoints require valid JWT token
2. **Shop Isolation:** Users can only access invoices from their own shop
3. **Automatic Calculations:** Subtotals, taxes, and totals are calculated automatically
4. **Inventory Management:** Creating invoices decrements inventory; cancelling/refunding restores it
5. **Payment Tracking:** Payments are tracked separately and used to calculate paid amounts
6. **Status Updates:** Invoice status updates automatically based on payment amounts
7. **Gift Card Support:** Gift card payments automatically deduct from gift card balance

### ⚙️ **Environment Variables**

Set these in your Postman environment:

- `THERMAL_PRINTER_WIDTH`: Width of thermal printer (default: 48 characters)

### 🎯 **Testing Strategy**

1. **Start with Authentication:** Always get a fresh token first
2. **Test Individual Endpoints:** Verify each endpoint works independently
3. **Run Complete Workflows:** Test realistic user scenarios
4. **Error Testing:** Intentionally trigger errors to test error handling
5. **Boundary Testing:** Test edge cases like zero amounts, missing fields
