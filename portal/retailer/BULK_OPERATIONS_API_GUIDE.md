# Retailer Portal - Bulk Operations API Guide

## 🎯 Overview

Complete bulk operations system for retailers to:

- ✅ Upload multiple products in JSON format
- ✅ Export products to JSON
- ✅ Bulk update inventory (price, quantity, stock levels)
- ✅ Bulk distribute products to shops
- ✅ Download upload templates

**Base URL:** `http://localhost:8080/retailer`

---

## 📋 BULK OPERATIONS ENDPOINTS (5)

### 1. Get Upload Template

Download a template JSON file to use for bulk uploads.

**GET** `/bulk/template`

**Headers:** `Authorization: Bearer <token>`

**Description:** Returns a sample JSON structure showing the required format for bulk uploading products.

**Response (200):**

```json
[
  {
    "sku": "RB-AV-001",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with metal frame",
    "companyName": "Ray-Ban",
    "companyDescription": "Premium eyewear brand",
    "eyewearType": "SUNGLASSES",
    "frameType": "FULL_RIM",
    "material": "Metal",
    "color": "Gold",
    "size": "Medium",
    "model": "RB3025",
    "barcode": "1234567890123",
    "basePrice": 200.0,
    "sellingPrice": 250.0,
    "quantity": 50,
    "minStockLevel": 10,
    "maxStockLevel": 100
  },
  {
    "sku": "OAK-HB-001",
    "name": "Oakley Holbrook",
    "description": "Lifestyle sunglasses with Prizm lens technology",
    "companyName": "Oakley",
    "companyDescription": "Sports eyewear brand",
    "eyewearType": "SUNGLASSES",
    "frameType": "FULL_RIM",
    "material": "Plastic",
    "color": "Matte Black",
    "size": "Large",
    "model": "OO9102",
    "barcode": "9876543210987",
    "basePrice": 180.0,
    "sellingPrice": 220.0,
    "quantity": 75,
    "minStockLevel": 15,
    "maxStockLevel": 150
  }
]
```

**File Headers:** `Content-Disposition: attachment; filename=bulk-upload-template.json`

---

### 2. Bulk Upload Products

Upload multiple products at once (maximum 1000 per request).

**POST** `/bulk/products/upload`

**Headers:** `Authorization: Bearer <token>` | `Content-Type: application/json`

**Request Body:**

```json
{
  "products": [
    {
      "sku": "RB-AV-001",
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses with metal frame",
      "companyName": "Ray-Ban",
      "companyDescription": "Premium eyewear brand",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Metal",
      "color": "Gold",
      "size": "Medium",
      "model": "RB3025",
      "barcode": "1234567890123",
      "basePrice": 200.0,
      "sellingPrice": 250.0,
      "quantity": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100
    },
    {
      "sku": "OAK-HB-001",
      "name": "Oakley Holbrook",
      "description": "Lifestyle sunglasses with Prizm lens technology",
      "companyName": "Oakley",
      "companyDescription": "Sports eyewear brand",
      "eyewearType": "SUNGLASSES",
      "frameType": "FULL_RIM",
      "material": "Plastic",
      "color": "Matte Black",
      "size": "Large",
      "model": "OO9102",
      "barcode": "9876543210987",
      "basePrice": 180.0,
      "sellingPrice": 220.0,
      "quantity": 75,
      "minStockLevel": 15,
      "maxStockLevel": 150
    },
    {
      "sku": "LEN-STD-001",
      "name": "Standard Optical Lens",
      "description": "Standard clear optical lens for glasses",
      "companyName": "Vision Optics",
      "companyDescription": "Lens manufacturer",
      "eyewearType": "LENSES",
      "frameType": null,
      "material": "Polycarbonate",
      "color": "Clear",
      "size": null,
      "model": "STD-50",
      "barcode": "5555555555555",
      "basePrice": 50.0,
      "sellingPrice": 65.0,
      "quantity": 200,
      "minStockLevel": 50,
      "maxStockLevel": 300
    }
  ]
}
```

