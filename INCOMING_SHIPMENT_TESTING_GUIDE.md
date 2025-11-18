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

## 📋 Shipment Status Enum Reference

**`ShipmentStatus` enum values - use these in your frontend:**

| Status                 | Value                | Description                                                                    |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------ |
| **EXPECTED**           | `EXPECTED`           | Shipment created from bulk distribution, awaiting delivery                     |
| **IN_TRANSIT**         | `IN_TRANSIT`         | Shipment is in delivery/on the way                                             |
| **PARTIALLY_RECEIVED** | `PARTIALLY_RECEIVED` | Received quantity less than expected (shortage) or more than expected (excess) |
| **FULLY_RECEIVED**     | `FULLY_RECEIVED`     | All expected quantity received and verified by admin                           |
| **OVERDUE**            | `OVERDUE`            | Shipment not received within expected delivery window                          |
| **CANCELLED**          | `CANCELLED`          | Shipment cancelled/returned                                                    |

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

### Test 2: Shop Admin Views All Incoming Shipments (Multiple Shipments Example)

**Endpoint:** `GET /shop-admin/stock/incoming-shipments`

**Query Parameters:**

| Parameter | Type   | Required | Example    | Description                                                                                     |
| --------- | ------ | -------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `page`    | number | No       | `1`        | Page number for pagination                                                                      |
| `limit`   | number | No       | `10`       | Items per page                                                                                  |
| `status`  | string | No       | `EXPECTED` | Filter by status (EXPECTED, IN_TRANSIT, PARTIALLY_RECEIVED, FULLY_RECEIVED, OVERDUE, CANCELLED) |

**Example URL:**

```
GET /shop-admin/stock/incoming-shipments?page=1&limit=10&status=EXPECTED
```

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}"
}
```

**Expected Response (200) - Multiple Incoming Shipments:**

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
    },
    {
      "id": 2,
      "product": {
        "id": 20,
        "name": "Oakley Holbrook",
        "sku": "OAK-HB-001",
        "barcode": "987654321",
        "company": { "name": "Oakley" }
      },
      "expectedQuantity": 50,
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
    },
    {
      "id": 3,
      "product": {
        "id": 25,
        "name": "Prada Cat-Eye",
        "sku": "PRA-CE-001",
        "barcode": "555666777",
        "company": { "name": "Prada" }
      },
      "expectedQuantity": 75,
      "receivedQuantity": 75,
      "discrepancyQuantity": 0,
      "status": "FULLY_RECEIVED",
      "distributionDate": "2025-11-15T08:00:00Z",
      "expectedDeliveryDate": "2025-11-17T00:00:00Z",
      "actualDeliveryDate": "2025-11-17T14:30:00Z",
      "retailer": {
        "name": "Vision Supplies Ltd",
        "companyName": "Vision Group"
      },
      "stockReceipt": {
        "id": 1,
        "receivedQuantity": 75,
        "verifiedQuantity": 75,
        "status": "APPROVED"
      },
      "discrepancyReason": null,
      "notes": "Distributed from retailer bulk operation",
      "createdAt": "2025-11-15T08:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevious": false
  },
  "summary": {
    "total": 3,
    "expected": 2,
    "inTransit": 0,
    "partiallyReceived": 0,
    "fullyReceived": 1,
    "overdue": 0,
    "cancelled": 0
  }
}
```

✅ **Verification Points for Frontend Implementation:**

- [ ] Display shipments in table/list format with status badges
- [ ] Show status using enum values (EXPECTED, IN_TRANSIT, etc)
- [ ] Color-code status:
  - 🟢 FULLY_RECEIVED = Green
  - 🟡 EXPECTED/IN_TRANSIT = Yellow/Blue
  - 🟠 PARTIALLY_RECEIVED = Orange
  - 🔴 OVERDUE/CANCELLED = Red
- [ ] Show pagination controls (only if totalPages > 1)
- [ ] Allow filtering by status using dropdown
- [ ] Display quantity comparison (expected vs received)
- [ ] Link to detail view for each shipment

