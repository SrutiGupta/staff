# Eyewear Inventory Management System

## Overview

This system has been enhanced to provide comprehensive eyewear inventory management with proper categorization, company tracking, and barcode-based stock operations. The system supports glasses, sunglasses, and lenses with detailed frame type classification.

## Database Schema Changes

### New Models

#### Company Model

```prisma
model Company {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  products    Product[]
}
```

#### Enhanced Product Model

```prisma
model Product {
  id           Int           @id @default(autoincrement())
  name         String
  description  String?
  price        Float
  barcode      String?       @unique

  // Eyewear categorization
  eyewearType  EyewearType   // GLASSES, SUNGLASSES, LENSES
  frameType    FrameType?    // RECTANGULAR, OVAL, ROUND, etc. (null for lenses)

  // Company/Brand information
  company      Company       @relation(fields: [companyId], references: [id])
  companyId    Int

  // Additional product attributes
  material     String?       // Frame material (metal, plastic, etc.)
  color        String?       // Frame color
  size         String?       // Frame size (S, M, L or specific measurements)
  model        String?       // Model number/name

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  inventory    Inventory[]
  invoiceItems InvoiceItem[]
}
```

#### Enhanced Inventory Model

```prisma
model Inventory {
  id        Int      @id @default(autoincrement())
  product   Product  @relation(fields: [productId], references: [id])
  productId Int      @unique  // One inventory record per product
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Enums

#### EyewearType

- `GLASSES` - Prescription eyeglasses
- `SUNGLASSES` - Sunglasses and tinted eyewear
- `LENSES` - Optical lenses (prescription, reading, etc.)

#### FrameType

- `RECTANGULAR` - Rectangular frames
- `OVAL` - Oval shaped frames
- `ROUND` - Round frames
- `SQUARE` - Square frames
- `AVIATOR` - Aviator style
- `WAYFARER` - Wayfarer style
- `CAT_EYE` - Cat-eye frames
- `CLUBMASTER` - Clubmaster style
- `RIMLESS` - Rimless frames
- `SEMI_RIMLESS` - Semi-rimless frames
- `WRAP_AROUND` - Wrap-around sports frames

## Stock-In Process with Barcode Scanning

### Workflow

1. **Barcode Scan**: Staff scans the product barcode using a barcode scanner
2. **Product Lookup**: System finds the product by barcode in the database
3. **Stock Update**: System updates the inventory quantity for that product
4. **Price Update** (Optional): If a new price is provided, the product price is updated
5. **Confirmation**: System returns detailed information about the stock-in operation

### Enhanced Barcode Stock-In API

#### POST /api/inventory/stock-by-barcode

**Request Body:**

```json
{
  "barcode": "RB3025001", // Required: Product barcode
  "quantity": 10, // Required: Quantity to add to inventory
  "price": 155.0 // Optional: Update product price
}
```

**Success Response (200 OK):**

```json
{
  "id": 1, // Inventory record ID
  "productId": 3, // Product ID
  "quantity": 35, // Total quantity after update
  "createdAt": "2025-09-02T15:30:00.000Z",
  "updatedAt": "2025-09-02T15:30:00.000Z",
  "product": {
    "id": 3,
    "name": "Ray-Ban Aviator Classic",
    "description": "Classic aviator sunglasses with metal frame",
    "price": 155.0, // Updated price if provided
    "barcode": "RB3025001",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "material": "Metal",
    "color": "Gold",
    "size": "L",
    "model": "RB3025",
    "company": {
      "id": 1,
      "name": "Ray-Ban",
      "description": "Premium sunglasses and eyewear brand"
    }
  },
  "stockInDetails": {
    "productName": "Ray-Ban Aviator Classic",
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "company": "Ray-Ban",
    "newQuantity": 35, // Total quantity after stock-in
    "addedQuantity": 10 // Quantity added in this operation
  }
}
```

**Error Responses:**

_Missing Required Fields (400 Bad Request):_

```json
{
  "error": "Barcode and quantity are required."
}
```

_Invalid Quantity (400 Bad Request):_

```json
{
  "error": "Quantity must be a valid number."
}
```

_Invalid Price (400 Bad Request):_

```json
{
  "error": "Price must be a valid number."
}
```

_Product Not Found (404 Not Found):_

```json
{
  "error": "Product with barcode RB3025001 not found."
}
```

_Server Error (500 Internal Server Error):_

```json
{
  "error": "An error occurred while updating the inventory."
}
```

## Complete API Endpoints Reference

### 1. Stock Operations

#### Enhanced Barcode Stock-In

**POST /api/inventory/stock-by-barcode**

- Updates inventory by scanning product barcode
- Optionally updates product price
- Returns detailed product and stock information

#### Traditional Stock-In (by Product ID)

**POST /api/inventory/stock-in**

**Request Body:**

```json
{
  "productId": 3, // Required: Product ID
  "quantity": 15 // Required: Quantity to add
}
```

**Success Response (200 OK - Existing Inventory):**

```json
{
  "id": 1,
  "productId": 3,
  "quantity": 50, // Updated total quantity
  "createdAt": "2025-09-02T10:00:00.000Z",
  "updatedAt": "2025-09-02T15:30:00.000Z"
}
```

**Success Response (201 Created - New Inventory):**

```json
{
  "id": 5,
  "productId": 3,
  "quantity": 15, // Initial quantity
  "createdAt": "2025-09-02T15:30:00.000Z",
  "updatedAt": "2025-09-02T15:30:00.000Z"
}
```

#### Stock-Out

**POST /api/inventory/stock-out**

**Request Body:**

```json
{
  "productId": 3, // Required: Product ID
  "quantity": 5 // Required: Quantity to remove
}
```

**Success Response (200 OK):**

```json
{
  "count": 1 // Number of records updated
}
```

**Error Response (400 Bad Request - Insufficient Stock):**

```json
{
  "error": "Insufficient stock available"
}
```

### 2. Product Management

#### Add New Product

**POST /api/inventory/product**

**Request Body:**

```json
{
  "name": "Oakley Holbrook", // Required
  "description": "Modern retro square sunglasses",
  "barcode": "OO9102001", // Optional but recommended
  "price": 140.0, // Required
  "eyewearType": "SUNGLASSES", // Required: GLASSES, SUNGLASSES, LENSES
  "frameType": "SQUARE", // Required for GLASSES/SUNGLASSES, null for LENSES
  "companyId": 2, // Required: Valid company ID
  "material": "O Matter", // Optional
  "color": "Matte Black", // Optional
  "size": "L", // Optional
  "model": "OO9102" // Optional
}
```

**Success Response (201 Created):**

```json
{
  "id": 11,
  "name": "Oakley Holbrook",
  "description": "Modern retro square sunglasses",
  "price": 140.0,
  "barcode": "OO9102001",
  "eyewearType": "SUNGLASSES",
  "frameType": "SQUARE",
  "companyId": 2,
  "material": "O Matter",
  "color": "Matte Black",
  "size": "L",
  "model": "OO9102",
  "createdAt": "2025-09-02T15:30:00.000Z",
  "updatedAt": "2025-09-02T15:30:00.000Z",
  "company": {
    "id": 2,
    "name": "Oakley",
    "description": "Sports and lifestyle eyewear"
  }
}
```

**Error Responses:**

_Missing Required Fields (400 Bad Request):_

```json
{
  "error": "Name, price, eyewearType, and companyId are required fields."
}
```

_Invalid Eyewear Type (400 Bad Request):_

```json
{
  "error": "Invalid eyewearType. Must be GLASSES, SUNGLASSES, or LENSES."
}
```

_Missing Frame Type (400 Bad Request):_

```json
{
  "error": "FrameType is required for glasses and sunglasses."
}
```

_Company Not Found (400 Bad Request):_

```json
{
  "error": "Company not found."
}
```

_Duplicate Barcode (400 Bad Request):_

```json
{
  "error": "Barcode already exists."
}
```

#### Update Product

**PUT /api/inventory/product/:productId**

**Request Body (all fields optional):**

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "barcode": "NEW_BARCODE_001",
  "price": 175.0,
  "eyewearType": "GLASSES",
  "frameType": "RECTANGULAR",
  "companyId": 3,
  "material": "Titanium",
  "color": "Silver",
  "size": "M",
  "model": "Updated Model"
}
```

