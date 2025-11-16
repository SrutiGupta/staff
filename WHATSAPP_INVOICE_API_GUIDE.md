# WhatsApp Invoice Distribution API Guide

## Overview

This feature allows you to send invoices directly to customers/patients via WhatsApp after invoice creation. It's production-ready with proper error handling, validation, and audit logging.

## Features

✅ Send invoice via WhatsApp text message
✅ Phone number validation (Indian format)
✅ Automatic phone number formatting
✅ Payment reminder messages
✅ Comprehensive error handling
✅ Audit logging for compliance
✅ Shop-based access control

---

## Setup Instructions

### Step 1: Get WhatsApp Business Account Credentials

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Create a WhatsApp Business Account (or use existing)
3. Navigate to **WhatsApp Manager** > **Getting Started**
4. Get the following credentials:
   - **Business Account ID**: Found in account settings
   - **Phone Number ID**: The WhatsApp number you'll use
   - **Access Token**: Create a long-lived token in App Roles

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Configuration
WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_API_TOKEN="your_long_lived_access_token"
WHATSAPP_API_VERSION="v20.0"
```

### Step 3: Verify Phone Number

1. In Meta Business Manager, verify your WhatsApp phone number
2. Ensure the number is approved for sending messages

---

## API Endpoints

### 1. Send Invoice via WhatsApp

**Endpoint:** `POST /api/invoice/:id/send-whatsapp`

**Authentication:** Required (JWT Bearer Token)

**Request Body:**

```json
{
  "phoneNumber": "9876543210", // Optional if customer has phone
  "useDefault": true, // Use customer's stored phone (default: true)
  "method": "TEXT" // "TEXT" or "PDF" (default: "TEXT")
}
```

**Minimal Request (using stored phone):**

```json
{
  "useDefault": true
}
```

**Successful Response (200):**

```json
{
  "success": true,
  "message": "Invoice sent successfully to 919876543210",
  "data": {
    "invoiceId": "clp123abc456",
    "phoneNumber": "919876543210",
    "method": "TEXT",
    "messageId": "wamid.HBEUIFIdfN...",
    "timestamp": "2025-10-29T10:30:00Z",
    "recipientName": "John Doe",
    "invoiceData": {
      "totalAmount": 5500,
      "balanceAmount": 2500,
      "itemCount": 3
    }
  }
}
```

**Error Responses:**

- **404 Not Found:**

```json
{
  "error": "Invoice not found."
}
```

- **400 Bad Request (Invalid Phone):**

```json
{
  "error": "Invalid phone number format: 1234567890",
  "hint": "Phone number should be a valid Indian mobile number (10 digits)"
}
```

- **503 Service Unavailable (Not Configured):**

```json
{
  "error": "WhatsApp service is not configured. Please contact administrator.",
  "hint": "Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables."
}
```

**Phone Number Formats Accepted:**

- `9876543210` (10 digits)
- `+919876543210` (with country code)
- `919876543210` (country code without +)
- `09876543210` (with leading 0)

---

### 2. Send Payment Reminder

**Endpoint:** `POST /api/invoice/:id/payment-reminder`

**Authentication:** Required (JWT Bearer Token)

**Request Body:**

```json
{
  "phoneNumber": "9876543210", // Optional if customer has phone
  "useDefault": true // Use customer's stored phone (default: true)
}
```

**Successful Response (200):**

```json
{
  "success": true,
  "message": "Payment reminder sent to 919876543210",
  "data": {
    "invoiceId": "clp123abc456",
    "phoneNumber": "919876543210",
    "balanceAmount": 2500,
    "timestamp": "2025-10-29T10:35:00Z"
  }
}
```

**Error Responses:**

- **400 Bad Request (Already Paid):**

```json
{
  "error": "Invoice is already fully paid."
}
```

- **400 Bad Request (No Phone):**

```json
{
  "error": "No phone number available."
}
```

---

## Code Examples

### Using cURL

#### 1. Send Invoice via WhatsApp (Using Customer's Default Phone)

```bash
curl -X POST http://localhost:8080/api/invoice/clp123abc456/send-whatsapp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "useDefault": true,
    "method": "TEXT"
  }'
```

#### 2. Send Invoice with Custom Phone Number

```bash
curl -X POST http://localhost:8080/api/invoice/clp123abc456/send-whatsapp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "method": "TEXT"
  }'
```

#### 3. Send Payment Reminder

```bash
curl -X POST http://localhost:8080/api/invoice/clp123abc456/payment-reminder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "useDefault": true
  }'
```

### Using JavaScript/Axios

```javascript
const axios = require("axios");