---

### Test 3: Shop Admin Updates Incoming Shipment Status (Manual Update)

**Endpoint:** `PATCH /shop-admin/stock/incoming-shipments/:id/receive`

**Path Parameters:**

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `id`      | number | Yes      | Incoming shipment ID |

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}",
  "Content-Type": "application/json"
}
```

**Request Body Options:**

#### Option 1: Update Single Shipment Status

```json
{
  "status": "IN_TRANSIT",
  "notes": "Confirmed with courier - delivery expected by 2025-11-20"
}
```

#### Option 2: Mark as Received (Auto-updates via Stock Receipt Approval)

```json
{
  "status": "FULLY_RECEIVED",
  "receivedQuantity": 100,
  "actualDeliveryDate": "2025-11-19T14:30:00Z"
}
```

#### Option 3: Mark as Partially Received (Shortage)

```json
{
  "status": "PARTIALLY_RECEIVED",
  "receivedQuantity": 95,
  "discrepancyQuantity": -5,
  "discrepancyReason": "SHORTAGE",
  "notes": "5 units missing from delivery"
}
```

#### Option 4: Cancel Shipment

```json
{
  "status": "CANCELLED",
  "notes": "Retailer cancelled order, shipment returned"
}
```

**Expected Response (200):**

```json
{
  "message": "Incoming shipment status updated successfully",
  "shipment": {
    "id": 1,
    "product": { "name": "Ray-Ban Aviator Classic", "sku": "RB-AV-001" },
    "expectedQuantity": 100,
    "receivedQuantity": 95,
    "discrepancyQuantity": -5,
    "status": "PARTIALLY_RECEIVED",
    "discrepancyReason": "SHORTAGE",
    "actualDeliveryDate": "2025-11-19T14:30:00Z",
    "notes": "5 units missing from delivery",
    "updatedAt": "2025-11-19T14:35:00Z"
  }
}
```

✅ **Frontend Implementation Notes:**

- Status changes trigger automatic UI updates in list view
- Use status enum values when sending requests
- Display discrepancy reasons to staff for follow-up actions
- Show last updated timestamp for tracking

---

### Test 4: Staff Creates Stock Receipt (Linked to Incoming Shipment)

**Endpoint:** `POST /api/stock-receipts`

**Headers:**

```json
{
  "Authorization": "Bearer {{staffToken}}",
  "Content-Type": "application/json"
}
```

**Body Example 1 - Single Product:**

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

**Body Example 2 - Multiple Products (Bulk Receipt):**

```json
{
  "bulkReceiptData": [
    {
      "productId": 15,
      "receivedQuantity": 100,
      "supplierName": "Vision Supplies Ltd",
      "deliveryNote": "DN-2025-001",
      "batchNumber": "BATCH-202511-001",
      "expiryDate": "2027-11-30"
    },
    {
      "productId": 20,
      "receivedQuantity": 50,
      "supplierName": "Vision Supplies Ltd",
      "deliveryNote": "DN-2025-001",
      "batchNumber": "BATCH-202511-002",
      "expiryDate": "2027-12-15"
    },
    {
      "productId": 25,
      "receivedQuantity": 75,
      "supplierName": "Vision Supplies Ltd",
      "deliveryNote": "DN-2025-001",
      "batchNumber": "BATCH-202511-003",
      "expiryDate": "2028-01-20"
    }
  ]
}
```

**Expected Response (201) - Single:**

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

**Expected Response (201) - Multiple:**

```json
{
  "success": true,
  "message": "3 stock receipts created successfully. Waiting for shop admin approval.",
  "receipts": [
    {
      "id": 1,
      "shopId": 1,
      "productId": 15,
      "receivedQuantity": 100,
      "verifiedQuantity": null,
      "status": "PENDING",
      "product": { "name": "Ray-Ban Aviator Classic" }
    },
    {
      "id": 2,
      "shopId": 1,
      "productId": 20,
      "receivedQuantity": 50,
      "verifiedQuantity": null,
      "status": "PENDING",
      "product": { "name": "Oakley Holbrook" }
    },
    {
      "id": 3,
      "shopId": 1,
      "productId": 25,
      "receivedQuantity": 75,
      "verifiedQuantity": null,
      "status": "PENDING",
      "product": { "name": "Prada Cat-Eye" }
    }
  ]
}
```

**Automatic IncomingShipment Updates:**

When staff creates stock receipt(s), the corresponding IncomingShipment records are automatically updated:

```javascript
// For each stock receipt created:
IncomingShipment.update({
  receivedQuantity: 100,
  discrepancyQuantity: 0,
  status: "FULLY_RECEIVED", // if quantities match
  stockReceiptId: 1,
});
```

---

### Test 5: Shop Admin Views Incoming Shipment Details

**Endpoint:** `GET /shop-admin/stock/incoming-shipments/:id`

**Path Parameters:**

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `id`      | number | Yes      | Incoming shipment ID |

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}"
}
```