**Success Response (200 OK):**

```json
{
  "id": 11,
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 175.0,
  "barcode": "NEW_BARCODE_001",
  "eyewearType": "GLASSES",
  "frameType": "RECTANGULAR",
  "companyId": 3,
  "material": "Titanium",
  "color": "Silver",
  "size": "M",
  "model": "Updated Model",
  "createdAt": "2025-09-02T15:30:00.000Z",
  "updatedAt": "2025-09-02T16:00:00.000Z",
  "company": {
    "id": 3,
    "name": "Prada",
    "description": "Luxury fashion eyewear"
  }
}
```

### 3. Inventory Management

#### Get Inventory (with Filtering)

**GET /api/inventory**

**Query Parameters (all optional):**

- `eyewearType`: Filter by GLASSES, SUNGLASSES, or LENSES
- `companyId`: Filter by company ID
- `frameType`: Filter by frame type

**Examples:**

- `GET /api/inventory` - Get all inventory
- `GET /api/inventory?eyewearType=SUNGLASSES` - Get only sunglasses
- `GET /api/inventory?companyId=2` - Get products from company ID 2
- `GET /api/inventory?eyewearType=GLASSES&frameType=RECTANGULAR` - Get rectangular glasses

**Success Response (200 OK):**

```json
{
  "inventory": [
    {
      "id": 1,
      "productId": 3,
      "quantity": 35,
      "createdAt": "2025-09-02T10:00:00.000Z",
      "updatedAt": "2025-09-02T15:30:00.000Z",
      "product": {
        "id": 3,
        "name": "Ray-Ban Aviator Classic",
        "description": "Classic aviator sunglasses with metal frame",
        "price": 155.0,
        "barcode": "RB3025001",
        "eyewearType": "SUNGLASSES",
        "frameType": "AVIATOR",
        "companyId": 1,
        "material": "Metal",
        "color": "Gold",
        "size": "L",
        "model": "RB3025",
        "company": {
          "id": 1,
          "name": "Ray-Ban",
          "description": "Premium sunglasses and eyewear brand"
        }
      }
    }
  ],
  "grouped": {
    "Ray-Ban": {
      "SUNGLASSES": [
        {
          "id": 1,
          "productId": 3,
          "quantity": 35,
          "product": {
            /* product details */
          }
        }
      ],
      "GLASSES": [
        /* glasses products */
      ]
    },
    "Oakley": {
      "SUNGLASSES": [
        /* sunglasses products */
      ]
    }
  },
  "summary": {
    "totalProducts": 10,
    "totalQuantity": 312,
    "companiesCount": 5
  }
}
```

