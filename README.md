# API Endpoint Testing Guide (Postman)

This guide provides instructions on how to test the API endpoints for this project using Postman.

## 1. Initial Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Server:**
    ```bash
    npm start
    ```
3.  The API will be available at `http://localhost:3000`.

## 2. Authentication (JWT)

Most endpoints are protected and require a JSON Web Token (JWT) to be sent in the `Authorization` header.

### How to Get Your JWT

1.  **Open Postman** and create a new `POST` request.
2.  **URL:** `http://localhost:3000/api/auth/login`
3.  **Body Tab:** Select `raw` and `JSON`.
4.  **Request Body:**
    ```json
    {
      "email": "staff@example.com",
      "password": "password"
    }
    ```
5.  **Send the request.** The response body will contain your token.

    **Success Response (200 OK):**

    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU2NTM1MTQyLCJleHAiOjE3NTY2MjE1NDJ9.YXGu3P4HT2qfJ50YEV77ArE2ff0n0I0rWRKJKMLfCt4"
    }
    ```

### How to Use Your JWT

For every protected endpoint, you must include the token in your request headers.

1.  **Go to the `Authorization` tab** in your Postman request.
2.  **Type:** Select `Bearer Token`.
3.  **Token:** Paste the JWT you received from the login response into the token field.

    ![Postman Authorization Header](https://i.imgur.com/7k3vL9A.png)

---

## 3. API Endpoints

### Patient Management (`/api/patient`)

#### **Create New Patient**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/patient`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "name": "Test Patient",
    "age": 30,
    "gender": "Male"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "id": 1,
    "name": "Test Patient",
    "age": 30,
    "gender": "Male",
    "phone": null,
    "address": null,
    "medicalHistory": null,
    "createdAt": "2025-08-30T06:35:54.248Z",
    "updatedAt": "2025-08-30T06:35:54.248Z"
  }
  ```

---

### Products (`/api/product`)

#### **Get All Products**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/product`
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Panadol",
      "price": "10.00"
    },
    {
      "id": 2,
      "name": "New Test Product",
      "description": "A new product for testing",
      "price": 15.99,
      "barcode": "9876543210",
      "createdAt": "2025-08-30T06:31:28.244Z",
      "updatedAt": "2025-08-30T06:31:28.244Z"
    }
  ]
  ```

---

### Inventory Management (`/api/inventory`)

#### **Update Stock by Barcode**

This endpoint is designed for efficient stock-taking. You can scan a product's barcode and provide a quantity to add to the inventory. If the product is new to the inventory, it will be created automatically.

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/inventory/stock-by-barcode`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "barcode": "9876543210",
    "quantity": 50
  }
  ```
- **Success Response (200 OK):**
  The response shows the updated inventory level for the product.
  ```json
  {
    "id": 1,
    "productId": 2,
    "quantity": 50,
    "createdAt": "2025-09-01T11:00:00.000Z",
    "updatedAt": "2025-09-01T11:00:00.000Z",
    "product": {
      "id": 2,
      "name": "New Test Product",
      "description": "A new product for testing",
      "price": 15.99,
      "barcode": "9876543210",
      "createdAt": "2025-08-30T06:31:28.244Z",
      "updatedAt": "2025-08-30T06:31:28.244Z"
    }
  }
  ```

---

### Invoices (`/api/invoice`)

#### **Create New Invoice**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/invoice`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "patientId": 1,
    "items": [
      {
        "productId": 2,
        "quantity": 2
      }
    ]
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "id": "cmexw2eh50003p7gbkmnpdw3q",
    "patientId": 1,
    "subtotal": 31.98,
    "totalDiscount": 0,
    "totalIgst": 0,
    "totalCgst": 0,
    "totalSgst": 0,
    "totalAmount": 31.98,
    "paidAmount": 0,
    "status": "UNPAID",
    "createdAt": "2025-08-30T06:36:46.409Z",
    "updatedAt": "2025-08-30T06:36:46.409Z",
    "prescriptionId": null,
    "items": [
      {
        "id": 2,
        "invoiceId": "cmexw2eh50003p7gbkmnpdw3q",
        "productId": 2,
        "quantity": 2,
        "unitPrice": 15.99,
        "discount": 0,
        "igst": 0,
        "cgst": 0,
        "sgst": 0,
        "totalPrice": 31.98,
        "product": {
          "id": 2,
          "name": "New Test Product",
          "description": "A new product for testing",
          "price": 15.99,
          "barcode": "9876543210",
          "createdAt": "2025-08-30T06:31:28.244Z",
          "updatedAt": "2025-08-30T06:31:28.244Z"
        }
      }
    ]
  }
  ```

#### **Get Invoice by ID**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/invoice/cmexw2eh50003p7gbkmnpdw3q` (Replace with a real Invoice ID)
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  - Returns the full invoice object with patient, items, and product details.