**Expected Response (200) - EXPECTED Status:**

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

**Expected Response (200) - PARTIALLY_RECEIVED Status (With Discrepancy):**

```json
{
  "message": "Incoming shipment details retrieved successfully",
  "shipment": {
    "id": 2,
    "product": {
      "id": 20,
      "name": "Oakley Holbrook",
      "sku": "OAK-HB-001",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR"
    },
    "shop": {
      "id": 1,
      "name": "Downtown Eye Care"
    },
    "retailer": {
      "id": 1,
      "name": "Vision Supplies Ltd"
    },
    "expectedQuantity": 50,
    "receivedQuantity": 48,
    "discrepancyQuantity": -2,
    "status": "PARTIALLY_RECEIVED",
    "discrepancyReason": "SHORTAGE",
    "distributionDate": "2025-11-15T10:30:00Z",
    "actualDeliveryDate": "2025-11-17T14:30:00Z",
    "wholesalePrice": 200.0,
    "mrp": 250.0,
    "stockReceipt": {
      "id": 2,
      "receivedQuantity": 48,
      "verifiedQuantity": 48,
      "status": "APPROVED",
      "receivedByStaff": { "name": "Ahmed Khan" },
      "verifiedByAdmin": { "name": "John Admin" },
      "approvedAt": "2025-11-17T15:00:00Z"
    },
    "notes": "Distributed from retailer bulk operation. 2 units damaged in transit.",
    "createdAt": "2025-11-15T10:30:00Z"
  }
}
```

✅ **Frontend Implementation - Discrepancy Display:**

Based on status, display different information:

**If status = EXPECTED:**

- Show "Awaiting delivery" message
- Display expected quantity in bold
- Show empty state for received/discrepancy
- Allow manual status update button

**If status = FULLY_RECEIVED:**

- Show green checkmark
- Display: "All 100 units received as expected"
- Show linked stock receipt details
- Show delivery date

**If status = PARTIALLY_RECEIVED:**

- Show warning icon (⚠️)
- Display discrepancy with reason in red
- Example: "-2 units (SHORTAGE)" or "+5 units (EXCESS)"
- Show which receipt revealed the discrepancy
- Allow admin follow-up actions

---

### Test 6: Shop Admin Approves Stock Receipt

**Endpoint:** `PUT /shop-admin/stock/receipts/:id/verify`

**Path Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `id`      | number | Yes      | Stock receipt ID |

**Headers:**

```json
{
  "Authorization": "Bearer {{shopAdminToken}}",
  "Content-Type": "application/json"
}
```

**Request Body:**

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

✅ **What happens automatically after approval:**

1. ShopInventory updated (quantity increased by 100)
2. StockMovement record created (STOCK_IN)
3. **IncomingShipment automatically updated:**

   - `receivedQuantity`: 100
   - `discrepancyQuantity`: 0
   - `status`: FULLY_RECEIVED
   - `stockReceiptId`: 1
   - `actualDeliveryDate`: current timestamp

4. Frontend receives update via response and can refresh shipment details

---

### Test 7: Shop Admin Checks Updated Incoming Shipment After Approval

