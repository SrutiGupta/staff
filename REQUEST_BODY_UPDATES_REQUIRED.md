# API Endpoints Requiring Request Body Updates

## Schema Changes Summary

The database schema has been updated to include **Shop Admin Portal** functionality. The following models now require a `shopId` field:

### Old Schema → New Schema Changes:

- **Staff**: Added `shopId` (required), `role` (required StaffRole enum), `isActive` (boolean)
- **Patient**: Added `shopId` (required)
- **Customer**: Added `shopId` (required)

---

## Endpoints Requiring Request Body Updates

### 🔐 **Authentication Endpoints**

#### 1. **POST /api/auth/register** - Staff Registration

**Route File**: `routes/auth.js`  
**Controller**: `authController.register`

**OLD Request Body:**

```json
{
  "email": "staff@example.com",
  "name": "Staff Name",
  "password": "password123"
}
```

**NEW Request Body:**

```json
{
  "email": "staff@example.com",
  "name": "Staff Name",
  "password": "password123",
  "shopId": 1,
  "role": "SALES_STAFF"
}
```

**NEW Required Fields:**

- `shopId` (integer) - ID of the shop the staff belongs to
- `role` (string) - Must be one of: `SALES_STAFF`, `CASHIER`, `INVENTORY_MANAGER`, `OPTOMETRIST`

---

### 👥 **Patient Endpoints**

#### 2. **POST /api/patient/** - Create Patient

**Route File**: `routes/patient.js`  
**Controller**: `patientController.createPatient`

**OLD Request Body:**

```json
{
  "name": "John Doe",
  "age": 30,
  "gender": "Male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "medicalHistory": "None"
}
```

**NEW Request Body:**

```json
{
  "name": "John Doe",
  "age": 30,
  "gender": "Male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "medicalHistory": "None",
  "shopId": 1
}
```

**NEW Required Fields:**

- `shopId` (integer) - ID of the shop where patient is registered

---

### 🛒 **Customer Endpoints**

#### 3. **POST /api/customer/** - Create Customer

**Route File**: `routes/customer.js`  
**Controller**: `customerController.createCustomer`

**OLD Request Body:**

```json
{
  "name": "Jane Smith",
  "phone": "+0987654321",
  "address": "456 Oak Avenue"
}
```

**NEW Request Body:**

```json
{
  "name": "Jane Smith",
  "phone": "+0987654321",
  "address": "456 Oak Avenue",
  "shopId": 1
}
```

**NEW Required Fields:**

- `shopId` (integer) - ID of the shop where customer is registered

#### 4. **POST /api/customer/invoice** - Create Customer Invoice

**Route File**: `routes/customer.js`  
**Controller**: `customerController.createCustomerAndInvoice`

**OLD Request Body:**

```json
{
  "customer": {
    "name": "Walk-in Customer",
    "phone": "+1111111111",
    "address": "789 Pine Street"
  },
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 150.0
    }
  ],
  "subtotal": 300.0,
  "totalAmount": 354.0,
  "cgst": 27.0,
  "sgst": 27.0
}
```

**NEW Request Body:**

```json
{
  "customer": {
    "name": "Walk-in Customer",
    "phone": "+1111111111",
    "address": "789 Pine Street",
    "shopId": 1
  },
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 150.0
    }
  ],
  "subtotal": 300.0,
  "totalAmount": 354.0,
  "cgst": 27.0,
  "sgst": 27.0
}
```

**NEW Required Fields:**

- `customer.shopId` (integer) - ID of the shop for the customer

---

## Endpoints NOT Requiring Updates

The following endpoints do **NOT** need request body changes because they either:

- Don't create/update Staff, Patient, or Customer models
- Only read data (GET endpoints)
- Work with other models that weren't changed

### ✅ **No Changes Needed:**

**Invoice Endpoints:**

- `POST /api/invoice/` - _(Creates invoice, doesn't modify Staff/Patient/Customer)_
- `GET /api/invoice/`
- `GET /api/invoice/:id`
- `PATCH /api/invoice/:id/status`
- `POST /api/invoice/:id/payment`
- `DELETE /api/invoice/:id`
- `GET /api/invoice/:id/pdf`

**Prescription Endpoints:**

- `POST /api/prescription/` - _(Creates prescription for existing patient)_
- `GET /api/prescription/`
- `GET /api/prescription/:id`
- `GET /api/prescription/:id/pdf`
- `GET /api/prescription/:id/thermal`

**Product & Inventory Endpoints:**

- All product endpoints
- All inventory endpoints
- All barcode endpoints

**Other Endpoints:**

- All attendance endpoints
- All royalty endpoints
- All gift card endpoints
- All payment endpoints
- All reporting endpoints

---

## Frontend Development Impact

### 🔄 **Required Frontend Changes:**

#### 1. **Staff Registration Form**

- Add shop selection dropdown
- Add role selection dropdown with options: `SALES_STAFF`, `CASHIER`, `INVENTORY_MANAGER`, `OPTOMETRIST`

#### 2. **Patient Registration Form**

- Add hidden shopId field (auto-populated from logged-in staff's shop)
- Or add shop selection if multi-shop support needed

#### 3. **Customer Registration Form**

- Add hidden shopId field (auto-populated from logged-in staff's shop)
- Update customer invoice creation form

### 💡 **Implementation Strategies:**

#### **Option 1: Auto-populate from Staff Context**

```javascript
// Get shopId from authenticated staff user
const staff = getCurrentUser();
const formData = {
  ...patientData,
  shopId: staff.shopId,
};
```

#### **Option 2: Shop Selection Dropdown**

```javascript
// For multi-shop scenarios
<select name="shopId" required>
  <option value="">Select Shop</option>
  <option value="1">Main Shop</option>
  <option value="2">Branch Shop</option>
</select>
```

---

## Testing Updated Endpoints

### 📋 **Staff Registration Test:**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstaff@test.com",
    "name": "New Staff",
    "password": "password123",
    "shopId": 1,
    "role": "SALES_STAFF"
  }'
```

### 📋 **Patient Creation Test:**

```bash
curl -X POST http://localhost:8080/api/patient/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Patient",
    "age": 25,
    "gender": "Female",
    "phone": "+1234567890",
    "address": "Test Address",
    "medicalHistory": "None",
    "shopId": 1
  }'
```

### 📋 **Customer Creation Test:**

```bash
curl -X POST http://localhost:8080/api/customer/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Customer",
    "phone": "+0987654321",
    "address": "Customer Address",
    "shopId": 1
  }'
```

---

## Summary

**Total Endpoints Requiring Updates: 4**

- 1 Authentication endpoint
- 1 Patient endpoint
- 2 Customer endpoints

**Key Changes:**

- All Staff, Patient, Customer creation now requires `shopId`
- Staff registration additionally requires `role` field
- Frontend forms need shop context or selection

**Backward Compatibility:**

- Existing data migration handled by database schema update
- API endpoints will return 400 errors for missing required fields
- Frontend must be updated before deployment

---

_Last Updated: September 8, 2025_  
_Schema Version: Shop Admin Portal Integration_