#### **Download Invoice PDF**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/invoice/cmexw2eh50003p7gbkmnpdw3q/pdf` (Replace with a real Invoice ID)
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  - The API will return a PDF file. Postman will give you an option to "Save Response to File".

#### **Generate Thermal Printer Receipt**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/invoice/cmexw2eh50003p7gbkmnpdw3q/thermal` (Replace with a real Invoice ID)
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  - The API will return a plain text response formatted for a thermal printer.

---

### Customer Management (`/api/customer`)

This section handles interactions for non-patient, walk-in customers.

#### **Create Customer Invoice**

Creates a new customer and an invoice for their purchase in a single transaction. This is ideal for one-time sales.

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/customer/invoice`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "staffId": 1,
    "paidAmount": 165.5,
    "paymentMethod": "Credit Card",
    "customer": {
      "name": "Jane Doe",
      "phone": "555-123-4567",
      "address": "456 Oak Ave, Sometown, USA"
    },
    "items": [
      {
        "productId": 1,
        "quantity": 1,
        "unitPrice": 150.0
      },
      {
        "productId": 2,
        "quantity": 1,
        "unitPrice": 15.5
      }
    ]
  }
  ```
- **Success Response (201 Created):**
  The response body will be the newly created invoice object, linked to the new customer.
  ```json
  {
    "id": "clz8h3f0d0001p7bkhs8g4f8c",
    "patientId": null,
    "customerId": 1,
    "staffId": 1,
    "subtotal": 165.5,
    "totalDiscount": 0,
    "totalIgst": 0,
    "totalCgst": 0,
    "totalSgst": 0,
    "totalAmount": 165.5,
    "paidAmount": 165.5,
    "status": "PAID",
    "createdAt": "2025-09-01T10:00:00.000Z",
    "updatedAt": "2025-09-01T10:00:00.000Z",
    "prescriptionId": null
  }
  ```

#### **Get Address Hotspots**

Retrieves a list of the top 10 most frequent customer addresses, which can be used to identify business "hotspots".

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/customer/hotspots`
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  ```json
  [
    {
      "address": "456 Oak Ave, Sometown, USA",
      "customerCount": 15
    },
    {
      "address": "123 Main St, Anytown, USA",
      "customerCount": 9
    },
    {
      "address": "789 Pine Ln, Otherville, USA",
      "customerCount": 5
    }
  ]
  ```

---

### Barcode Generation (`/api/barcode`)

This endpoint is for generating a barcode image from a product's SKU.

#### **Generate Barcode**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/barcode/YOUR-SKU-HERE` (e.g., `http://localhost:3000/api/barcode/9876543210`)
- **Authentication:** Not Required
- **Success Response (200 OK):**
  - The API will return a PNG image. Postman will display the barcode image in the response body viewer.

---

### Royalty Points (`/api/royalty`)

#### **Add Royalty Points**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/royalty`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "patientId": 1,
    "points": 100
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "id": 1,
    "patientId": 1,
    "points": 100
  }
  ```

#### **Get Royalty Points by Patient**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/royalty/1` (Replace `1` with a real Patient ID)
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "patientId": 1,
      "points": 100
    }
  ]
  ```

---

### Staff Attendance (`/api/attendance`)

#### **Get All Attendance Records**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/attendance`
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "staffId": 1,
      "loginTime": "2023-10-27T09:00:00.000Z",
      "logoutTime": null,
      "staff": {
        "id": 1,
        "name": "Test Staff",
        "email": "staff@example.com"
      }
    }
  ]
  ```

#### **Get Attendance by Staff ID**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/attendance/1` (Replace `1` with a real Staff ID)
- **Authentication:** Required (Bearer Token)
- **Success Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "staffId": 1,
      "loginTime": "2023-10-27T09:00:00.000Z",
      "logoutTime": null,
      "staff": {
        "id": 1,
        "name": "Test Staff",
        "email": "staff@example.com"
      }
    }
  ]
  ```

---

### Reporting (`/api/reporting`)

This section provides endpoints for generating business intelligence reports.

#### **Get Sales by Price Tier**

Categorizes sales volume into "low", "medium", and "high" price tiers based on the `unitPrice` at the time of sale.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/reporting/sales-by-price-tier`
- **Authentication:** Required (Bearer Token)
- **Query Parameters (Optional):**
  - `startDate` (e.g., `2025-09-01`)
  - `endDate` (e.g., `2025-09-30`)