**Endpoint:** `GET /shop-admin/stock/incoming-shipments/1`

**Expected Response (200) - Notice Status Changed:**

```json
{
  "message": "Incoming shipment details retrieved successfully",
  "shipment": {
    "id": 1,
    "product": { "name": "Ray-Ban Aviator Classic", "sku": "RB-AV-001" },
    "expectedQuantity": 100,
    "receivedQuantity": 100,
    "discrepancyQuantity": 0,
    "status": "FULLY_RECEIVED",
    "actualDeliveryDate": "2025-11-19T14:15:00Z",
    "stockReceipt": {
      "id": 1,
      "receivedQuantity": 100,
      "verifiedQuantity": 100,
      "status": "APPROVED",
      "receivedByStaff": { "name": "Ahmed" },
      "verifiedByAdmin": { "name": "John Admin" },
      "approvedAt": "2025-11-19T14:15:00Z"
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

### Test 8: Multiple Shipments Workflow (Batch Processing)

**Scenario:** Retailer sends 3 different products, staff receives all, but one has shortage.

**Step 1: Bulk Distribution Creates Multiple IncomingShipments**

**Endpoint:** `POST /portal/retailer/bulk-distribute`

```json
{
  "distributions": [
    {
      "retailerShopId": 1,
      "productId": 15,
      "quantity": 100,
      "unitPrice": 150.0
    },
    {
      "retailerShopId": 1,
      "productId": 20,
      "quantity": 50,
      "unitPrice": 200.0
    },
    {
      "retailerShopId": 1,
      "productId": 25,
      "quantity": 75,
      "unitPrice": 180.0
    }
  ]
}
```

**Auto-creates IncomingShipment records:**

```
IncomingShipment 1: Product 15, Expected: 100, Status: EXPECTED
IncomingShipment 2: Product 20, Expected: 50, Status: EXPECTED
IncomingShipment 3: Product 25, Expected: 75, Status: EXPECTED
```

**Step 2: Admin Views All Incoming Shipments**

**Endpoint:** `GET /shop-admin/stock/incoming-shipments?status=EXPECTED`

**Response shows all 3 shipments:**

```json
{
  "shipments": [
    {
      "id": 1,
      "product": { "name": "Ray-Ban Aviator Classic" },
      "expectedQuantity": 100,
      "receivedQuantity": 0,
      "status": "EXPECTED"
    },
    {
      "id": 2,
      "product": { "name": "Oakley Holbrook" },
      "expectedQuantity": 50,
      "receivedQuantity": 0,
      "status": "EXPECTED"
    },
    {
      "id": 3,
      "product": { "name": "Prada Cat-Eye" },
      "expectedQuantity": 75,
      "receivedQuantity": 0,
      "status": "EXPECTED"
    }
  ],
  "summary": {
    "total": 3,
    "expected": 3,
    "fullyReceived": 0
  }
}
```

**Step 3: Staff Creates Stock Receipts for All Products**

**Endpoint:** `POST /api/stock-receipts`

```json
{
  "bulkReceiptData": [
    {
      "productId": 15,
      "receivedQuantity": 100,
      "supplierName": "Vision Supplies Ltd",
      "deliveryNote": "DN-2025-001",
      "batchNumber": "BATCH-202511-001",
      "expiryDate": "2027-11-30"
    },
    {
      "productId": 20,
      "receivedQuantity": 48,
      "supplierName": "Vision Supplies Ltd",
      "deliveryNote": "DN-2025-001",
      "batchNumber": "BATCH-202511-002",
      "expiryDate": "2027-12-15"
    },
    {
      "productId": 25,
      "receivedQuantity": 75,
      "supplierName": "Vision Supplies Ltd",
      "deliveryNote": "DN-2025-001",
      "batchNumber": "BATCH-202511-003",
      "expiryDate": "2028-01-20"
    }
  ]
}
```

**Note:** Product 20 received only 48 instead of 50 (shortage of 2 units)

**Step 4: Admin Approves All Stock Receipts**

**Endpoint 1:** `PUT /shop-admin/stock/receipts/1/verify`

```json
{
  "decision": "APPROVED",
  "verifiedQuantity": 100,
  "adminNotes": "Product 1 verified perfect"
}
```

**Endpoint 2:** `PUT /shop-admin/stock/receipts/2/verify`

```json
{
  "decision": "APPROVED",
  "verifiedQuantity": 48,
  "adminNotes": "2 units missing from delivery - damaged in transit"
}
```

**Endpoint 3:** `PUT /shop-admin/stock/receipts/3/verify`

```json
{
  "decision": "APPROVED",
  "verifiedQuantity": 75,
  "adminNotes": "Product 3 verified perfect"
}
```

**Step 5: Admin Views Updated Incoming Shipments**

**Endpoint:** `GET /shop-admin/stock/incoming-shipments`

**Response shows all statuses updated:**

```json
{
  "shipments": [
    {
      "id": 1,
      "product": { "name": "Ray-Ban Aviator Classic" },
      "expectedQuantity": 100,
      "receivedQuantity": 100,
      "discrepancyQuantity": 0,
      "status": "FULLY_RECEIVED"
    },
    {
      "id": 2,
      "product": { "name": "Oakley Holbrook" },
      "expectedQuantity": 50,
      "receivedQuantity": 48,
      "discrepancyQuantity": -2,
      "status": "PARTIALLY_RECEIVED",
      "discrepancyReason": "SHORTAGE"
    },
    {
      "id": 3,
      "product": { "name": "Prada Cat-Eye" },
      "expectedQuantity": 75,
      "receivedQuantity": 75,
      "discrepancyQuantity": 0,
      "status": "FULLY_RECEIVED"
    }
  ],
  "summary": {
    "total": 3,
    "expected": 0,
    "fullyReceived": 2,
    "partiallyReceived": 1
  }
}
```

✅ **Frontend Implementation for Multiple Shipments:**

**Status Summary Card:**

```
Expected Shipments:     0  (All arrived)
Fully Received:         2  ✅
Partially Received:     1  ⚠️  (2 units short)
```

**List Display:**

```
┌─────────────────────────────────────────────────────┐
│ Product         │ Expected │ Received │ Status       │
├─────────────────────────────────────────────────────┤
│ Ray-Ban         │   100    │   100    │ ✅ FULL      │
│ Oakley          │    50    │    48    │ ⚠️  SHORT -2 │
│ Prada           │    75    │    75    │ ✅ FULL      │
└─────────────────────────────────────────────────────┘
```

**Action Buttons by Status:**

- EXPECTED: [Update Status] [View Details]
- FULLY_RECEIVED: [View Receipt] [Print Label]
- PARTIALLY_RECEIVED: [Investigate] [Contact Retailer] [View Receipt]

---

### Test 9: Test Shortage Scenario (Detailed)

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

## 🚀 Frontend Integration Guide

### TypeScript Types for API Responses

```typescript
// Shipment Status Enum (Match backend exactly)
enum ShipmentStatus {
  EXPECTED = "EXPECTED",
  IN_TRANSIT = "IN_TRANSIT",
  PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
  FULLY_RECEIVED = "FULLY_RECEIVED",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

interface IncomingShipment {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    barcode: string;
    company: { name: string };
  };
  expectedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  status: ShipmentStatus;
  distributionDate: string;
  actualDeliveryDate: string | null;
  retailer: {
    id: number;
    name: string;
    companyName: string;
  };
  stockReceipt: {
    id: number;
    receivedQuantity: number;
    verifiedQuantity: number;
    status: string;
  } | null;
  discrepancyReason: string | null;
  notes: string;
  createdAt: string;
}

