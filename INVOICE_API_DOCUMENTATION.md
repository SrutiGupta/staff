# Invoice API Documentation

## Base URL

```
http://localhost:8080/api/invoice
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get All Invoices

**GET** `/`

Retrieves all invoices for the authenticated user's shop with optional filtering and pagination.

**Query Parameters:**

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by invoice status: UNPAID, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED
- `patientId` (optional) - Filter by patient ID
- `customerId` (optional) - Filter by customer ID
- `staffId` (optional) - Filter by staff ID
- `prescriptionId` (optional) - Filter by prescription ID
- `startDate` (optional) - Filter invoices created after this date (YYYY-MM-DD)
- `endDate` (optional) - Filter invoices created before this date (YYYY-MM-DD)

**Example Request:**

```
GET /api/invoice?page=1&limit=5&status=UNPAID&startDate=2024-01-01
```

**Response:**

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

---

### 2. Create Invoice

**POST** `/`

Creates a new invoice for a patient or customer.

**Request Body:**

```json
{
  "patientId": 1, // Either patientId OR customerId (not both)
  "customerId": null, // Either patientId OR customerId (not both)
  "prescriptionId": 1, // Optional
  "totalIgst": 0, // Optional, defaults to 0
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "discount": 50.0, // Optional
      "cgst": 45.0, // Optional
      "sgst": 45.0 // Optional
    }
  ]
}
```

**Response:**

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

---

### 3. Get Single Invoice

**GET** `/:id`

Retrieves a specific invoice by ID.

**Path Parameters:**

- `id` - Invoice ID (integer)

**Example Request:**

```
GET /api/invoice/1
```

**Response:**

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

---

### 4. Update Invoice Status

**PATCH** `/:id/status`

Updates the status of an invoice. If status is CANCELLED or REFUNDED, inventory will be automatically restored.

**Path Parameters:**

- `id` - Invoice ID (integer)

**Request Body:**

```json
{
  "status": "CANCELLED" // UNPAID, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED
}
```

**Response:**

```json
{
  "id": 1,
  "staffId": 1,
  "patientId": 1,
  "status": "CANCELLED",
  "updatedAt": "2024-01-15T12:00:00.000Z"
  // ... other invoice fields
}
```

---

### 5. Add Payment

**POST** `/:id/payment`

Adds a payment to an invoice. Automatically updates invoice status based on payment amount.

**Path Parameters:**

- `id` - Invoice ID (integer)

**Request Body:**

```json
{
  "amount": 500.0,
  "paymentMethod": "CASH", // CASH, CARD, UPI, GIFT_CARD, BANK_TRANSFER
  "giftCardId": 1 // Required only if paymentMethod is GIFT_CARD
}
```

**Response:**

```json
{
  "invoice": {
    "id": 1,
    "status": "PARTIALLY_PAID", // Auto-updated based on total payments
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
    // ... other invoice fields
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

---

### 6. Delete Invoice

**DELETE** `/:id`

Soft deletes an invoice by setting status to CANCELLED. Only UNPAID invoices can be deleted.

**Path Parameters:**

- `id` - Invoice ID (integer)

**Response:**

```json
{
  "message": "Invoice deleted successfully",
  "invoice": {
    "id": 1,
    "status": "CANCELLED"
    // ... other invoice fields
  }
}
```

---

### 7. Generate Invoice PDF

**GET** `/:id/pdf`

Generates and returns a PDF invoice.

**Path Parameters:**

- `id` - Invoice ID (integer)

**Response:**

- Content-Type: `application/pdf`
- Returns PDF file stream

**Example Request:**

```
GET /api/invoice/1/pdf
```

---

### 8. Generate Thermal Receipt

**GET** `/:id/thermal`

Generates a plain text receipt optimized for thermal printing.

**Path Parameters:**

- `id` - Invoice ID (integer)

**Response:**

- Content-Type: `text/plain`
- Returns formatted plain text receipt

**Example Request:**

```
GET /api/invoice/1/thermal
```

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

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied. Invoice belongs to different shop."
}
```

### 404 Not Found

```json
{
  "error": "Invoice not found."
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to process request."
}
```

## Notes

1. **Authentication**: All endpoints require valid JWT token in Authorization header
2. **Shop Isolation**: Users can only access invoices from their own shop
3. **Automatic Calculations**: Subtotals, taxes, and totals are calculated automatically
4. **Inventory Management**: Creating invoices decrements inventory; cancelling/refunding restores it
5. **Payment Tracking**: Payments are tracked separately and used to calculate paid amounts
6. **Status Updates**: Invoice status updates automatically based on payment amounts
7. **Gift Card Support**: Gift card payments automatically deduct from gift card balance
8. **Thermal Printing**: Product names are automatically truncated to fit printer width

## Environment Variables

- `THERMAL_PRINTER_WIDTH`: Width of thermal printer (default: 48 characters)
