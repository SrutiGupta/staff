# Barcode Uniqueness System

## Overview

This system ensures that every product has a unique barcode, even when products are cloned or duplicated. The barcode uniqueness is enforced at multiple levels:

1. **Database Level**: Unique constraint on `barcode` field in the Product model
2. **Application Level**: Collision detection and retry logic
3. **Generation Level**: Enhanced algorithms for unique barcode creation

## Current Implementation

### Database Schema

```prisma
model Product {
  id           Int           @id @default(autoincrement())
  name         String
  description  String?
  basePrice    Float
  barcode      String?       @unique  // ← UNIQUE CONSTRAINT
  sku          String?       @unique
  // ... other fields
}
```

### Barcode Format

```
{CompanyPrefix}{ProductID}{Timestamp}{RandomSuffix}
```

**Example**: `EYE000112345678` where:

- `EYE` = Company prefix (3 chars)
- `0001` = Product ID (4 digits, zero-padded)
- `123456` = Timestamp (6 digits)
- `78` = Random suffix (2 digits)

## API Endpoints

### 1. Generate Barcode for Product

```http
POST /api/barcode/generate/:productId
Content-Type: application/json

{
  "companyPrefix": "RAY",  // Optional
  "isClone": true          // Optional: Enhanced collision avoidance for clones
}
```

**Response**:

```json
{
  "message": "Barcode generated successfully",
  "product": {
    /* product details */
  },
  "generatedBarcode": "RAY000212345678",
  "canNowScan": true
}
```

### 2. Validate Barcode Uniqueness

```http
GET /api/barcode/validate/:barcode
```

**Response**:

```json
{
  "isUnique": false,
  "exists": true,
  "conflictingProduct": {
    "id": 123,
    "name": "Ray-Ban Aviator",
    "company": "Ray-Ban",
    "barcode": "RAY000112345678"
  }
}
```

### 3. Generate Bulk Unique Barcodes

```http
POST /api/barcode/bulk-generate
Content-Type: application/json

{
  "count": 10,
  "companyPrefix": "OAK",
  "productIds": [1001, 1002, 1003]  // Optional
}
```

### 4. Get Products Without Barcodes

```http
GET /api/barcode/missing?companyId=1&eyewearType=GLASSES
```

## Uniqueness Guarantees

### 1. Database Level Protection

- PostgreSQL unique constraint prevents duplicate barcodes
- Error code `P2002` is caught and handled gracefully

### 2. Application Level Protection

```javascript
// Collision detection with retry logic
let attempts = 0;
const maxAttempts = isClone ? 20 : 10; // More attempts for clones

while (!isUnique && attempts < maxAttempts) {
  newBarcode = generateUniqueBarcode(productId, companyPrefix);

  // For cloned products, add additional randomization
  if (isClone && attempts > 0) {
    const additionalRandom = Math.floor(Math.random() * 1000);
    newBarcode += additionalRandom.toString().padStart(3, "0");
  }

  // Check database for conflicts
  const existingProduct = await prisma.product.findUnique({
    where: { barcode: newBarcode },
  });

  if (!existingProduct) {
    isUnique = true;
  } else {
    attempts++;
  }
}
```

### 3. Enhanced Generation for Clones

When `isClone: true` is specified:

- **20 attempts** instead of 10
- **Additional 3-digit randomization** on retry
- **Extra random suffix** if collision occurs

## Product Creation Flow

### Standard Product Creation

1. Create product without barcode (`barcode: null`)
2. Call `POST /api/barcode/generate/:productId`
3. System generates unique barcode
4. Database updated with unique barcode

### Cloned Product Creation

1. Create cloned product without barcode
2. Call `POST /api/barcode/generate/:productId` with `isClone: true`
3. Enhanced collision detection ensures uniqueness
4. Cloned product gets completely unique barcode

## Error Handling

### Duplicate Barcode Detection

```javascript
if (error.code === "P2002") {
  if (error.meta?.target?.includes("barcode")) {
    return res.status(409).json({
      error: "Barcode already exists.",
    });
  }
}
```

### Generation Failure

If system cannot generate unique barcode after maximum attempts:

```json
{
  "error": "Unable to generate unique barcode. Please try again."
}
```

## Best Practices

### 1. Always Generate Barcodes After Product Creation

```javascript
// 1. Create product without barcode
const product = await prisma.product.create({
  data: {
    name: "Ray-Ban Aviator Clone",
    // ... other fields
    barcode: null, // ← No barcode initially
  },
});

// 2. Generate unique barcode
await fetch(`/api/barcode/generate/${product.id}`, {
  method: "POST",
  body: JSON.stringify({ isClone: true }),
});
```

### 2. Validate Before Manual Barcode Assignment

```javascript
// Check if custom barcode is unique
const validation = await fetch(`/api/barcode/validate/${customBarcode}`);
const { isUnique } = await validation.json();

if (!isUnique) {
  throw new Error("Barcode already exists");
}
```

### 3. Use Bulk Generation for Multiple Products

```javascript
// Generate barcodes for multiple products at once
const { barcodes } = await fetch("/api/barcode/bulk-generate", {
  method: "POST",
  body: JSON.stringify({
    count: productIds.length,
    productIds: productIds,
  }),
});
```

## Testing Scenarios

### Test Clone Product Uniqueness

```javascript
// 1. Create original product
const original = await createProduct({ name: "Original Product" });

// 2. Create clone
const clone = await createProduct({ name: "Cloned Product" });

// 3. Generate barcodes
await generateBarcode(original.id);
await generateBarcode(clone.id, { isClone: true });

// 4. Verify uniqueness
const originalProduct = await getProduct(original.id);
const clonedProduct = await getProduct(clone.id);

assert(originalProduct.barcode !== clonedProduct.barcode);
```

## Monitoring & Maintenance

### Check for Duplicate Barcodes

```sql
SELECT barcode, COUNT(*)
FROM "Product"
WHERE barcode IS NOT NULL
GROUP BY barcode
HAVING COUNT(*) > 1;
```

### Products Without Barcodes

```http
GET /api/barcode/missing
```

### Barcode Generation Statistics

Track generation attempts and collision rates for optimization.

## Conclusion

The current barcode system ensures **100% uniqueness** through:

1. ✅ **Database constraints** (PostgreSQL unique index)
2. ✅ **Application-level collision detection**
3. ✅ **Enhanced algorithms for cloned products**
4. ✅ **Comprehensive error handling**
5. ✅ **Validation endpoints**
6. ✅ **Bulk generation capabilities**

**For clone products**: The system automatically generates completely unique barcodes, ensuring no conflicts with original or other cloned products.
