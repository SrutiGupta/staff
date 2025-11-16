# Retailer Bulk Upload & Distribution Complete Flow

## Production-Ready Frontend Implementation Guide

---

## 🎯 Complete Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RETAILER BULK WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: RETAILER LOGIN                                                     │
│  ↓                                                                           │
│  STEP 2: BULK UPLOAD PRODUCTS (JSON)                                        │
│  ├─ Get Template                                                            │
│  ├─ Edit Products (Multiple companies, types)                              │
│  └─ Upload to Retailer Inventory                                           │
│  ↓                                                                           │
│  STEP 3: VIEW RETAILER INVENTORY                                            │
│  ├─ See all uploaded products                                              │
│  ├─ Check quantities and prices                                            │
│  └─ Export products as backup                                              │
│  ↓                                                                           │
│  STEP 4: DISCOVER AVAILABLE SHOPS                                           │
│  ├─ Search shops by name/location                                          │
│  └─ See shop details (address, contact)                                    │
│  ↓                                                                           │
│  STEP 5: CONNECT WITH SHOPS                                                │
│  ├─ Add shop to retailer network                                           │
│  ├─ Set partnership terms (commission, credit limit)                       │
│  └─ Shop is now connected to retailer                                      │
│  ↓                                                                           │
│  STEP 6: BULK DISTRIBUTE PRODUCTS TO SHOPS                                 │
│  ├─ Create distribution plan (preview mode)                                │
│  ├─ Validate inventory & shop capacity                                     │
│  ├─ Confirm distribution (products transferred)                            │
│  └─ Stock reduces in retailer, increases in shop                           │
│  ↓                                                                           │
│  STEP 7: TRACK DISTRIBUTION                                                │
│  ├─ Monitor delivery status (PENDING → DELIVERED)                          │
│  ├─ Track payment status (PENDING → PAID)                                  │
│  └─ View distribution history                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# DETAILED API FLOW WITH REQUEST/RESPONSE

## STEP 1: RETAILER LOGIN

### 1.1 Login to Retailer Account

**Endpoint:** `POST /retailer/auth/login`

**Request Body:**

```json
{
  "email": "retailer@opticalworld.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "message": "Login successful",
  "retailer": {
    "id": 1,
    "name": "Optical World Retailer",
    "email": "retailer@opticalworld.com",
    "businessType": "WHOLESALE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0..."
}
```

**Frontend Action:** Store token in localStorage/context for all subsequent requests

```javascript
// Frontend code example
const token = response.data.token;
localStorage.setItem("retailerToken", token);

// Use in all API calls
const headers = {
  Authorization: `Bearer ${token}`,
};
```

---

## STEP 2: BULK UPLOAD PRODUCTS

### 2.1 Get Upload Template

**Endpoint:** `GET /retailer/bulk/template`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):** JSON file with template structure

**Frontend Action:**

```javascript
// Fetch template
const response = await fetch("http://localhost:8080/retailer/bulk/template", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const template = await response.json();
console.log(template); // Show to user as example
```

---

### 2.2 Bulk Upload Products from JSON

