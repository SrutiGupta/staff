# 🧪 Incoming Shipment Tracking - Postman Testing Guide

## Quick Start Testing

### 1. Setup Base URL

```
{{baseUrl}} = http://localhost:5000/api
```

### 2. Shop Admin Auth Token

Obtain JWT token from Shop Admin login, then set:

```
{{shopAdminToken}} = <your_jwt_token>
{{shopId}} = <your_shop_id>
```

---

## 🧪 Test Cases

### Test 1: Retailer Performs Bulk Distribution

**Endpoint:** `POST /portal/retailer/bulk-distribute`

**Headers:**

```json
{
  "Authorization": "Bearer {{retailerToken}}",
  "Content-Type": "application/json"
}
```

**Body:**

```json
{
  "distributions": [
    {
      "retailerShopId": 1,
      "productId": 15,
      "quantity": 100,
      "unitPrice": 150.0,
      "totalPrice": 15000.0
    },
    {
      "retailerShopId": 1,
      "productId": 20,
      "quantity": 50,
      "unitPrice": 200.0,
      "totalPrice": 10000.0
    }
  ]
}
```

**Expected Response (201):**

```json
{
  "message": "Bulk distribution completed: 2 successful, 0 failed",
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "distributions": [
    {
      "distributionId": 1,
      "shopId": 1,
      "productId": 15,
      "quantity": 100,
      "status": "PENDING"
    }
  ]
}
```

✅ **What happens automatically:**

- `ShopDistribution` record created
- `IncomingShipment` record created with Status: EXPECTED
- Shop admin can now see this in their incoming shipments list

---

### Test 2: Shop Admin Views All Incoming Shipments

