# Bulk Upload Inventory Flow Analysis & Fix

## Issue

Shop inventory is being updated when only retailer inventory should be updated during bulk product upload.

## Expected Flow (Retailer Bulk Upload)

### Endpoint

`POST /portal/retailer/bulk/products/upload`

### What SHOULD happen:

1. ✅ **Products** created in `product` table
2. ✅ **RetailerProduct** records created in `retailerProduct` table with stock quantities
3. ❌ **ShopInventory** should NOT be created/updated

### Current Code (bulkProductController.js)

The code at line 165-204 correctly:

- Creates/updates `retailerProduct` only
- Does NOT touch `shopInventory`

```javascript
await tx.retailerProduct.upsert({
  where: {
    retailerId_productId: {
      retailerId,
      productId: product.id,
    },
  },
  update: {
    totalStock: quantity,
    allocatedStock: 0,
    availableStock: quantity,
    mrp: productData.sellingPrice ? parseFloat(productData.sellingPrice) : null,
  },
  create: {
    retailerId,
    productId: product.id,
    wholesalePrice: parseFloat(productData.basePrice),
    mrp: productData.sellingPrice ? parseFloat(productData.sellingPrice) : null,
    totalStock: quantity,
    allocatedStock: 0,
    availableStock: quantity,
  },
});
```

**✅ This is CORRECT**

---

## Separate Flow: Bulk Distribution (Retailer → Shops)

### Endpoint

`POST /portal/retailer/bulk/distributions/create`

### What happens:

1. Creates `ShopDistribution` records (tracks who gets what)
2. Creates `IncomingShipment` records (shop sees what's coming)
3. Shop inventory is NOT updated yet - only when staff receives + admin approves

---

## Separate Flow: Stock-In (Shop Admin/Staff)

### Endpoint

`POST /inventory/stock-in` (main controller)

### What happens:

1. Creates/updates `ShopInventory` records
2. Creates `StockMovement` records for audit
3. Only after stock receipt is approved by admin

**This is where ShopInventory should be created - NOT during bulk upload**

---

## Diagnosis Questions

1. **Are products being created in the `product` table?**

   - Yes → Bulk upload endpoint is running

2. **Are RetailerProduct records being created?**

   - Yes → Bulk upload working correctly

3. **Are ShopInventory records being created?**

   - If YES → Problem exists

4. **Which shop's inventory is being updated?**
   - Check the shopId in ShopInventory records

---

## Potential Issues & Solutions

### Issue A: Frontend calling wrong endpoint

**Symptom:** Shop inventory created when retailer bulk uploads

**Solution:** Verify frontend is calling:

```
POST /portal/retailer/bulk/products/upload
```

Not calling any shop admin endpoints.

### Issue B: Duplicate endpoints

**Check:** Are there two bulk upload endpoints?

```bash
grep -r "bulkUploadProducts\|/bulk.*upload" --include="*.js"
```

### Issue C: Middleware hooking product creation

**Check:** Is there middleware that auto-creates shop inventory when products are created?

```bash
grep -r "shopInventory.create\|shopInventory.upsert" --include="*.js" | grep -v "Stock"
```

### Issue D: Frontend POST body going to wrong controller

**Check:** Frontend might be sending shop data:

```javascript
// WRONG - Don't send this during retailer bulk upload
{
  shopId: 1,
  products: [...]
}

// CORRECT - Retailer bulk upload
{
  products: [...]
}
```

---

## Verification SQL

```sql
-- Check what inventory was created during bulk upload
SELECT * FROM "ShopInventory"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Check retailer inventory (should exist)
SELECT * FROM "RetailerProduct"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Compare products with their inventories
SELECT
  p.id,
  p.name,
  p.sku,
  COUNT(rp.id) as retailer_inventory_count,
  COUNT(si.id) as shop_inventory_count
FROM "Product" p
LEFT JOIN "RetailerProduct" rp ON p.id = rp."productId"
LEFT JOIN "ShopInventory" si ON p.id = si."productId"
WHERE p."createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY p.id, p.name, p.sku;
```

---

## Recommended Actions

1. **Check API logs** - What endpoint is being called?
2. **Check request body** - Are credentials/shopId being sent?
3. **Check database** - Run the SQL queries above
4. **Check console logs** - Look for "Saving inventory" messages during bulk upload
5. **Trace through code** - Add console.log at line 173 in bulkProductController.js

---

## Prevention

### Add validation to prevent shop inventory creation during bulk upload:

```javascript
// In bulkProductController.js - at the start of bulkUploadProducts
if (req.user?.shopId && !req.retailer?.id) {
  return res.status(403).json({
    error:
      "This endpoint is for retailers only. Use shop-admin endpoints for shop inventory.",
  });
}
```

### Add validation to prevent products without retailer assignment:

```javascript
// Ensure product is only added to retailer inventory
if (!retailerId) {
  throw new Error("Invalid retailer context - cannot assign to shop inventory");
}
```