**Endpoint:** `POST /retailer/bulk/products/upload`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

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
      "description": "Lifestyle sunglasses",
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
      "description": "Clear optical lens for glasses",
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
    },
    {
      "sku": "FRAME-001",
      "name": "Designer Titanium Frame",
      "description": "Premium titanium frame",
      "companyName": "Designer Frames Co",
      "companyDescription": "High-end frame manufacturer",
      "eyewearType": "GLASSES",
      "frameType": "RIMLESS",
      "material": "Titanium",
      "color": "Silver",
      "size": "Medium",
      "model": "TI-PRO-M",
      "barcode": "7777777777777",
      "basePrice": 150.0,
      "sellingPrice": 200.0,
      "quantity": 100,
      "minStockLevel": 20,
      "maxStockLevel": 200
    }
  ]
}
```

**Response (201) - Successful Upload:**

```json
{
  "message": "Bulk upload completed: 4 successful, 0 failed",
  "summary": {
    "total": 4,
    "successful": 4,
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
    },
    {
      "id": 4,
      "name": "Designer Titanium Frame",
      "sku": "FRAME-001",
      "company": "Designer Frames Co",
      "quantity": 100,
      "sellingPrice": 200.0
    }
  ],
  "errors": [],
  "hasMoreProducts": false,
  "hasMoreErrors": false
}
```

**Response (201) - With Some Errors:**

```json
{
  "message": "Bulk upload completed: 3 successful, 1 failed",
  "summary": {
    "total": 4,
    "successful": 3,
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
  "errors": [
    {
      "row": 4,
      "product": "Designer Titanium Frame",
      "errors": ["Invalid eyewear type. Must be GLASSES, SUNGLASSES, or LENSES"]
    }
  ],
  "hasMoreProducts": false,
  "hasMoreErrors": false
}
```

**Frontend Implementation:**

```javascript
const handleBulkUpload = async (productsData) => {
  try {
    const response = await fetch(
      "http://localhost:8080/retailer/bulk/products/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: productsData }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      // Show success message
      console.log(`✅ Uploaded: ${result.summary.successful}`);

      // Show errors if any
      if (result.summary.failed > 0) {
        console.log(`❌ Failed: ${result.summary.failed}`);
        result.errors.forEach((err) => {
          console.error(`Row ${err.row}: ${err.errors.join(", ")}`);
        });
      }

      // Store products in state
      setUploadedProducts(result.products);
      return result.products;
    } else {
      console.error("Upload failed:", result.error);
    }
  } catch (error) {
    console.error("Error uploading products:", error);
  }
};
```

---

## STEP 3: VIEW RETAILER INVENTORY

### 3.1 Get All Retailer Products

**Endpoint:** `GET /retailer/inventory/my-products`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

```
?page=1&limit=20&search=ray
```

**Response (200):**

```json
{
  "products": [
    {
      "id": 1,
      "retailerId": 1,
      "productId": 1,
      "quantity": 50,
      "sellingPrice": 250.0,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "lastUpdated": "2025-11-17T10:30:00.000Z",
      "product": {
        "id": 1,
        "name": "Ray-Ban Aviator Classic",
        "sku": "RB-AV-001",
        "basePrice": 200.0,
        "description": "Classic aviator sunglasses",
        "eyewearType": "SUNGLASSES",
        "frameType": "FULL_RIM",
        "barcode": "1234567890123",
        "company": {
          "id": 1,
          "name": "Ray-Ban"
        }
      }
    },
    {
      "id": 2,
      "retailerId": 1,
      "productId": 2,
      "quantity": 75,
      "sellingPrice": 220.0,
      "minStockLevel": 15,
      "maxStockLevel": 150,
      "lastUpdated": "2025-11-17T10:30:00.000Z",
      "product": {
        "id": 2,
        "name": "Oakley Holbrook",
        "sku": "OAK-HB-001",
        "basePrice": 180.0,
        "description": "Lifestyle sunglasses",
        "eyewearType": "SUNGLASSES",
        "frameType": "FULL_RIM",
        "barcode": "9876543210987",
        "company": {
          "id": 2,
          "name": "Oakley"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

**Frontend Implementation:**

```javascript
const loadRetailerProducts = async () => {
  try {
    const response = await fetch(
      "http://localhost:8080/retailer/inventory/my-products?page=1&limit=20",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setRetailerProducts(data.products);
    setTotalProducts(data.pagination.total);
  } catch (error) {
    console.error("Error loading products:", error);
  }
};
```

---

### 3.2 Export Products as JSON

**Endpoint:** `GET /retailer/bulk/products/export`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):** JSON file download

**Frontend Implementation:**

```javascript
const exportProducts = async () => {
  try {
    const response = await fetch(
      "http://localhost:8080/retailer/bulk/products/export",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    // Create download link
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`
    );
    element.setAttribute("download", `retailer-products-${Date.now()}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (error) {
    console.error("Export failed:", error);
  }
};
```

---

## STEP 4: DISCOVER AVAILABLE SHOPS

### 4.1 Get Available Shops to Connect

**Endpoint:** `GET /retailer/shops/available`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

```
?search=optical&city=Nabadwip&page=1&limit=10
```

**Response (200):**

```json
{
  "shops": [
    {
      "id": 1,
      "name": "Test Optical Shop",
      "address": "456 Shop Street, Nabadwip",
      "city": "Nabadwip",
      "phone": "+1234567891",
      "email": "shop1@opticalworld.com",
      "status": "ACTIVE",
      "connectedRetailers": 2
    },
    {
      "id": 3,
      "name": "Optical World Test Branch",
      "address": "123 Test Street, Test City",
      "city": "Test City",
      "phone": "+1234567890",
      "email": "testbranch@opticalworld.com",
      "status": "ACTIVE",
      "connectedRetailers": 1
    },
    {
      "id": 5,
      "name": "City Eyes Optical",
      "address": "789 Vision Ave, Nabadwip",
      "city": "Nabadwip",
      "phone": "+1234567892",
      "email": "cityeyes@optical.com",
      "status": "ACTIVE",
      "connectedRetailers": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

**Frontend Implementation:**

```javascript
const searchAvailableShops = async (searchTerm) => {
  try {
    const response = await fetch(
      `http://localhost:8080/retailer/shops/available?search=${searchTerm}&page=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setAvailableShops(data.shops);
  } catch (error) {
    console.error("Error searching shops:", error);
  }
};
```

---

## STEP 5: CONNECT WITH SHOPS

### 5.1 Add Shop to Retailer Network

**Endpoint:** `POST /retailer/shops`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "shopId": 3,
  "partnershipType": "FRANCHISE",
  "commissionRate": 20.0,
  "creditLimit": 75000.0,
  "paymentTerms": "NET_15"
}
```

**Response (201):**

```json
{
  "message": "Shop added to network successfully",
  "retailerShop": {
    "id": 2,
    "retailerId": 1,
    "shopId": 3,
    "partnershipType": "FRANCHISE",
    "commissionRate": 20,
    "creditLimit": 75000,
    "paymentTerms": "NET_15",
    "isActive": true,
    "shop": {
      "id": 3,
      "name": "Optical World Test Branch",
      "address": "123 Test Street, Test City",
      "phone": "+1234567890",
      "email": "testbranch@opticalworld.com"
    }
  }
}
```

**Frontend Implementation:**

```javascript
const connectWithShop = async (shopId, terms) => {
  try {
    const response = await fetch("http://localhost:8080/retailer/shops", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shopId,
        partnershipType: terms.type, // FRANCHISE, DEALER, DISTRIBUTOR
        commissionRate: terms.commission,
        creditLimit: terms.creditLimit,
        paymentTerms: terms.paymentTerms, // NET_15, NET_30, NET_45
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Connected with shop: ${result.retailerShop.shop.name}`);
      setConnectedShops([...connectedShops, result.retailerShop]);
      return result.retailerShop;
    }
  } catch (error) {
    console.error("Connection failed:", error);
  }
};
```

---

### 5.2 Get Connected Shops

**Endpoint:** `GET /retailer/shops`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": 1,
    "retailerId": 1,
    "shopId": 4,
    "partnershipType": "DEALER",
    "commissionRate": 15,
    "creditLimit": 50000,
    "paymentTerms": "NET_30",
    "isActive": true,
    "shop": {
      "id": 4,
      "name": "Optical World Test Branch",
      "address": "123 Test Street, Test City",
      "phone": "+1234567890",
      "email": "testbranch@opticalworld.com"
    },
    "stats": {
      "totalDistributions": 5,
      "totalQuantityDistributed": 150,
      "totalAmountDistributed": 25000,
      "pendingPayments": 5000
    }
  },
  {
    "id": 2,
    "retailerId": 1,
    "shopId": 3,
    "partnershipType": "FRANCHISE",
    "commissionRate": 20,
    "creditLimit": 75000,
    "paymentTerms": "NET_15",
    "isActive": true,
    "shop": {
      "id": 3,
      "name": "Test Optical Shop",
      "address": "456 Shop Street",
      "phone": "+1234567891",
      "email": "shop@testoptical.com"
    },
    "stats": {
      "totalDistributions": 3,
      "totalQuantityDistributed": 80,
      "totalAmountDistributed": 15000,
      "pendingPayments": 3000
    }
  }
]
```

**Frontend Implementation:**

```javascript
const loadConnectedShops = async () => {
  try {
    const response = await fetch("http://localhost:8080/retailer/shops", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const shops = await response.json();
    setConnectedShops(shops);
  } catch (error) {
    console.error("Error loading shops:", error);
  }
};
```

---

## STEP 6: BULK DISTRIBUTE PRODUCTS TO SHOPS

### 6.1 Create Distribution Plan (Preview/Validation)

**Endpoint:** `POST /retailer/distributions`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (Planning Mode):**

```json
{
  "retailerShopId": 1,
  "distributions": [
    {
      "retailerProductId": 1,
      "quantity": 10,
      "unitPrice": 250.0
    },
    {
      "retailerProductId": 2,
      "quantity": 15,
      "unitPrice": 220.0
    },
    {
      "retailerProductId": 3,
      "quantity": 20,
      "unitPrice": 65.0
    }
  ],
  "planDistribution": true,
  "notes": "Monthly stock replenishment",
  "paymentDueDate": "2025-12-15T00:00:00Z",
  "deliveryExpectedDate": "2025-12-01T00:00:00Z"
}
```

**Response (200) - Planning Mode (Preview):**

```json
{
  "message": "Distribution plan created successfully",
  "plan": {
    "shop": {
      "id": 1,
      "name": "Optical World Test Branch",
      "address": "456 Retail Ave, Business District"
    },
    "items": [
      {
        "productId": 1,
        "productName": "Ray-Ban Aviator Classic",
        "company": "Ray-Ban",
        "quantity": 10,
        "unitPrice": 250,
        "itemTotal": 2500,
        "availableStock": 50,
        "stockAfterDistribution": 40
      },
      {
        "productId": 2,
        "productName": "Oakley Holbrook",
        "company": "Oakley",
        "quantity": 15,
        "unitPrice": 220,
        "itemTotal": 3300,
        "availableStock": 75,
        "stockAfterDistribution": 60
      },
      {
        "productId": 3,
        "productName": "Standard Optical Lens",
        "company": "Vision Optics",
        "quantity": 20,
        "unitPrice": 65,
        "itemTotal": 1300,
        "availableStock": 200,
        "stockAfterDistribution": 180
      }
    ],
    "totalAmount": 7100,
    "paymentDueDate": "2025-12-15T00:00:00.000Z",
    "deliveryExpectedDate": "2025-12-01T00:00:00.000Z",
    "notes": "Monthly stock replenishment"
  }
}
```

**Frontend Implementation (Planning Mode):**

```javascript
const planDistribution = async (shopId, distributions) => {
  try {
    const response = await fetch(
      "http://localhost:8080/retailer/distributions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          retailerShopId: shopId,
          distributions,
          planDistribution: true,
          notes: "Preview distribution plan",
          paymentDueDate: "2025-12-15T00:00:00Z",
          deliveryExpectedDate: "2025-12-01T00:00:00Z",
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      // Show preview to user
      console.log("📋 Distribution Plan Preview:");
      result.plan.items.forEach((item) => {
        console.log(`
          ✓ ${item.productName}
            Qty: ${item.quantity}
            Unit Price: ${item.unitPrice}
            Total: ${item.itemTotal}
            Current Stock: ${item.availableStock}
            After Distribution: ${item.stockAfterDistribution}
        `);
      });
      console.log(`Total Amount: ${result.plan.totalAmount}`);
      return result.plan;
    }
  } catch (error) {
    console.error("Planning failed:", error);
  }
};
```

---

### 6.2 Confirm & Execute Distribution

**Endpoint:** `POST /retailer/distributions`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (Execute Distribution):**

```json
{
  "retailerShopId": 1,
  "distributions": [
    {
      "retailerProductId": 1,
      "quantity": 10,
      "unitPrice": 250.0
    },
    {
      "retailerProductId": 2,
      "quantity": 15,
      "unitPrice": 220.0
    },
    {
      "retailerProductId": 3,
      "quantity": 20,
      "unitPrice": 65.0
    }
  ],
  "planDistribution": false,
  "notes": "Monthly stock replenishment",
  "paymentDueDate": "2025-12-15T00:00:00Z",
  "deliveryExpectedDate": "2025-12-01T00:00:00Z"
}
```

**Response (201) - Distribution Executed:**

```json
{
  "message": "Products distributed successfully",
  "distributions": [
    {
      "id": 1,
      "retailerId": 1,
      "retailerShopId": 1,
      "retailerProductId": 1,
      "quantity": 10,
      "unitPrice": 250,
      "totalAmount": 2500,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "notes": "Monthly stock replenishment",
      "paymentDueDate": "2025-12-15T00:00:00.000Z",
      "deliveryExpectedDate": "2025-12-01T00:00:00.000Z",
      "retailerProduct": {
        "product": {
          "name": "Ray-Ban Aviator Classic",
          "company": {
            "name": "Ray-Ban"
          }
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch"
        }
      }
    },
    {
      "id": 2,
      "retailerId": 1,
      "retailerShopId": 1,
      "retailerProductId": 2,
      "quantity": 15,
      "unitPrice": 220,
      "totalAmount": 3300,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "notes": "Monthly stock replenishment",
      "paymentDueDate": "2025-12-15T00:00:00.000Z",
      "deliveryExpectedDate": "2025-12-01T00:00:00.000Z",
      "retailerProduct": {
        "product": {
          "name": "Oakley Holbrook",
          "company": {
            "name": "Oakley"
          }
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch"
        }
      }
    },
    {
      "id": 3,
      "retailerId": 1,
      "retailerShopId": 1,
      "retailerProductId": 3,
      "quantity": 20,
      "unitPrice": 65,
      "totalAmount": 1300,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "notes": "Monthly stock replenishment",
      "paymentDueDate": "2025-12-15T00:00:00.000Z",
      "deliveryExpectedDate": "2025-12-01T00:00:00.000Z",
      "retailerProduct": {
        "product": {
          "name": "Standard Optical Lens",
          "company": {
            "name": "Vision Optics"
          }
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch"
        }
      }
    }
  ],
  "summary": {
    "shopName": "Optical World Test Branch",
    "totalItems": 3,
    "totalAmount": 7100,
    "distributionDate": "2025-11-17T10:30:00.000Z",
    "paymentDueDate": "2025-12-15T00:00:00.000Z",
    "deliveryExpectedDate": "2025-12-01T00:00:00.000Z"
  }
}
```

**Stock Deduction Process:**

```
BEFORE DISTRIBUTION:
┌─────────────────────────────────────────┐
│ Retailer Inventory                      │
├─────────────────────────────────────────┤
│ Ray-Ban Aviator: 50 units              │
│ Oakley Holbrook: 75 units              │
│ Standard Lens: 200 units               │
└─────────────────────────────────────────┘

DISTRIBUTION EXECUTED:
└─ Ray-Ban: 50 - 10 = 40 units ✓
└─ Oakley: 75 - 15 = 60 units ✓
└─ Lens: 200 - 20 = 180 units ✓

AFTER DISTRIBUTION:
┌─────────────────────────────────────────┐
│ Retailer Inventory                      │
├─────────────────────────────────────────┤
│ Ray-Ban Aviator: 40 units              │
│ Oakley Holbrook: 60 units              │
│ Standard Lens: 180 units               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Shop Inventory (Received)               │
├─────────────────────────────────────────┤
│ Ray-Ban Aviator: +10 units             │
│ Oakley Holbrook: +15 units             │
│ Standard Lens: +20 units               │
└─────────────────────────────────────────┘
```

**Frontend Implementation (Execute Distribution):**

```javascript
const executeDistribution = async (shopId, distributions, planData) => {
  try {
    // Show confirmation dialog
    const confirmed = await showConfirmationDialog(`
      📦 Confirm Distribution to ${planData.shop.name}?

      Items: ${planData.items.length}
      Total Amount: ₹${planData.totalAmount}

      ✓ Stock will be deducted from your inventory
      ✓ Will be added to shop inventory
      ✓ Delivery expected: ${new Date(
        planData.deliveryExpectedDate
      ).toLocaleDateString()}
    `);

    if (!confirmed) return;

    // Execute distribution
    const response = await fetch(
      "http://localhost:8080/retailer/distributions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          retailerShopId: shopId,
          distributions,
          planDistribution: false,
          notes: planData.notes,
          paymentDueDate: planData.paymentDueDate,
          deliveryExpectedDate: planData.deliveryExpectedDate,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Distribution executed successfully!");

      // Show success details
      result.distributions.forEach((dist) => {
        console.log(`
          ✓ ${dist.retailerProduct.product.name}
          Qty: ${dist.quantity}
          Status: ${dist.deliveryStatus}
          Amount: ₹${dist.totalAmount}
        `);
      });

      // Update inventory
      await loadRetailerProducts();

      return result;
    }
  } catch (error) {
    console.error("Distribution failed:", error);
  }
};
```

---

## STEP 7: TRACK DISTRIBUTION

### 7.1 Get All Distributions

**Endpoint:** `GET /retailer/distributions`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

```
?status=PENDING&page=1&limit=10
```

**Response (200):**

```json
{
  "distributions": [
    {
      "id": 1,
      "retailerId": 1,
      "retailerShopId": 1,
      "quantity": 10,
      "unitPrice": 250,
      "totalAmount": 2500,
      "deliveryStatus": "PENDING",
      "paymentStatus": "PENDING",
      "notes": "Monthly stock replenishment",
      "paymentDueDate": "2025-12-15T00:00:00.000Z",
      "deliveryExpectedDate": "2025-12-01T00:00:00.000Z",
      "createdAt": "2025-11-17T10:30:00.000Z",
      "retailerProduct": {
        "product": {
          "name": "Ray-Ban Aviator Classic",
          "sku": "RB-AV-001",
          "company": {
            "name": "Ray-Ban"
          }
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch",
          "address": "123 Test Street"
        }
      }
    },
    {
      "id": 2,
      "retailerId": 1,
      "retailerShopId": 1,
      "quantity": 15,
      "unitPrice": 220,
      "totalAmount": 3300,
      "deliveryStatus": "DELIVERED",
      "paymentStatus": "PAID",
      "notes": "Monthly stock replenishment",
      "paymentDueDate": "2025-12-15T00:00:00.000Z",
      "deliveryExpectedDate": "2025-12-01T00:00:00.000Z",
      "deliveredAt": "2025-11-25T14:30:00.000Z",
      "paidAt": "2025-11-27T09:15:00.000Z",
      "createdAt": "2025-11-17T10:30:00.000Z",
      "retailerProduct": {
        "product": {
          "name": "Oakley Holbrook",
          "sku": "OAK-HB-001",
          "company": {
            "name": "Oakley"
          }
        }
      },
      "retailerShop": {
        "shop": {
          "name": "Optical World Test Branch",
          "address": "123 Test Street"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Frontend Implementation:**

```javascript
const loadDistributions = async () => {
  try {
    const response = await fetch(
      "http://localhost:8080/retailer/distributions?page=1&limit=10",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    // Organize by status
    const pending = data.distributions.filter(
      (d) => d.deliveryStatus === "PENDING"
    );
    const delivered = data.distributions.filter(
      (d) => d.deliveryStatus === "DELIVERED"
    );
    const shipped = data.distributions.filter(
      (d) => d.deliveryStatus === "SHIPPED"
    );

    setDistributions({
      all: data.distributions,
      pending,
      delivered,
      shipped,
    });
  } catch (error) {
    console.error("Error loading distributions:", error);
  }
};
```

---

### 7.2 Update Delivery Status

**Endpoint:** `PUT /retailer/distributions/:distributionId/delivery-status`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "status": "DELIVERED",
  "deliveryNotes": "Delivered in good condition"
}
```

**Response (200):**

```json
{
  "message": "Delivery status updated successfully",
  "distribution": {
    "id": 1,
    "deliveryStatus": "DELIVERED",
    "deliveredAt": "2025-11-25T14:30:00.000Z",
    "deliveryNotes": "Delivered in good condition"
  }
}
```

---

### 7.3 Update Payment Status

**Endpoint:** `PUT /retailer/distributions/:distributionId/payment-status`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "status": "PAID",
  "paymentMethod": "BANK_TRANSFER",
  "referenceNumber": "TRN-2025-1234"
}
```

**Response (200):**

```json
{
  "message": "Payment status updated successfully",
  "distribution": {
    "id": 1,
    "paymentStatus": "PAID",
    "paidAt": "2025-11-27T09:15:00.000Z",
    "paymentMethod": "BANK_TRANSFER",
    "referenceNumber": "TRN-2025-1234"
  }
}
```

---

## 📱 FRONTEND COMPONENT STRUCTURE

### Main Flow Component

```javascript
// RetailerBulkWorkflowComponent.jsx

import React, { useState } from "react";
import BulkUploadStep from "./steps/BulkUploadStep";
import InventoryViewStep from "./steps/InventoryViewStep";
import ShopDiscoveryStep from "./steps/ShopDiscoveryStep";
import ShopConnectionStep from "./steps/ShopConnectionStep";
import BulkDistributionStep from "./steps/BulkDistributionStep";
import TrackingStep from "./steps/TrackingStep";

export default function RetailerBulkWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [token, setToken] = useState(localStorage.getItem("retailerToken"));
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [connectedShops, setConnectedShops] = useState([]);
  const [distributions, setDistributions] = useState([]);

  const steps = [
    { id: 1, name: "Bulk Upload Products", component: BulkUploadStep },
    { id: 2, name: "View Inventory", component: InventoryViewStep },
    { id: 3, name: "Discover Shops", component: ShopDiscoveryStep },
    { id: 4, name: "Connect with Shops", component: ShopConnectionStep },
    { id: 5, name: "Distribute Products", component: BulkDistributionStep },
    { id: 6, name: "Track Distributions", component: TrackingStep },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="retailer-workflow">
      <div className="progress-bar">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step ${currentStep >= step.id ? "active" : ""}`}
            onClick={() => setCurrentStep(step.id)}
          >
            {step.id}. {step.name}
          </div>
        ))}
      </div>

      <CurrentStepComponent
        token={token}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        uploadedProducts={uploadedProducts}
        setUploadedProducts={setUploadedProducts}
        connectedShops={connectedShops}
        setConnectedShops={setConnectedShops}
        distributions={distributions}
        setDistributions={setDistributions}
      />
    </div>
  );
}
```

---

## 🔐 AUTHENTICATION & HEADERS

All requests must include:

```javascript
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

---

## ⚠️ ERROR HANDLING

### Common Error Response

```json
{
  "error": "Insufficient stock. Available: 30, Requested: 50"
}
```

### Validation Error Response

```json
{
  "error": "Validation failed for distribution items",
  "validationErrors": [
    {
      "index": 0,
      "productId": 1,
      "productName": "Ray-Ban Aviator Classic",
      "error": "Insufficient stock. Available: 5, Requested: 10"
    }
  ]
}
```

---

## 📊 STATUS REFERENCE

### Delivery Status

- `PENDING` - Order created, awaiting dispatch
- `SHIPPED` - Order shipped to shop
- `DELIVERED` - Order received by shop
- `CANCELLED` - Order cancelled

### Payment Status

- `PENDING` - Payment not yet received
- `PARTIAL_PAID` - Partial payment received
- `PAID` - Full payment received
- `OVERDUE` - Payment overdue past due date

---

## ✅ STEP-BY-STEP CHECKLIST FOR DEVELOPERS

- [ ] Step 1: Login & get token
- [ ] Step 2: Download template, edit, and bulk upload
- [ ] Step 3: View uploaded products and export backup
- [ ] Step 4: Search and discover available shops
- [ ] Step 5: Connect shops with partnership terms
- [ ] Step 6: Plan distribution (preview mode)
- [ ] Step 6: Execute distribution (confirm mode)
- [ ] Step 7: Track delivery & payment status
- [ ] Implement error handling for all endpoints
- [ ] Handle loading states in UI
- [ ] Show success/failure notifications
- [ ] Update stock in real-time after distribution