**Endpoint:** `GET /shop-admin/stock/incoming-shipments?page=1&limit=10&status=EXPECTED`

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}"
}
```

**Expected Response (200):**

```json
{
  "message": "Incoming shipments retrieved successfully",
  "shipments": [
    {
      "id": 1,
      "product": {
        "id": 15,
        "name": "Ray-Ban Aviator Classic",
        "sku": "RB-AV-001",
        "barcode": "123456789",
        "company": { "name": "Ray-Ban" }
      },
      "expectedQuantity": 100,
      "receivedQuantity": 0,
      "discrepancyQuantity": 0,
      "status": "EXPECTED",
      "distributionDate": "2025-11-19T10:30:00Z",
      "expectedDeliveryDate": null,
      "actualDeliveryDate": null,
      "retailer": {
        "name": "Vision Supplies Ltd",
        "companyName": "Vision Group"
      },
      "stockReceipt": null,
      "discrepancyReason": null,
      "notes": "Distributed from retailer bulk operation",
      "createdAt": "2025-11-19T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "summary": {
    "total": 1,
    "expected": 1,
    "inTransit": 0,
    "partiallyReceived": 0,
    "fullyReceived": 0,
    "overdue": 0,
    "cancelled": 0
  }
}
```

✅ **Verification Points:**

- [ ] See "Ray-Ban Aviator Classic" with expected quantity 100
- [ ] Status shows "EXPECTED"
- [ ] Summary shows 1 item expected
- [ ] No stock receipt linked yet

---

### Test 3: Staff Creates Stock Receipt

**Endpoint:** `POST /api/stock-receipts`

**Headers:**

```json
{
  "Authorization": "Bearer {{staffToken}}",
  "Content-Type": "application/json"
}
```

**Body:**

```json
{
  "productId": 15,
  "receivedQuantity": 100,
  "supplierName": "Vision Supplies Ltd",
  "deliveryNote": "DN-2025-001",
  "batchNumber": "BATCH-202511-001",
  "expiryDate": "2027-11-30"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Stock receipt created successfully. Waiting for shop admin approval.",
  "receipt": {
    "id": 1,
    "shopId": 1,
    "productId": 15,
    "receivedQuantity": 100,
    "verifiedQuantity": null,
    "status": "PENDING",
    "product": { "name": "Ray-Ban Aviator Classic" },
    "createdAt": "2025-11-19T14:00:00Z"
  }
}
```

---

### Test 4: Shop Admin Views Incoming Shipment Details

**Endpoint:** `GET /shop-admin/stock/incoming-shipments/1`

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}"
}
```

**Expected Response (200):**

```json
{
  "message": "Incoming shipment details retrieved successfully",
  "shipment": {
    "id": 1,
    "product": {
      "id": 15,
      "name": "Ray-Ban Aviator Classic",
      "sku": "RB-AV-001",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR"
    },
    "shop": {
      "id": 1,
      "name": "Downtown Eye Care",
      "address": "123 Main St"
    },
    "retailer": {
      "id": 1,
      "name": "Vision Supplies Ltd"
    },
    "expectedQuantity": 100,
    "receivedQuantity": 0,
    "discrepancyQuantity": 0,
    "status": "EXPECTED",
    "distributionDate": "2025-11-19T10:30:00Z",
    "actualDeliveryDate": null,
    "wholesalePrice": 150.0,
    "mrp": 199.99,
    "stockReceipt": null,
    "discrepancyReason": null,
    "notes": "Distributed from retailer bulk operation",
    "createdAt": "2025-11-19T10:30:00Z"
  }
}
```

---

### Test 5: Shop Admin Approves Stock Receipt

**Endpoint:** `PUT /shop-admin/stock/receipts/1/verify`

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}",
  "Content-Type": "application/json"
}
```

**Body:**

```json
{
  "decision": "APPROVED",
  "verifiedQuantity": 100,
  "adminNotes": "Stock verified and received in good condition"
}
```

**Expected Response (200):**

```json
{
  "message": "Stock receipt has been approved successfully.",
  "receipt": {
    "id": 1,
    "shopId": 1,
    "productId": 15,
    "receivedQuantity": 100,
    "verifiedQuantity": 100,
    "status": "APPROVED",
    "product": { "id": 15, "name": "Ray-Ban Aviator Classic" },
    "verifiedByAdmin": { "id": 1, "name": "John Admin" },
    "verifiedAt": "2025-11-19T14:15:00Z"
  },
  "updatedInventory": {
    "productId": 15,
    "quantityAdded": 100
  }
}
```

✅ **What happens automatically:**

- ShopInventory updated (quantity increased by 100)
- StockMovement record created (STOCK_IN)
- **IncomingShipment automatically updated:**
  - receivedQuantity: 100
  - discrepancyQuantity: 0
  - status: FULLY_RECEIVED
  - stockReceiptId: 1
  - actualDeliveryDate: now

---

### Test 6: Shop Admin Checks Updated Incoming Shipment

**Endpoint:** `GET /shop-admin/stock/incoming-shipments/1`

**Expected Response (200) - Notice Status Changed:**

```json
{
  "shipment": {
    "id": 1,
    "expectedQuantity": 100,
    "receivedQuantity": 100,
    "discrepancyQuantity": 0,
    "status": "FULLY_RECEIVED",  ← Changed from EXPECTED
    "actualDeliveryDate": "2025-11-19T14:15:00Z",  ← Now set
    "stockReceipt": {
      "id": 1,
      "receivedQuantity": 100,
      "verifiedQuantity": 100,
      "status": "APPROVED",
      "receivedByStaff": { "name": "Ahmed" },
      "verifiedByAdmin": { "name": "John Admin" }
    },
    "discrepancyReason": null
  }
}
```

✅ **Verification Points:**

- [ ] Status changed to FULLY_RECEIVED
- [ ] receivedQuantity now shows 100
- [ ] stockReceipt is linked
- [ ] actualDeliveryDate is set
- [ ] discrepancyQuantity is 0

---

### Test 7: Test Shortage Scenario

**Setup:** Retailer distributes 100 units, but staff receives only 95

**Step 1: Bulk Distribution (100 units)**

```json
{ "quantity": 100 }
→ IncomingShipment created (expectedQuantity: 100)
```

**Step 2: Staff Creates Receipt (95 units)**

```json
{ "receivedQuantity": 95 }
→ StockReceipt created with 95
```

**Step 3: Admin Approves (95 units)**

```json
{
  "decision": "APPROVED",
  "verifiedQuantity": 95,
  "adminNotes": "5 units missing from shipment"
}
```

**Expected: IncomingShipment Updated**

```json
{
  "id": 1,
  "expectedQuantity": 100,
  "receivedQuantity": 95,
  "discrepancyQuantity": -5,
  "status": "PARTIALLY_RECEIVED",
  "discrepancyReason": "SHORTAGE",
  "stockReceipt": { "id": 1, ... }
}
```

---

### Test 8: Get Comparison Report

**Endpoint:** `GET /shop-admin/stock/incoming-shipments/summary/comparison?dateFrom=2025-11-01&dateTo=2025-11-30`

**Expected Response (200):**

```json
{
  "message": "Shipment comparison retrieved successfully",
  "comparison": {
    "totalExpected": 150, // 100 + 50 from distributions
    "totalReceived": 145, // 95 + 50
    "totalDiscrepancy": -5,
    "shipmentDetails": [
      {
        "id": 1,
        "product": { "name": "Ray-Ban Aviator", "sku": "RB-AV-001" },
        "expectedQuantity": 100,
        "receivedQuantity": 95,
        "discrepancyQuantity": -5,
        "status": "PARTIALLY_RECEIVED",
        "discrepancyPercent": "-5.00"
      },
      {
        "id": 2,
        "product": { "name": "Oakley Holbrook", "sku": "OAK-HB-001" },
        "expectedQuantity": 50,
        "receivedQuantity": 50,
        "discrepancyQuantity": 0,
        "status": "FULLY_RECEIVED",
        "discrepancyPercent": "0.00"
      }
    ],
    "discrepancyShipments": [
      {
        "id": 1,
        "product": "Ray-Ban Aviator",
        "expectedQuantity": 100,
        "receivedQuantity": 95,
        "discrepancy": -5,
        "reason": "SHORTAGE"
      }
    ]
  },
  "summary": {
    "totalShipments": 2,
    "fullyReceivedCount": 1,
    "discrepancyCount": 1,
    "accuracyPercent": "50.00"
  }
}
```

✅ **Verification Points:**

- [ ] Total expected: 150
- [ ] Total received: 145
- [ ] Discrepancy: -5
- [ ] Only 1 shipment has issues
- [ ] Accuracy: 50% (1 out of 2)

---

## 🧪 Test Checklist

### End-to-End Flow

- [ ] Retailer performs bulk distribution
- [ ] IncomingShipment created automatically
- [ ] Shop admin sees incoming shipment in list
- [ ] Shop admin views details
- [ ] Staff creates stock receipt
- [ ] Admin approves receipt
- [ ] IncomingShipment status updated to FULLY_RECEIVED
- [ ] Comparison report shows accurate data
- [ ] Discrepancies highlighted correctly

### Edge Cases

- [ ] Shortage (received < expected)
- [ ] Excess (received > expected)
- [ ] Exact match (received = expected)
- [ ] Multiple products in one distribution
- [ ] Date filtering in comparison report
- [ ] Pagination in shipment list
- [ ] Status filtering (EXPECTED, PARTIALLY_RECEIVED, etc)

### Security

- [ ] Shop admin can only see their own shipments
- [ ] Staff cannot modify IncomingShipment records
- [ ] Retailer cannot see shop admin IncomingShipments
- [ ] Invalid shop access returns 403 error

---

## 💡 Common Issues & Solutions

### Issue: IncomingShipment not created after distribution

**Check:**

1. Bulk distribution endpoint returns success
2. ShopDistribution record is created
3. Prisma has IncomingShipment model
4. Database migration ran successfully

**Solution:**

```bash
npx prisma migrate deploy
npx prisma db push
```

---

### Issue: IncomingShipment not updated after receipt approval

**Check:**

1. StockReceipt shows APPROVED status
2. IncomingShipment still shows old status
3. Check database directly:

```sql
SELECT * FROM "IncomingShipment" WHERE id = 1;
```

**Solution:**

- Verify approveStockReceipt function has the update logic
- Check if transaction is committing properly
- Look for errors in server logs

---

### Issue: Discrepancy calculation incorrect

**Example:**

- Expected: 100
- Received: 95
- Expected discrepancy: -5

**Formula:**

```javascript
discrepancy = receivedQuantity - expectedQuantity;
// 95 - 100 = -5 ✅
```

- If discrepancy is 0 → FULLY_RECEIVED
- If discrepancy < 0 → PARTIALLY_RECEIVED (shortage)
- If discrepancy > 0 → FULLY_RECEIVED (excess, but flag it)

---

## 📊 Dashboard Widgets

### Suggested UI Components:

**1. Incoming Shipments Summary Card**

```
┌────────────────────────────┐
│ Incoming Shipments         │
├────────────────────────────┤
│ Expected:        5000      │
│ Received:        4850      │
│ Pending:           150     │
│ Discrepancy:     -150      │
│ Accuracy:      97.00%      │
└────────────────────────────┘
```

**2. Shipment Status Breakdown**

```
Expected:     ████ 20
In Transit:   ██ 5
Received:     ███ 10
Discrepancy:  █ 2
Cancelled:    ░ 0
```

**3. Recent Shipments List**

```
Product              Expected  Received  Status
───────────────────────────────────────────────
Ray-Ban Aviator        100        95    ⚠️ SHORT
Oakley Holbrook         50         50   ✅ FULL
Prada Cat-Eye           75         75   ✅ FULL
Guess Wayfarer          25         30   ⚠️ EXCESS
```

---

## 🎓 Learning Resources

- Main Documentation: `INCOMING_SHIPMENT_TRACKING.md`
- Stock Receipt System: `STOCK_RECEIPT_SECURITY_INTEGRATION.md`
- Inventory Workflow: `COMPLETE_INVENTORY_API_WORKFLOW.md`
- API Reference: Check inline JSDoc comments in controller

---

## 🚀 Next Steps

1. Run database migration
2. Test bulk distribution endpoint
3. Verify IncomingShipment creation
4. Test shop admin endpoints
5. Create frontend components for viewing shipments
6. Build dashboard widget
7. Set up alerts for overdue/discrepancy shipments
