# Schema vs Controller Analysis - Production Ready Fixes

**Date:** October 31, 2025
**Status:** Analysis Complete - Ready for Fixes

---

## 📋 Schema Overview

### Key Models to Verify

1. **Invoice** - Main transaction record with customer/patient
2. **InvoiceItem** - Line items in invoice
3. **Patient** - Customer patient records with tracking
4. **Transaction** - Payment records
5. **Prescription** - Eye power data
6. **StockReceipt** - Stock receiving workflow
7. **StockMovement** - Inventory tracking
8. **ShopInventory** - Shop stock levels
9. **Staff** - Employee records with shop isolation

---

## 🔴 CRITICAL ISSUES FOUND

### Issue 1: Reporting Controller - Missing Shop Filter

**File:** `controllers/reportingController.js` - Line 88
**Method:** `getSalesByPriceTier()`

**Problem:**

```javascript
const items = await prisma.invoiceItem.findMany({
  where: {
    invoice: {
      createdAt: dateFilter,
      // ❌ MISSING: staff: { shopId: req.user.shopId }
    },
  },
```

**Impact:** 🚨 SECURITY CRITICAL

- Can see invoice items from OTHER shops
- Multi-tenant data leak
- Non-compliant with PCI-DSS

**Fix Required:**

```javascript
const items = await prisma.invoiceItem.findMany({
  where: {
    invoice: {
      createdAt: dateFilter,
      staff: { shopId: req.user.shopId }, // ✅ ADD THIS
    },
  },
```

---

### Issue 2: Patient Controller - Not Using isActive and lastVisit Fields

**File:** `controllers/patientController.js`

**Problem:**
Schema defines two important fields that are NOT being used:

```prisma
model Patient {
  isActive       Boolean        @default(true)  // ❌ NOT USED
  lastVisit      DateTime?                      // ❌ NOT USED
  royalty        Royalty?                       // ❌ NOT USED
  giftCards      GiftCard[]                     // ❌ NOT USED
}
```

**Current Implementation (Line 6-20):**

```javascript
const patient = await prisma.patient.create({
  data: {
    name,
    age,
    gender,
    phone,
    address,
    medicalHistory,
    shopId: req.user.shopId,
    // ❌ Missing: isActive, lastVisit fields
  },
});
```

**Impact:**

- Cannot deactivate patients
- No tracking of last visit date
- Royalty points not connected
- Gift cards not visible in patient profile

---

### Issue 3: Payment Controller - paidAmount Calculation Wrong

**File:** `controllers/paymentController.js` - Line 30-35

**Problem:**

```javascript
const amountDue = invoice.totalAmount - invoice.paidAmount;
```

**Issue:** The schema defines:

```prisma
model Invoice {
  paidAmount     Float         @default(0)  // Stored in DB but might be stale
}

model Transaction {
  id            Int
  invoice       Invoice   @relation(...)
  invoiceId     String
  amount        Float     // ✅ SINGLE SOURCE OF TRUTH
}
```

**Current Problem:**

- Invoice.paidAmount is updated after each payment
- But should be calculated from transactions table
- Could drift if updates fail

**Fix Required:**

```javascript
// Calculate actual paid amount from transactions
const transactions = await prisma.transaction.findMany({
  where: { invoiceId },
});
const actualPaidAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
const amountDue = invoice.totalAmount - actualPaidAmount;
```

---

### Issue 4: Invoice Controller - Not Using StockMovement Table

**File:** `controllers/invoiceController.js` - Line 167-176

**Problem:**
When creating invoice and updating inventory, NOT creating a StockMovement record:

**Current Code:**

```javascript
for (const item of items) {
  await prisma.shopInventory.updateMany({
    where: {
      productId: item.productId,
      shopId: req.user.shopId,
    },
    data: {
      quantity: { decrement: item.quantity },
    },
  });
  // ❌ NOT CREATING StockMovement record
}
```

**Impact:**

- No audit trail for inventory
- Cannot trace which invoice caused stock reduction
- Violates audit compliance requirements
- Cannot generate accurate stock movement reports

**Schema Requirement:**

```prisma
model StockMovement {
  type              MovementType  // STOCK_OUT for sales
  quantity          Int
  previousQty       Int
  newQty            Int
  invoiceId         String?       // Link to sale invoice
  staffId           Int?
}
```

---

### Issue 5: Prescription Controller - Not Validating Shop Isolation

**File:** `controllers/prescriptionController.js` - Line 84

\*\*Problem in `getAllPrescriptions()`:

```javascript
const where = {
  patient: {
    shopId: req.user.shopId,
  },
};

// Later (line 97):
if (patientId) {
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(patientId) },
  });

  if (!patient || patient.shopId !== req.user.shopId) {
    return res
      .status(403)
      .json({ error: "Access denied. Patient belongs to different shop." });
  }
  where.patientId = parseInt(patientId);
}
```

**Current Issue:**
✅ This is actually correct! Shop isolation is enforced properly.

---

### Issue 6: Stock Receipt Controller - Missing ShopAdmin Endpoints

**File:** `controllers/stockReceiptController.js`