- **Success Response (200 OK):**
  ```json
  {
    "tierDefinitions": {
      "low": { "max": 50 },
      "medium": { "min": 50, "max": 500 },
      "high": { "min": 500 }
    },
    "salesByTier": {
      "low": { "count": 150 },
      "medium": { "count": 85 },
      "high": { "count": 20 }
    }
  }
  ```

#### **Get Best-Selling Products by Price Tier**

Identifies the top-selling products within each price tier.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/reporting/best-sellers-by-price-tier`
- **Authentication:** Required (Bearer Token)
- **Query Parameters (Optional):**
  - `startDate` (e.g., `2025-09-01`)
  - `endDate` (e.g., `2025-09-30`)
  - `limit` (e.g., `3` to get the top 3 products per tier, defaults to 5)
- **Success Response (200 OK):**
  ```json
  {
    "tierDefinitions": {
      "low": { "max": 50 },
      "medium": { "min": 50, "max": 500 },
      "high": { "min": 500 }
    },
    "bestSellers": {
      "low": [
        {
          "productName": "Panadol",
          "totalQuantity": 75,
          "unitPrice": 10
        },
        {
          "productName": "Band-Aids (Box of 20)",
          "totalQuantity": 50,
          "unitPrice": 25
        }
      ],
      "medium": [
        {
          "productName": "Advanced Crutches",
          "totalQuantity": 30,
          "unitPrice": 350
        },
        {
          "productName": "Digital Thermometer",
          "totalQuantity": 25,
          "unitPrice": 150
        }
      ],
      "high": [
        {
          "productName": "Wheelchair",
          "totalQuantity": 5,
          "unitPrice": 1200
        }
      ]
    }
  }
  ```

---

### Prescription Management (`/api/prescription`)

#### **Create New Prescription**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/prescription`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "patientId": 1,
    "rightEye": {
      "sph": "-1.50",
      "cyl": "-0.25",
      "axis": "90",
      "add": "+2.00"
    },
    "leftEye": {
      "sph": "-1.25",
      "cyl": "-0.50",
      "axis": "85",
      "add": "+2.00"
    }
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "id": 1,
    "patientId": 1,
    "rightEye": {
      "sph": "-1.50",
      "cyl": "-0.25",
      "axis": "90",
      "add": "+2.00"
    },
    "leftEye": {
      "sph": "-1.25",
      "cyl": "-0.50",
      "axis": "85",
      "add": "+2.00"
    },
    "createdAt": "2025-09-01T08:15:30.123Z",
    "updatedAt": "2025-09-01T08:15:30.123Z"
  }
  ```

#### **Get Prescription by ID**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/prescription/:id`
- **Authentication:** Required (Bearer Token)
- **URL Parameters:**
  - `id` (required): Prescription ID
- **Example URL:** `http://localhost:3000/api/prescription/1`
- **Success Response (200 OK):**
  ```json
  {
    "id": 1,
    "patientId": 1,
    "rightEye": {
      "sph": "-1.50",
      "cyl": "-0.25",
      "axis": "90",
      "add": "+2.00"
    },
    "leftEye": {
      "sph": "-1.25",
      "cyl": "-0.50",
      "axis": "85",
      "add": "+2.00"
    },
    "createdAt": "2025-09-01T08:15:30.123Z",
    "updatedAt": "2025-09-01T08:15:30.123Z",
    "patient": {
      "id": 1,
      "name": "Test Patient",
      "age": 30,
      "gender": "Male",
      "phone": null,
      "address": null,
      "medicalHistory": null,
      "createdAt": "2025-08-30T06:35:54.248Z",
      "updatedAt": "2025-08-30T06:35:54.248Z"
    }
  }
  ```