interface ListShipmentsResponse {
  message: string;
  shipments: IncomingShipment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevious: boolean;
  };
  summary: {
    total: number;
    expected: number;
    inTransit: number;
    partiallyReceived: number;
    fullyReceived: number;
    overdue: number;
    cancelled: number;
  };
}

interface UpdateShipmentRequest {
  status: ShipmentStatus;
  receivedQuantity?: number;
  discrepancyQuantity?: number;
  discrepancyReason?: string;
  actualDeliveryDate?: string;
  notes?: string;
}
```

### Component Structure Example

```typescript
// IncomingShipmentsPage.tsx
import { useEffect, useState } from "react";
import { IncomingShipment, ShipmentStatus } from "./types";

export function IncomingShipmentsPage() {
  const [shipments, setShipments] = useState<IncomingShipment[]>([]);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus>(
    ShipmentStatus.EXPECTED
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/shop-admin/stock/incoming-shipments?status=${statusFilter}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      const data = await response.json();
      setShipments(data.shipments);
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="incoming-shipments">
      <h1>Incoming Shipments</h1>

      {/* Status Filter */}
      <select
        onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus)}
      >
        <option value={ShipmentStatus.EXPECTED}>Expected</option>
        <option value={ShipmentStatus.IN_TRANSIT}>In Transit</option>
        <option value={ShipmentStatus.PARTIALLY_RECEIVED}>
          Partially Received
        </option>
        <option value={ShipmentStatus.FULLY_RECEIVED}>Fully Received</option>
      </select>

      {/* Summary Card */}
      <ShipmentSummaryCard shipments={shipments} />

      {/* Shipments List */}
      <ShipmentsList
        shipments={shipments}
        loading={loading}
        onStatusUpdate={fetchShipments}
      />
    </div>
  );
}