**Response (201):**

```json
{
  "message": "Bulk upload completed: 3 successful, 0 failed",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "products": [
    {
      "id": 1,
      "name": "Ray-Ban Aviator Classic",
      "sku": "RB-AV-001",
      "company": "Ray-Ban",
      "quantity": 50,
      "sellingPrice": 250.0
    },
    {
      "id": 2,
      "name": "Oakley Holbrook",
      "sku": "OAK-HB-001",
      "company": "Oakley",
      "quantity": 75,
      "sellingPrice": 220.0
    },
    {
      "id": 3,
      "name": "Standard Optical Lens",
      "sku": "LEN-STD-001",
      "company": "Vision Optics",
      "quantity": 200,
      "sellingPrice": 65.0
    }
  ],
  "errors": [],
  "hasMoreProducts": false,
  "hasMoreErrors": false
}
```

**Error Handling (with failed items):**

```json
{
  "message": "Bulk upload completed: 2 successful, 1 failed",
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "products": [
    {
      "id": 1,
      "name": "Ray-Ban Aviator Classic",
      "sku": "RB-AV-001",
      "company": "Ray-Ban",
      "quantity": 50,
      "sellingPrice": 250.0
    },
    {
      "id": 2,
      "name": "Oakley Holbrook",
      "sku": "OAK-HB-001",
      "company": "Oakley",
      "quantity": 75,
      "sellingPrice": 220.0
    }
  ],
  "errors": [
    {
      "row": 3,
      "product": "Standard Optical Lens",
      "errors": ["Invalid eyewear type. Must be GLASSES, SUNGLASSES, or LENSES"]
    }
  ],
  "hasMoreProducts": false,
  "hasMoreErrors": false
}
```

**Validation Errors (400):**

```json
{
  "error": "Products array is required and must not be empty"
}
```

```json
{
  "error": "Maximum 1000 products can be uploaded at once"
}
```

---

### 3. Bulk Update Inventory

Update stock levels, prices, and stock thresholds for multiple products.

**POST** `/bulk/inventory/update`

**Headers:** `Authorization: Bearer <token>` | `Content-Type: application/json`

**Request Body:**

```json
{
  "updates": [
    {
      "sku": "RB-AV-001",
      "quantity": 35,
      "sellingPrice": 260.0,
      "minStockLevel": 15,
      "maxStockLevel": 120
    },
    {
      "sku": "OAK-HB-001",
      "quantity": 60,
      "sellingPrice": 230.0,
      "minStockLevel": 20,
      "maxStockLevel": 160
    },
    {
      "sku": "LEN-STD-001",
      "quantity": 150,
      "sellingPrice": 70.0
    }
  ]
}
```

**Response (200):**

```json
{
  "message": "Bulk inventory update completed: 3 successful, 0 failed",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "errors": []
}
```

**Error Response (with failures):**

```json
{
  "message": "Bulk inventory update completed: 2 successful, 1 failed",
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "errors": [
    {
      "row": 1,
      "sku": "INVALID-SKU",
      "error": "Product not found in retailer inventory"
    }
  ]
}
```

---

### 4. Bulk Distribute to Shops

Distribute multiple products to multiple shops in one request.

**POST** `/bulk/distributions/create`

**Headers:** `Authorization: Bearer <token>` | `Content-Type: application/json`

**Request Body:**

```json
{
  "distributions": [
    {
      "retailerShopId": 1,
      "productId": 1,
      "quantity": 10,
      "unitPrice": 250.0,
      "totalPrice": 2500.0
    },
    {
      "retailerShopId": 1,
      "productId": 2,
      "quantity": 15,
      "unitPrice": 220.0,
      "totalPrice": 3300.0
    },
    {
      "retailerShopId": 2,
      "productId": 1,
      "quantity": 20,
      "unitPrice": 250.0,
      "totalPrice": 5000.0
    },
    {
      "retailerShopId": 2,
      "productId": 3,
      "quantity": 50,
      "unitPrice": 65.0,
      "totalPrice": 3250.0
    }
  ]
}
```

