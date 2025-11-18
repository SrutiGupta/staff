# 📦 Incoming Shipment Tracking System

## 🎯 Overview

This feature provides **real-time visibility** into expected stock from bulk distributions. When a retailer performs bulk distribution to a shop, the shop admin is immediately notified of what products and quantities should arrive, allowing them to track and verify against actual receipts.

---

## 🏗️ Architecture

### Database Model: `IncomingShipment`

```prisma
model IncomingShipment {
  id                    Int             @id @default(autoincrement())
  shopId                Int              // Which shop is receiving
  shop                  Shop            @relation(...)
  productId             Int              // What product
  product               Product         @relation(...)

  // Reference to distribution
  shopDistributionId    Int?            // Link to original distribution
  shopDistribution      ShopDistribution? @relation(...)

  // Expected vs Received
  expectedQuantity      Int             // What retailer said would come
  receivedQuantity      Int @default(0)  // What shop actually received
  discrepancyQuantity   Int @default(0)  // Difference (positive = excess, negative = shortage)

  // Status tracking
  status                ShipmentStatus  @default(EXPECTED)

  // Timeline
  distributionDate      DateTime        // When retailer distributed
  expectedDeliveryDate  DateTime?       // Expected arrival
  actualDeliveryDate    DateTime?       // When staff received it

  // Verification
  stockReceiptId        Int?            // Link to stock receipt when received
  stockReceipt          StockReceipt?   @relation(...)

  // Notes
  notes                 String?
  discrepancyReason     String?         // DAMAGED, LOST, SHORT_SHIPMENT, EXCESS, etc

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
}

enum ShipmentStatus {
  EXPECTED              // Just created, waiting for shipment
  IN_TRANSIT            // Marked as shipped by retailer
  PARTIALLY_RECEIVED    // Staff received some items but not all
  FULLY_RECEIVED        // All items received and verified
  OVERDUE               // Past expected delivery date without receipt
  CANCELLED             // Distribution was cancelled
}
```

---

## 🔄 Workflow

### Phase 1: Retailer Bulk Distribution

```
Retailer → Performs Bulk Distribution to Shop
  ↓
Creates ShopDistribution record
  ↓
Automatically creates IncomingShipment record
  ↓
Status: EXPECTED
```

**What happens:**

- In `portal/retailer/controller/bulkProductController.js` → `bulkDistributeToShops()`
- After creating `ShopDistribution`, also creates `IncomingShipment`
- Shop admin can now see expected incoming stock immediately

### Phase 2: Shop Admin Views Expected Stock

```
Shop Admin → GET /shop-admin/stock/incoming-shipments
  ↓
Sees all expected shipments with:
  - Product name & SKU
  - Expected Quantity
  - Status (EXPECTED, IN_TRANSIT, etc)
  - Retailer info
  - Timeline
```

### Phase 3: Staff Creates Stock Receipt

```
Staff → Creates Stock Receipt
  ↓
Indicates received quantity for a product
  ↓
Status: PENDING (waiting admin approval)
```

### Phase 4: Shop Admin Approves Receipt & Links to IncomingShipment

```
Shop Admin → Approves Stock Receipt
  ↓
System automatically:
  1. Updates ShopInventory quantity
  2. Creates StockMovement record
  3. Finds matching IncomingShipment
  4. Updates IncomingShipment with:
     - Received Quantity
     - Discrepancy (if any)
     - Status (FULLY_RECEIVED or PARTIALLY_RECEIVED)
     - Links to StockReceipt
  ↓
Status: FULLY_RECEIVED (if quantities match)
        or PARTIALLY_RECEIVED (if shortage/excess)
```

**Discrepancy Logic:**

```javascript
const discrepancy = receivedQuantity - expectedQuantity;

If discrepancy === 0 → Status: FULLY_RECEIVED ✅
If discrepancy > 0  → Status: FULLY_RECEIVED (EXCESS_ITEMS) ⚠️
If discrepancy < 0  → Status: PARTIALLY_RECEIVED (SHORTAGE) ⚠️
```

---

## 📡 API Endpoints

### 1️⃣ List All Incoming Shipments

```http
GET /shop-admin/stock/incoming-shipments
```

**Query Parameters:**

```
page=1                    // Page number (default: 1)
limit=10                  // Items per page (default: 10)
status=EXPECTED           // Filter by status (optional)
sortBy=distributionDate   // Sort field (default: distributionDate)
sortOrder=desc            // asc or desc (default: desc)
```

**Response:**

```json
{
  "message": "Incoming shipments retrieved successfully",
  "shipments": [
    {
      "id": 1,
      "product": {
        "id": 15,
        "name": "Ray-Ban Aviator",
        "sku": "RB-AV-001",
        "barcode": "123456",
        "company": { "name": "Ray-Ban" }
      },
      "expectedQuantity": 100,
      "receivedQuantity": 0,
      "discrepancyQuantity": 0,
      "status": "EXPECTED",
      "distributionDate": "2025-11-19T10:30:00Z",
      "expectedDeliveryDate": "2025-11-20T00:00:00Z",
      "actualDeliveryDate": null,
      "retailer": {
        "name": "Vision Supplies Ltd",
        "companyName": "Vision Group"
      },
      "stockReceipt": null,
      "discrepancyReason": null,
      "notes": "From retailer bulk distribution",
      "createdAt": "2025-11-19T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "total": 45,
    "expected": 20,
    "inTransit": 5,
    "partiallyReceived": 10,
    "fullyReceived": 8,
    "overdue": 2,
    "cancelled": 0
  }
}
```