// ShipmentRow.tsx
function ShipmentRow({ shipment }: { shipment: IncomingShipment }) {
  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.FULLY_RECEIVED:
        return "green";
      case ShipmentStatus.PARTIALLY_RECEIVED:
        return "orange";
      case ShipmentStatus.EXPECTED:
      case ShipmentStatus.IN_TRANSIT:
        return "blue";
      case ShipmentStatus.OVERDUE:
      case ShipmentStatus.CANCELLED:
        return "red";
    }
  };

  const discrepancyText =
    shipment.discrepancyQuantity === 0
      ? "Match"
      : `${shipment.discrepancyQuantity > 0 ? "+" : ""}${
          shipment.discrepancyQuantity
        }`;

  return (
    <tr>
      <td>{shipment.product.name}</td>
      <td>{shipment.product.sku}</td>
      <td>{shipment.expectedQuantity}</td>
      <td>{shipment.receivedQuantity}</td>
      <td className={`discrepancy-${discrepancyText}`}>{discrepancyText}</td>
      <td>
        <StatusBadge
          status={shipment.status}
          color={getStatusColor(shipment.status)}
        />
      </td>
      <td>
        <button onClick={() => viewDetails(shipment.id)}>View</button>
        {shipment.status === ShipmentStatus.EXPECTED && (
          <button onClick={() => updateStatus(shipment.id)}>Update</button>
        )}
      </td>
    </tr>
  );
}
```

### API Call Examples

```typescript
// Fetch incoming shipments with filtering
async function getIncomingShipments(page: number = 1, status?: ShipmentStatus) {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", "10");
  if (status) params.append("status", status);

  const response = await fetch(
    `/shop-admin/stock/incoming-shipments?${params}`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    }
  );
  return response.json();
}

// Update single shipment status
async function updateShipmentStatus(
  shipmentId: number,
  update: UpdateShipmentRequest
) {
  const response = await fetch(
    `/shop-admin/stock/incoming-shipments/${shipmentId}/receive`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    }
  );
  return response.json();
}

// Get shipment details
async function getShipmentDetails(shipmentId: number) {
  const response = await fetch(
    `/shop-admin/stock/incoming-shipments/${shipmentId}`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    }
  );
  return response.json();
}
```

---

## 🎓 Learning Resources

1. Run database migration
2. Test bulk distribution endpoint
3. Verify IncomingShipment creation
4. Test shop admin endpoints
5. Create frontend components for viewing shipments
6. Build dashboard widget
7. Set up alerts for overdue/discrepancy shipments