### 4. Company Management

#### Add New Company

**POST /api/inventory/company**

**Request Body:**

```json
{
  "name": "Maui Jim", // Required: Unique company name
  "description": "Premium polarized sunglasses" // Optional
}
```

**Success Response (201 Created):**

```json
{
  "id": 6,
  "name": "Maui Jim",
  "description": "Premium polarized sunglasses",
  "createdAt": "2025-09-02T15:30:00.000Z",
  "updatedAt": "2025-09-02T15:30:00.000Z"
}
```

**Error Responses:**

_Missing Company Name (400 Bad Request):_

```json
{
  "error": "Company name is required."
}
```

_Duplicate Company Name (400 Bad Request):_

```json
{
  "error": "Company name already exists."
}
```

#### Get All Companies

**GET /api/inventory/companies**

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Ray-Ban",
    "description": "Premium sunglasses and eyewear brand",
    "createdAt": "2025-09-02T10:00:00.000Z",
    "updatedAt": "2025-09-02T10:00:00.000Z",
    "_count": {
      "products": 3 // Number of products for this company
    }
  },
  {
    "id": 2,
    "name": "Oakley",
    "description": "Sports and lifestyle eyewear",
    "createdAt": "2025-09-02T10:00:00.000Z",
    "updatedAt": "2025-09-02T10:00:00.000Z",
    "_count": {
      "products": 2
    }
  }
]
```

#### Get Company Products

**GET /api/inventory/company/:companyId/products**

**Query Parameters (optional):**

- `eyewearType`: Filter by GLASSES, SUNGLASSES, or LENSES
- `frameType`: Filter by frame type

**Examples:**

- `GET /api/inventory/company/2/products` - Get all Oakley products
- `GET /api/inventory/company/1/products?eyewearType=SUNGLASSES` - Get Ray-Ban sunglasses only

**Success Response (200 OK):**

```json
{
  "products": [
    {
      "id": 3,
      "name": "Ray-Ban Aviator Classic",
      "description": "Classic aviator sunglasses with metal frame",
      "price": 155.0,
      "barcode": "RB3025001",
      "eyewearType": "SUNGLASSES",
      "frameType": "AVIATOR",
      "companyId": 1,
      "material": "Metal",
      "color": "Gold",
      "size": "L",
      "model": "RB3025",
      "company": {
        "id": 1,
        "name": "Ray-Ban",
        "description": "Premium sunglasses and eyewear brand"
      },
      "inventory": [
        {
          "id": 1,
          "productId": 3,
          "quantity": 35,
          "createdAt": "2025-09-02T10:00:00.000Z",
          "updatedAt": "2025-09-02T15:30:00.000Z"
        }
      ]
    }
  ],
  "grouped": {
    "SUNGLASSES": {
      "AVIATOR": [
        {
          /* aviator sunglasses */
        }
      ],
      "WAYFARER": [
        {
          /* wayfarer sunglasses */
        }
      ]
    },
    "GLASSES": {
      "RECTANGULAR": [
        {
          /* rectangular glasses */
        }
      ]
    }
  },
  "summary": {
    "totalProducts": 3,
    "byEyewearType": {
      "SUNGLASSES": 2,
      "GLASSES": 1
    },
    "byFrameType": {
      "AVIATOR": 1,
      "WAYFARER": 1,
      "RECTANGULAR": 1
    }
  }
}
```

### 5. Error Handling

All endpoints include comprehensive error handling:

**Authentication Error (401 Unauthorized):**

```json
{
  "error": "Access denied. No token provided."
}
```

**Authorization Error (403 Forbidden):**

```json
{
  "error": "Invalid token."
}
```

**Validation Error (400 Bad Request):**

```json
{
  "error": "Specific validation message"
}
```

**Not Found Error (404 Not Found):**

```json
{
  "error": "Resource not found"
}
```

**Server Error (500 Internal Server Error):**

```json
{
  "error": "Something went wrong"
}
```

## Testing and Development Files

### 1. Seed Data File: `seed-eyewear-inventory.js`

This file is **essential** for setting up the system with sample data. It should be run after database migration to populate:

- **5 Companies**: Ray-Ban, Oakley, Prada, Essilor, Zeiss
- **10 Products**: Covering all eyewear types and frame types
- **Initial Inventory**: Stock quantities for all products

**Usage:**

```bash
node seed-eyewear-inventory.js
```

**What it creates:**

- Complete company structure with descriptions
- Diverse product catalog with proper categorization
- Realistic inventory quantities
- Proper relationships between companies and products

### 2. API Test File: `test-eyewear-api.js`

This file is **highly recommended** for:

- **API Testing**: Comprehensive test scenarios for all endpoints
- **Development Reference**: Shows how to use each API endpoint
- **Integration Testing**: Tests the complete workflow from product creation to stock management
- **Documentation**: Live examples of request/response formats

**Features:**

- Tests all inventory management endpoints
- Simulates barcode scanning workflows
- Tests filtering and grouping functionality
- Validates error handling scenarios
- Provides realistic usage examples

**Usage:**

```bash
# Update AUTH_TOKEN in the file first
node test-eyewear-api.js
```

**Test Scenarios Included:**

- Company management operations
- Product creation with full categorization
- Barcode-based stock-in operations
- Inventory filtering and grouping
- Error handling validation

### 3. Should You Keep These Files?

**YES - Keep Both Files** for the following reasons:

#### `seed-eyewear-inventory.js` - ESSENTIAL

- **Required for initial setup**: Without sample data, the system starts empty
- **Development testing**: Provides realistic data for development and testing
- **Demonstration purposes**: Shows the system's capabilities with real eyewear products
- **Training data**: Helps new users understand the data structure and relationships
- **Reset capability**: Allows easy database reset with fresh sample data

#### `test-eyewear-api.js` - HIGHLY RECOMMENDED

- **API documentation**: Living documentation of how to use each endpoint
- **Integration testing**: Ensures all endpoints work correctly together
- **Development aid**: Speeds up development by providing ready-to-use API calls
- **Quality assurance**: Helps catch bugs and regressions
- **Client development**: Provides examples for frontend/mobile app developers

### 4. Production Considerations

**For Production Deployment:**

- Keep `seed-eyewear-inventory.js` for initial setup, then archive it
- Keep `test-eyewear-api.js` for ongoing testing and development
- Use environment variables to prevent accidental execution in production
- Create production-specific seed files with real company data

### 5. File Maintenance

**Regular Updates Needed:**

- Update test cases when new endpoints are added
- Modify seed data when schema changes
- Add new test scenarios for new features
- Keep authentication tokens updated in test files

**Version Control:**

- Both files should be committed to version control
- Include them in deployment scripts for development environments
- Exclude them from production builds if desired

## Data Organization

### Storage Structure

Products are stored with complete categorization:

1. **Company Level**: Ray-Ban, Oakley, Prada, Essilor, Zeiss, etc.
2. **Eyewear Type Level**:
   - Glasses (prescription eyewear)
   - Sunglasses (tinted eyewear)
   - Lenses (optical lenses only)
3. **Frame Type Level**: Rectangular, Oval, Round, Aviator, etc.
4. **Product Attributes**: Material, color, size, model, price

### Example Organization

```
Ray-Ban/
├── SUNGLASSES/
│   ├── AVIATOR/
│   │   └── Ray-Ban Aviator Classic (Gold, Metal, L) - $150.00 - Qty: 25
│   └── WAYFARER/
│       └── Ray-Ban Wayfarer (Black, Acetate, M) - $130.00 - Qty: 30
└── GLASSES/
    └── RECTANGULAR/
        └── Ray-Ban RX5228 (Black, Acetate, M) - $120.00 - Qty: 15