---

### 2️⃣ Get Shipment Details

```http
GET /shop-admin/stock/incoming-shipments/:id
```

**Response:**

```json
{
  "message": "Incoming shipment details retrieved successfully",
  "shipment": {
    "id": 1,
    "product": {
      "id": 15,
      "name": "Ray-Ban Aviator Classic",
      "sku": "RB-AV-001",
      "barcode": "123456789",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "color": "Gold",
      "company": { "name": "Ray-Ban" }
    },
    "shop": {
      "id": 1,
      "name": "Downtown Eye Care",
      "address": "123 Main St"
    },
    "retailer": {
      "id": 1,
      "name": "Vision Supplies Ltd",
      "companyName": "Vision Group",
      "email": "contact@visionsupplies.com"
    },
    "expectedQuantity": 100,
    "receivedQuantity": 95,
    "discrepancyQuantity": -5,
    "status": "PARTIALLY_RECEIVED",
    "distributionDate": "2025-11-19T10:30:00Z",
    "expectedDeliveryDate": "2025-11-20T00:00:00Z",
    "actualDeliveryDate": "2025-11-19T15:45:00Z",
    "wholesalePrice": 150.0,
    "mrp": 199.99,
    "stockReceipt": {
      "id": 1,
      "receivedQuantity": 95,
      "verifiedQuantity": 95,
      "status": "APPROVED",
      "receivedByStaff": { "id": 5, "name": "Ahmed" },
      "verifiedByAdmin": { "id": 1, "name": "John Admin" }
    },
    "discrepancyReason": "SHORTAGE",
    "notes": "5 units reported missing during delivery",
    "createdAt": "2025-11-19T10:30:00Z",
    "updatedAt": "2025-11-19T15:45:00Z"
  }
}
```

---

### 3️⃣ Get Expected vs Received Comparison Report

```http
GET /shop-admin/stock/incoming-shipments/summary/comparison
```

**Query Parameters (Optional):**

```
dateFrom=2025-11-01     // Start date (ISO format)
dateTo=2025-11-30       // End date (ISO format)
```

**Response:**

```json
{
  "message": "Shipment comparison retrieved successfully",
  "comparison": {
    "totalExpected": 5000, // Total expected quantity
    "totalReceived": 4850, // Total received quantity
    "totalDiscrepancy": -150, // Shortage (-150 items)
    "shipmentDetails": [
      {
        "id": 1,
        "product": {
          "id": 15,
          "name": "Ray-Ban Aviator",
          "sku": "RB-AV-001"
        },
        "expectedQuantity": 100,
        "receivedQuantity": 95,
        "discrepancyQuantity": -5,
        "status": "PARTIALLY_RECEIVED",
        "discrepancyReason": "SHORTAGE",
        "discrepancyPercent": "-5.00",
        "distributionDate": "2025-11-19T10:30:00Z",
        "actualDeliveryDate": "2025-11-19T15:45:00Z"
      }
    ],
    "discrepancyShipments": [
      {
        "id": 1,
        "product": "Ray-Ban Aviator",
        "sku": "RB-AV-001",
        "expectedQuantity": 100,
        "receivedQuantity": 95,
        "discrepancy": -5,
        "reason": "SHORTAGE"
      }
    ]
  },
  "summary": {
    "totalShipments": 12,
    "fullyReceivedCount": 10,
    "discrepancyCount": 2,
    "accuracyPercent": "83.33"
  }
}
```

---

## 🔗 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ RETAILER PORTAL                                                 │
│ bulkDistributeToShops()                                         │
│ ↓                                                               │
│ ├─ Create ShopDistribution ─┐                                  │
│ └─ Create IncomingShipment ──→ (Status: EXPECTED)              │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ SHOP ADMIN PORTAL                                               │
│ ├─ View Incoming Shipments                                      │
│ ├─ See Expected Stock Immediately                              │
│ ├─ Filter by Status (EXPECTED, IN_TRANSIT, etc)                │
│ └─ Track Each Item                                              │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAFF PORTAL                                                    │
│ createStockReceipt()                                            │
│ (Status: PENDING)                                              │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ SHOP ADMIN PORTAL                                               │
│ approveStockReceipt()                                           │
│ ↓                                                               │
│ ├─ Update ShopInventory ──────┐                                │
│ ├─ Create StockMovement       ├──→ Update IncomingShipment     │
│ └─ Link StockReceipt ─────────┤    ├─ Set receivedQuantity    │
│                               │    ├─ Calculate discrepancy    │
│                               │    ├─ Set Status              │
│                               │    └─ Link StockReceiptId     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### 1. **Immediate Visibility**

- Shop admin knows about incoming stock the moment retailer distributes
- No need to wait for stock receipt creation
- Proactive inventory management