**Response (201):**

```json
{
  "message": "Bulk distribution completed: 4 successful, 0 failed",
  "summary": {
    "total": 4,
    "successful": 4,
    "failed": 0
  },
  "distributions": [
    {
      "distributionId": 1,
      "shopId": 1,
      "productId": 1,
      "quantity": 10,
      "status": "PENDING"
    },
    {
      "distributionId": 2,
      "shopId": 1,
      "productId": 2,
      "quantity": 15,
      "status": "PENDING"
    },
    {
      "distributionId": 3,
      "shopId": 2,
      "productId": 1,
      "quantity": 20,
      "status": "PENDING"
    },
    {
      "distributionId": 4,
      "shopId": 2,
      "productId": 3,
      "quantity": 50,
      "status": "PENDING"
    }
  ],
  "errors": []
}
```

**Error Response (with failures):**

```json
{
  "message": "Bulk distribution completed: 3 successful, 1 failed",
  "summary": {
    "total": 4,
    "successful": 3,
    "failed": 1
  },
  "distributions": [
    {
      "distributionId": 1,
      "shopId": 1,
      "productId": 1,
      "quantity": 10,
      "status": "PENDING"
    },
    {
      "distributionId": 2,
      "shopId": 1,
      "productId": 2,
      "quantity": 15,
      "status": "PENDING"
    },
    {
      "distributionId": 3,
      "shopId": 2,
      "productId": 1,
      "quantity": 20,
      "status": "PENDING"
    }
  ],
  "errors": [
    {
      "row": 4,
      "error": "Insufficient product quantity in retailer inventory"
    }
  ]
}
```

---

### 5. Export Retailer Products

Export all retailer products to JSON format.

**GET** `/bulk/products/export`

**Headers:** `Authorization: Bearer <token>`

**Description:** Returns all products in the retailer's inventory as a JSON file.

**Response (200):** JSON file containing:

```json
[
  {
    "sku": "RB-AV-001",
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with metal frame",
    "companyName": "Ray-Ban",
    "companyDescription": "Premium eyewear brand",
    "eyewearType": "SUNGLASSES",
    "frameType": "FULL_RIM",
    "material": "Metal",
    "color": "Gold",
    "size": "Medium",
    "model": "RB3025",
    "barcode": "1234567890123",
    "basePrice": 200.0,
    "sellingPrice": 260.0,
    "quantity": 35,
    "minStockLevel": 15,
    "maxStockLevel": 120,
    "lastUpdated": "2025-11-17T10:30:00.000Z"
  },
  {
    "sku": "OAK-HB-001",
    "name": "Oakley Holbrook",
    "description": "Lifestyle sunglasses with Prizm lens technology",
    "companyName": "Oakley",
    "companyDescription": "Sports eyewear brand",
    "eyewearType": "SUNGLASSES",
    "frameType": "FULL_RIM",
    "material": "Plastic",
    "color": "Matte Black",
    "size": "Large",
    "model": "OO9102",
    "barcode": "9876543210987",
    "basePrice": 180.0,
    "sellingPrice": 230.0,
    "quantity": 60,
    "minStockLevel": 20,
    "maxStockLevel": 160,
    "lastUpdated": "2025-11-17T10:30:00.000Z"
  }
]
```

**File Headers:** `Content-Disposition: attachment; filename="retailer-products-<timestamp>.json"`

---

## 📊 COMPLETE WORKFLOW EXAMPLE

### Step 1: Get Template

```bash
curl -X GET http://localhost:8080/retailer/bulk/template \
  -H "Authorization: Bearer <token>" \
  -o template.json
```

### Step 2: Edit Template with Your Products

Edit `template.json` with your products data.

### Step 3: Bulk Upload

