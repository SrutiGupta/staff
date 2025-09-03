# Invoice System API Documentation

## Overview

The Invoice System has been completely rewritten to support both customers and patients with comprehensive validation, standardized response formats, and proper authentication for all endpoints.

## Authentication

All endpoints require Bearer Token authentication except where noted.

## Standard Response Format

All endpoints follow a consistent response format:

### Success Response:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    /* actual data */
  }
}
```

### Error Response:

```json
{
  "success": false,
  "error": "Error description",
  "data": null
}
```

## API Endpoints

### 1. Create Invoice

**POST** `/api/invoice`

**Authentication:** Required

**Request Body:**

```json
{
  "patientId": 1, // Optional: For patient invoices
  "customerId": 2, // Optional: For customer invoices
  "prescriptionId": 3, // Optional: Link to prescription
  "totalIgst": 18.0, // Optional: Total IGST amount
  "items": [
    {
      "productId": 5,
      "quantity": 2,
      "discount": 10.0, // Optional: Item discount
      "cgst": 9.0, // Optional: CGST amount
      "sgst": 9.0 // Optional: SGST amount
    }
  ]
}
```

**Validation Rules:**

- Either `patientId` OR `customerId` required (not both)
- `items` array must contain at least one item
- Each item must have valid `productId` and `quantity > 0`

**Success Response (201):**

```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": "clz8h3f0d0001p7bkhs8g4f8c",
    "patientId": 1,
    "customerId": null,
    "staffId": 1,
    "subtotal": 300.00,
    "totalDiscount": 20.00,
    "totalIgst": 18.00,
    "totalCgst": 18.00,
    "totalSgst": 18.00,
    "totalAmount": 334.00,
    "paidAmount": 0,
    "status": "UNPAID",
    "items": [...],
    "patient": {...},
    "customer": null,
    "staff": {...}
  }
}
```

### 2. Get All Invoices

**GET** `/api/invoice`

**Authentication:** Required

**Query Parameters:**

```
?page=1&limit=10&status=PAID&patientId=1&customerId=2&staffId=1&startDate=2025-01-01&endDate=2025-12-31
```

**Parameters:**

- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, min: 1, max: 100)
- `status`: Filter by status (UNPAID, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED)
- `patientId`: Filter by patient ID
- `customerId`: Filter by customer ID
- `staffId`: Filter by staff ID
- `startDate`: Filter by creation date (YYYY-MM-DD)
- `endDate`: Filter by creation date (YYYY-MM-DD)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": {
    "invoices": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Get Single Invoice

**GET** `/api/invoice/:id`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "id": "clz8h3f0d0001p7bkhs8g4f8c",
    "patient": {...},
    "customer": {...},
    "staff": {...},
    "items": [...],
    "transactions": [...],
    "prescription": {...}
  }
}
```

### 4. Update Invoice Status

**PATCH** `/api/invoice/:id/status`

**Authentication:** Required

**Request Body:**

```json
{
  "status": "PAID"
}
```

**Valid Statuses:**

- UNPAID
- PAID
- PARTIALLY_PAID
- CANCELLED
- REFUNDED

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invoice status updated successfully",
  "data": {
    /* updated invoice object */
  }
}
```

### 5. Add Payment

**POST** `/api/invoice/:id/payment`

**Authentication:** Required

**Request Body:**

```json
{
  "amount": 150.0,
  "paymentMethod": "CASH",
  "giftCardId": 5 // Optional: For gift card payments
}
```

**Valid Payment Methods:**

- CASH
- CARD
- UPI
- GIFT_CARD
- BANK_TRANSFER

**Success Response (201):**

```json
{
  "success": true,
  "message": "Payment added successfully",
  "data": {
    "invoice": {
      /* updated invoice */
    },
    "transaction": {
      /* new transaction */
    }
  }
}
```

### 6. Cancel Invoice

**DELETE** `/api/invoice/:id`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invoice cancelled successfully",
  "data": {
    /* cancelled invoice object */
  }
}
```

**Note:** Invoices with existing payments cannot be deleted and must be cancelled instead.

### 7. Generate PDF

**GET** `/api/invoice/:id/pdf`

**Authentication:** Required

**Response:** PDF file download

### 8. Generate Thermal Print

**GET** `/api/invoice/:id/thermal`

**Authentication:** Required

**Response:** Plain text formatted for thermal printers

## Error Codes

- **400 Bad Request:** Invalid request parameters or body
- **401 Unauthorized:** Missing or invalid authentication token
- **404 Not Found:** Invoice, product, or related entity not found
- **500 Internal Server Error:** Server processing error

## Features

### Dual Client Support

- Supports both patient and customer invoices
- Prescription data only available for patient invoices
- Proper validation ensures only one client type per invoice

### Tax Handling

- Item-level CGST and SGST
- Invoice-level IGST
- Automatic tax calculation and totals

### Payment Processing

- Multiple payment methods
- Gift card integration with balance deduction
- Automatic status updates based on payment amount
- Payment history tracking

### Inventory Management

- Automatic stock validation before invoice creation
- Stock deduction upon invoice creation
- Prevents overselling

### Thermal Printing

- Configurable printer width via environment variables
- Proper formatting for thermal printers
- Shows prescription details for patient invoices
- Company information when available

### Security

- All endpoints require authentication
- Proper input validation
- SQL injection protection via Prisma ORM
- Error message sanitization

## Environment Variables

```env
THERMAL_PRINTER_WIDTH=48          # Width for thermal printer formatting
THERMAL_PRINTER_IP=192.168.1.100  # IP address of thermal printer
THERMAL_PRINTER_PORT=9100          # Port for thermal printer
```

## Usage Examples

### Create Patient Invoice

```bash
curl -X POST http://localhost:3000/api/invoice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "prescriptionId": 2,
    "items": [
      {
        "productId": 5,
        "quantity": 1,
        "cgst": 9.00,
        "sgst": 9.00
      }
    ]
  }'
```

### Create Customer Invoice

```bash
curl -X POST http://localhost:3000/api/invoice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 3,
    "items": [
      {
        "productId": 8,
        "quantity": 2,
        "discount": 20.00
      }
    ]
  }'
```

### Add Payment

```bash
curl -X POST http://localhost:3000/api/invoice/INVOICE_ID/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "paymentMethod": "CASH"
  }'
```

### Filter Invoices

```bash
curl "http://localhost:3000/api/invoice?status=PAID&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This documentation covers the complete invoice system with proper validation, authentication, and standardized responses.