Essilor/
└── LENSES/
    ├── Varilux Comfort (Progressive, CR-39) - $180.00 - Qty: 50
    └── Crizal Sapphire (Anti-reflective, High-index) - $120.00 - Qty: 40
```

## Integration Points

### Barcode Scanner Integration

- Supports standard barcode formats (Code 128, Code 39, etc.)
- Real-time product lookup
- Immediate inventory updates
- Error handling for invalid barcodes

### POS Integration

- When products are sold through invoicing, inventory is automatically reduced
- Real-time stock level tracking
- Low stock alerts can be implemented

### Reporting Integration

- Company-wise sales reports
- Eyewear type performance analysis
- Frame type popularity tracking
- Inventory turnover rates

## Benefits of the New System

1. **Comprehensive Categorization**: Products are properly categorized by company, eyewear type, and frame type
2. **Efficient Stock Management**: Barcode-based stock operations reduce errors and improve speed
3. **Price Management**: Easy price updates during stock-in operations
4. **Detailed Reporting**: Rich data structure enables detailed analytics
5. **Scalability**: Easy to add new companies, frame types, and product attributes
6. **Integration Ready**: API-first design supports easy integration with POS, barcode scanners, and reporting tools

## Quick Reference - Key Endpoints

| Operation                | Method | Endpoint                              | Purpose                      |
| ------------------------ | ------ | ------------------------------------- | ---------------------------- |
| **Barcode Stock-In**     | POST   | `/api/inventory/stock-by-barcode`     | Scan barcode and add stock   |
| **Add Product**          | POST   | `/api/inventory/product`              | Create new eyewear product   |
| **View Inventory**       | GET    | `/api/inventory`                      | Get inventory with filtering |
| **Add Company**          | POST   | `/api/inventory/company`              | Add new eyewear brand        |
| **Get Companies**        | GET    | `/api/inventory/companies`            | List all companies           |
| **Company Products**     | GET    | `/api/inventory/company/:id/products` | Get products by company      |
| **Traditional Stock-In** | POST   | `/api/inventory/stock-in`             | Add stock by product ID      |
| **Stock-Out**            | POST   | `/api/inventory/stock-out`            | Remove stock                 |
| **Update Product**       | PUT    | `/api/inventory/product/:id`          | Update product details       |

## Sample Data Structure

The system includes comprehensive sample data:

- **5 Companies**: Ray-Ban, Oakley, Prada, Essilor, Zeiss
- **10 Products**: Covering all eyewear types and frame types
- **Complete Categorization**: Every product properly classified
- **Realistic Inventory**: Initial stock quantities for testing

### Sample Product Organization:

```
Ray-Ban/
├── SUNGLASSES/
│   ├── AVIATOR/
│   │   └── Ray-Ban Aviator Classic (Gold, Metal, L) - $150.00 - Qty: 25
│   └── WAYFARER/
│       └── Ray-Ban Wayfarer (Black, Acetate, M) - $130.00 - Qty: 30
└── GLASSES/
    └── RECTANGULAR/
        └── Ray-Ban RX5228 (Black, Acetate, M) - $120.00 - Qty: 15

Essilor/
└── LENSES/
    ├── Varilux Comfort (Progressive, CR-39) - $180.00 - Qty: 50
    └── Crizal Sapphire (Anti-reflective, High-index) - $120.00 - Qty: 40
```

## Getting Started

1. **Setup Database**: Run `prisma migrate dev` to apply schema changes
2. **Populate Sample Data**: Run `node seed-eyewear-inventory.js`
3. **Test APIs**: Use `test-eyewear-api.js` to verify functionality
4. **Start Stock Management**: Use barcode scanning for inventory operations

## Integration Points

### Barcode Scanner Integration

- Supports standard barcode formats (Code 128, Code 39, etc.)
- Real-time product lookup
- Immediate inventory updates
- Error handling for invalid barcodes

### POS Integration

- When products are sold through invoicing, inventory is automatically reduced
- Real-time stock level tracking
- Low stock alerts can be implemented

### Reporting Integration

- Company-wise sales reports
- Eyewear type performance analysis
- Frame type popularity tracking
- Inventory turnover rates

---

This enhanced eyewear inventory management system provides a complete solution for optical businesses, with proper categorization, efficient stock management, and comprehensive API support for integration with existing systems.