### 2. **Automatic Verification**

- System automatically finds matching IncomingShipment when receipt is approved
- No manual linking needed
- Reduces human error

### 3. **Discrepancy Tracking**

- Automatically detects shortages and excess items
- Tracks reason for discrepancy (DAMAGED, LOST, SHORT_SHIPMENT, EXCESS)
- Generates reports for analysis

### 4. **Complete Audit Trail**

- Links distribution → incoming shipment → stock receipt
- Full traceability from retailer to shop to inventory
- Compliance and accountability

### 5. **Reporting & Analytics**

- Compare expected vs received quantities
- Identify problem retailers/products
- Calculate accuracy metrics
- Time-based filtering for period analysis

---

## 📊 Use Cases

### Case 1: Perfect Receipt

```
Expected: 100 units
Received: 100 units
Discrepancy: 0
Status: FULLY_RECEIVED ✅
```

### Case 2: Shortage

```
Expected: 100 units
Received: 95 units
Discrepancy: -5
Status: PARTIALLY_RECEIVED ⚠️
Reason: SHORTAGE
```

### Case 3: Excess

```
Expected: 100 units
Received: 105 units
Discrepancy: +5
Status: FULLY_RECEIVED ⚠️
Reason: EXCESS_ITEMS
```

### Case 4: Damaged Goods

```
Expected: 100 units
Received: 95 units
Discrepancy: -5
Status: PARTIALLY_RECEIVED ⚠️
Reason: DAMAGED_GOODS
Admin Notes: "3 frames damaged, 2 lenses broken"
```

---

## 🛡️ Security & Validation

✅ **Shop Isolation**: Each shop admin only sees their own incoming shipments
✅ **Relationship Validation**: Ensures IncomingShipment matches StockReceipt's product and quantity
✅ **Status Management**: Only specific transitions allowed (EXPECTED → IN_TRANSIT → RECEIVED)
✅ **Audit Logging**: All changes tracked with timestamps and user info
✅ **Read-Only for Staff**: Staff cannot modify incoming shipment records

---

## 📝 Implementation Notes

### Changes Made:

1. **Prisma Schema** (`prisma/schema.prisma`)

   - Added `IncomingShipment` model
   - Added `ShipmentStatus` enum
   - Updated `Shop`, `Product`, `StockReceipt`, `ShopDistribution` relationships

2. **Retailer Controller** (`portal/retailer/controller/bulkProductController.js`)

   - Updated `bulkDistributeToShops()` to create `IncomingShipment` records
   - Automatic linking to `ShopDistribution`

3. **Shop Admin Controller** (`portal/shopadmin/controllers/shopAdminStockController.js`)

   - Added `listIncomingShipments()` - View all incoming shipments
   - Added `getIncomingShipmentDetails()` - View single shipment details
   - Added `getIncomingShipmentComparison()` - Expected vs received report
   - Updated `approveStockReceipt()` - Auto-update IncomingShipment on approval

4. **Shop Admin Routes** (`portal/shopadmin/routes/shopAdminStockRoutes.js`)
   - Added route: `GET /shop-admin/stock/incoming-shipments`
   - Added route: `GET /shop-admin/stock/incoming-shipments/:id`
   - Added route: `GET /shop-admin/stock/incoming-shipments/summary/comparison`

---

## 🧪 Testing Scenarios

### Scenario 1: Monitor Bulk Distribution

1. Retailer does bulk distribution (100 Ray-Ban Aviators to Shop A)
2. IncomingShipment created automatically (Status: EXPECTED)
3. Shop admin views `/incoming-shipments` - sees 100 items expected
4. Staff receives 100 units and creates stock receipt
5. Admin approves receipt with verified quantity 100
6. IncomingShipment automatically updates to FULLY_RECEIVED

### Scenario 2: Detect Shortage

1. Bulk distribution: 100 units expected
2. Staff receives only 95 units (creates receipt for 95)
3. Admin approves with verified quantity 95
4. IncomingShipment automatically updates:
   - Status: PARTIALLY_RECEIVED
   - discrepancyQuantity: -5
   - discrepancyReason: SHORTAGE
5. Shop admin sees discrepancy in dashboard and can investigate

### Scenario 3: Track Over Time

1. Multiple distributions received during a month
2. Admin runs comparison report with dateFrom & dateTo
3. Report shows:
   - Total expected: 5000 units
   - Total received: 4900 units
   - Accuracy: 98%
   - Problem items: 3 products with shortages

---

## 🚀 Future Enhancements

- [ ] Automated alerts for overdue shipments
- [ ] Estimated delivery date from retailer integration
- [ ] Bulk action to mark shipments as "IN_TRANSIT"
- [ ] Photo evidence upload for discrepancies
- [ ] Communication logs between shop and retailer
- [ ] Historical discrepancy patterns analysis
- [ ] Automatic refund/credit requests for shortages
- [ ] Integration with logistics tracking
- [ ] Dashboard widget showing pending shipments

---

## 📞 Support

For questions or issues, refer to:

- Stock Receipt System Documentation
- Inventory Management API Workflow
- Retailer Portal API Documentation