const sendInvoiceViaWhatsApp = async (invoiceId, token, phoneNumber) => {
  try {
    const response = await axios.post(
      `http://localhost:8080/api/invoice/${invoiceId}/send-whatsapp`,
      {
        phoneNumber: phoneNumber,
        useDefault: false,
        method: "TEXT",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Invoice sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error.response.data);
    throw error;
  }
};

// Usage
await sendInvoiceViaWhatsApp("clp123abc456", "your_token", "9876543210");
```

### Using Fetch API

```javascript
const sendInvoiceViaWhatsApp = async (invoiceId, token) => {
  const response = await fetch(`/api/invoice/${invoiceId}/send-whatsapp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      useDefault: true,
      method: "TEXT",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
```

---

## Message Templates

### Invoice Message Format

```
🧿 *Roy & Roy Opticals*

Dear John Doe,

Thank you for your purchase!

*Invoice Details:*
📋 Invoice #: clp123abc456
💰 Total Amount: ₹5,500.00
📦 Items: 3

Your invoice has been generated. Please use the link below to view your complete invoice with details.

Click the button below to view your invoice PDF:
🔗 https://your-app.com/invoices/clp123abc456/pdf

*Payment Methods:*
💳 Cash, Card, UPI, Gift Card

For any queries, please contact us:
📱 +91-96765 43210
📧 contact@cleareyes.com

Thank you for choosing Roy & Roy Opticals!
Follow us: Instagram @cleareyes_optical

Visit us again soon! 😊
```

### Payment Reminder Format

```
🧿 *Roy & Roy Opticals*

Hi John Doe,

This is a gentle reminder about your pending payment.

*Outstanding Amount:* ₹2,500.00
📋 Invoice #: clp123abc456
📅 Due Date: 28-11-2025

Please settle the payment at your earliest convenience.

*Payment Options:*
💳 Cash, Card, UPI
📱 +91-96765 43210

Thank you!
```

---

## Validation Rules

### Phone Number Validation

- **Accepts:** 10-digit Indian mobile numbers
- **Formats:** `9876543210`, `+919876543210`, `919876543210`, `09876543210`
- **Returns Error:** Invalid formats or country codes

### Invoice Validation

- Invoice must exist in database
- Invoice must belong to user's shop
- Customer/Patient must have contact information

### Payment Reminder Validation

- Invoice must have outstanding balance
- Cannot send reminder for fully paid invoices

---

## Error Handling

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "hint": "Optional helpful hint for resolution",
  "details": "Technical details (if available)"
}
```

### Common Error Codes

| Status | Error                                | Cause                             |
| ------ | ------------------------------------ | --------------------------------- |
| 400    | Invalid phone number format          | Phone format not recognized       |
| 400    | Invoice has no patient/customer info | No recipient data                 |
| 403    | Access denied                        | Invoice belongs to different shop |
| 404    | Invoice not found                    | Invoice ID doesn't exist          |
| 500    | Failed to send invoice via WhatsApp  | API communication error           |
| 503    | WhatsApp service not configured      | Missing env variables             |

---

## Audit Logging

All WhatsApp sends are logged for compliance:

```javascript
// Log structure (internal)
{
  invoiceId: "clp123abc456",
  phoneNumber: "919876543210",
  messageType: "INVOICE_SENT",
  status: "SUCCESS",
  timestamp: "2025-10-29T10:30:00Z",
  response: { /* WhatsApp API response */ }
}
```

---

## Security Considerations

✅ **Authentication Required:** All endpoints require JWT token
✅ **Shop Isolation:** Users can only send from their shop
✅ **Rate Limiting:** Recommended - Implement at app level
✅ **Data Privacy:** Phone numbers not stored in logs
✅ **Encryption:** Credentials stored securely in env variables

---

## Troubleshooting

### Issue: "WhatsApp service is not configured"

**Solution:** Set environment variables

```env
WHATSAPP_API_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

### Issue: "Invalid phone number format"

**Solution:** Use valid Indian format:

```
✅ 9876543210
✅ +919876543210
❌ 876543210 (too short)
❌ 19876543210 (wrong country code)
```

### Issue: Message not received

**Solution:**

1. Verify phone number is registered on WhatsApp
2. Check WhatsApp Business Account is active
3. Check API token expiration
4. Verify phone number is approved in Meta Business Manager

### Issue: "Access denied"

**Solution:** Ensure invoice belongs to your shop (shopId must match)

---

## Future Enhancements

- [ ] Bulk send to multiple customers
- [ ] Scheduled message delivery
- [ ] Message templates management
- [ ] Webhook for delivery status
- [ ] Invoice PDF as attachment
- [ ] Multilingual support
- [ ] Analytics dashboard

---

## Support

For issues or questions:

- Check the [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- Review console logs for detailed error messages
- Verify all environment variables are set correctly