```bash
curl -X POST http://localhost:8080/retailer/bulk/products/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @bulk-products.json
```

### Step 4: Verify Upload (Export)

```bash
curl -X GET http://localhost:8080/retailer/bulk/products/export \
  -H "Authorization: Bearer <token>" \
  -o my-products.json
```

### Step 5: Bulk Distribute to Shops

```bash
curl -X POST http://localhost:8080/retailer/bulk/distributions/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @distributions.json
```

---

## 🔍 FIELD REFERENCE

### Product Fields

| Field              | Type   | Required | Description                                               |
| ------------------ | ------ | -------- | --------------------------------------------------------- |
| sku                | String | ✅       | Unique product identifier                                 |
| name               | String | ✅       | Product name                                              |
| description        | String | ❌       | Product description                                       |
| companyName        | String | ✅       | Brand/manufacturer name                                   |
| companyDescription | String | ❌       | Company description                                       |
| eyewearType        | String | ✅       | GLASSES, SUNGLASSES, or LENSES                            |
| frameType          | String | ✅\*     | FULL_RIM, HALF_RIM, or RIMLESS (\*for glasses/sunglasses) |
| material           | String | ❌       | Frame/lens material (Metal, Plastic, etc.)                |
| color              | String | ❌       | Product color                                             |
| size               | String | ❌       | Size (Small, Medium, Large)                               |
| model              | String | ❌       | Model number                                              |
| barcode            | String | ❌       | Product barcode (EAN/UPC)                                 |
| basePrice          | Number | ✅       | Cost price                                                |
| sellingPrice       | Number | ❌       | Retail price (defaults to basePrice)                      |
| quantity           | Number | ❌       | Initial stock quantity                                    |
| minStockLevel      | Number | ❌       | Minimum stock alert level (default: 10)                   |
| maxStockLevel      | Number | ❌       | Maximum stock level (default: 100)                        |

### Eyewear Type Reference

- **GLASSES**: Prescription eyeglasses, reading glasses, etc.
- **SUNGLASSES**: Sun protection eyewear
- **LENSES**: Replacement/bare lenses

### Frame Type Reference

- **FULL_RIM**: Complete frame around lens
- **HALF_RIM**: Frame on top half only
- **RIMLESS**: No frame, held by screws only

---

## ⚠️ ERROR MESSAGES & SOLUTIONS

### "Maximum 1000 products can be uploaded at once"

Split your upload into multiple requests with 1000 products max each.

### "SKU is required and must be a string"

Every product must have a unique SKU. Cannot be blank or number only.

### "Invalid eyewear type"

Use only: GLASSES, SUNGLASSES, or LENSES (case-insensitive).

### "Frame type is required for glasses and sunglasses"

Glasses and sunglasses must have a frame type. Lenses don't need one.

### "Insufficient product quantity in retailer inventory"

The distribution quantity exceeds available stock. Check inventory levels first.

### "Shop not found or does not belong to retailer"

The retailerShopId doesn't exist or belongs to a different retailer.

---

## 🔐 AUTHENTICATION

All endpoints require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get token by logging in:

```
POST /auth/login
```

---

## 💡 BEST PRACTICES

1. **Use Templates**: Always download the template before creating bulk uploads
2. **Validate Data**: Check your JSON file for syntax errors before uploading
3. **Small Batches**: Upload in batches of 100-500 for better error tracking
4. **Export Regularly**: Export your products periodically as backup
5. **Check Inventory**: Verify stock levels before bulk distribution
6. **Review Errors**: Always check the errors array for failed items
7. **Unique SKUs**: Ensure all SKUs are unique across your inventory

---

## 📝 NOTES

- Products with duplicate SKUs from same company are skipped
- Companies are automatically created if they don't exist
- Selling price defaults to base price if not provided
- Distribution automatically reduces retailer inventory
- All timestamps are in UTC (ISO 8601 format)
- Maximum response shows first 50 products and 20 errors