**Problem:**
Stock receipt workflow is incomplete. Missing the APPROVAL workflow:

**Current Implementation:**

- ✅ Staff can CREATE receipts (PENDING)
- ❌ NO admin approval endpoint
- ❌ NO rejection endpoint
- ❌ NO completion endpoint
- ❌ NOT creating StockMovement when approved

**Schema Requirement:**

```prisma
model StockReceipt {
  status            ReceiptStatus   // PENDING → APPROVED → COMPLETED
  verifiedByAdminId Int?
  verifiedByAdmin   ShopAdmin?
  verifiedAt        DateTime?
  adminNotes        String?
}
```

**Missing Endpoints:**

1. Admin approval (PENDING → APPROVED)
2. Admin rejection (PENDING → REJECTED)
3. Staff stock-in (APPROVED → COMPLETED + creates StockMovement)

---

## 🟡 MEDIUM PRIORITY ISSUES

### Issue 7: Reporting Controller - Not Using Report Table

**File:** `controllers/reportingController.js`

**Problem:**
Report generation doesn't save to Report table for auditing.

**Schema Has:**

```prisma
model Report {
  id          Int
  adminId     Int
  reportType  ReportType
  data        Json
  generatedAt DateTime
}
```

**Current:** Reports are only returned in response, not persisted.

---

### Issue 8: Invoice Controller - Not Recording Staff Transaction Context

**File:** `controllers/invoiceController.js`

**Problem:**
StaffId should be recorded in StockMovement when updating inventory.

**Schema Allows:**

```prisma
model StockMovement {
  staffId     Int?
  staff       Staff? @relation(...)
}
```

**Current:** StockMovement not created at all (Issue #4)

---

## 🟢 WHAT'S WORKING CORRECTLY

✅ **Invoice Controller** (Line 35-50):

- Proper patient/customer shop isolation
- Correct use of shopId from req.user

✅ **Patient Controller** (Line 30-50):

- Proper shop filter in queries
- Correct use of req.user.shopId

✅ **Prescription Controller** (Line 82-105):

- Proper shop isolation enforcement
- Good validation of patient ownership

✅ **Payment Controller** (Line 13-32):

- Proper shop verification via staff
- Good invoice status handling

✅ **Stock Receipt Controller** (Line 75-90):

- Proper shop filtering

---

## 📊 Fix Priority Matrix

| Priority    | Issue                                           | Impact             | Effort |
| ----------- | ----------------------------------------------- | ------------------ | ------ |
| 🚨 CRITICAL | Reporting - Missing shop filter                 | Data leak          | Low    |
| 🔴 HIGH     | Invoice - No StockMovement                      | Audit trail lost   | Medium |
| 🔴 HIGH     | Payment - paidAmount calculation                | Data inconsistency | Low    |
| 🔴 HIGH     | Stock Receipt - No approval workflow            | Incomplete feature | High   |
| 🟡 MEDIUM   | Patient - Not using isActive/lastVisit          | Feature incomplete | Low    |
| 🟡 MEDIUM   | Reporting - Not saving to Report table          | Audit incomplete   | Low    |
| 🟢 LOW      | Stock Receipt - Not recording staff in movement | Nice to have       | Low    |

---

## ✅ FIXES TO APPLY

### Fix 1: Reporting Controller - Add Shop Filter (CRITICAL)

**File:** `controllers/reportingController.js`
**Line:** 88
**Priority:** 🚨 CRITICAL

### Fix 2: Invoice Controller - Create StockMovement Records

**File:** `controllers/invoiceController.js`
**Line:** 167-176
**Priority:** 🔴 HIGH

### Fix 3: Payment Controller - Calculate from Transactions

**File:** `controllers/paymentController.js`
**Line:** 30-35
**Priority:** 🔴 HIGH

### Fix 4: Stock Receipt Controller - Add Admin Approval Endpoints

**File:** `portal/shopadmin/controllers/shopAdminStockController.js`
**Priority:** 🔴 HIGH

### Fix 5: Patient Controller - Use isActive and lastVisit

**File:** `controllers/patientController.js`
**Priority:** 🟡 MEDIUM

---

## 🎯 Implementation Order

1. **FIRST:** Fix reporting shop filter (CRITICAL - data leak)
2. **SECOND:** Add StockMovement creation in invoice (HIGH - audit)
3. **THIRD:** Fix payment calculation (HIGH - accuracy)
4. **FOURTH:** Complete stock receipt workflow (HIGH - feature)
5. **FIFTH:** Enhance patient controller (MEDIUM - features)

---

## 📝 Verification Checklist

After fixes, verify:

- [ ] All invoice queries filter by shop
- [ ] All invoice sales create StockMovement records
- [ ] Payment calculation uses transactions table
- [ ] Stock receipt has full PENDING→APPROVED→COMPLETED workflow
- [ ] Patient can be deactivated and lastVisit tracked
- [ ] Shop admin can approve/reject receipts
- [ ] Reports are saved to Report table
- [ ] All multi-tenant queries include shop isolation
- [ ] No data leaks between shops
