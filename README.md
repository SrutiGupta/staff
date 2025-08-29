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
3.  The API will be available at `http://localhost:8080`.

## 2. Authentication (JWT)

Most endpoints are protected and require a JSON Web Token (JWT) to be sent in the `Authorization` header.

### How to Get Your JWT

1.  **Open Postman** and create a new `POST` request.
2.  **URL:** `http://localhost:8080/api/attendance/login`
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
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE1ODg3ODc4LCJleHAiOjE3MTU5NzQyNzh9.xxxxxxxxxxxx"
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

### User Authentication (`/api/auth`)

These endpoints are for non-staff user accounts.

#### **Register User**
*   **Method:** `POST`
*   **URL:** `http://localhost:8080/api/auth/register`
*   **Request Body:**
    ```json
    {
        "name": "Test User",
        "email": "user@example.com",
        "password": "password123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzE1ODg4MjAwLCJleHAiOjE3MTU5NzQ2MDB9.yyyyyyyyyyyy"
    }
    ```

#### **Login User**
*   **Method:** `POST`
*   **URL:** `http://localhost:8080/api/auth/login`
*   **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "password123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzE1ODg4MjMwfQ.zzzzzzzzzzzzz"
    }
    ```

---
### Products (`/api/product`)

#### **Get All Products**
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/product`
*   **Authentication:** Required (Bearer Token)
*   **Success Response (200 OK):**
    ```json
    [
        {
            "id": 1,
            "name": "Panadol",
            "price": "10.00"
        },
        {
            "id": 2,
            "name": "Vitamin C",
            "price": "25.50"
        }
    ]
    ```

---
### Invoices (`/api/invoice`)

#### **Create New Invoice**
*   **Method:** `POST`
*   **URL:** `http://localhost:8080/api/invoice`
*   **Authentication:** Required (Bearer Token)
*   **Request Body:**
    ```json
    {
        "patientId": "PATIENT-001",
        "amount": 35.50,
        "items": [
            {
                "productId": 1,
                "quantity": 1
            },
            {
                "productId": 2,
                "quantity": 1
            }
        ]
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "id": 1,
        "patientId": "PATIENT-001",
        "amount": "35.50",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
    }
    ```

#### **Get All Invoices**
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/invoice`
*   **Authentication:** Required (Bearer Token)
*   **Success Response (200 OK):**
    ```json
    [
        {
            "id": 1,
            "patientId": "PATIENT-001",
            "amount": "35.50",
            "createdAt": "2023-10-27T10:00:00.000Z",
            "updatedAt": "2023-10-27T10:00:00.000Z"
        }
    ]
    ```

#### **Download Invoice PDF**
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/invoice/1/pdf` (Replace `1` with a real Invoice ID)
*   **Authentication:** Required (Bearer Token)
*   **Success Response (200 OK):**
    *   The API will return a PDF file. Postman will give you an option to "Save Response to File".

---
### Barcode Generation (`/api/barcode`)

This endpoint is for generating a barcode image from a product's SKU.

#### **Generate Barcode**
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/barcode/YOUR-SKU-HERE` (e.g., `http://localhost:8080/api/barcode/LENS-KRT-001`)
*   **Authentication:** Not Required
*   **Success Response (200 OK):**
    *   The API will return a PNG image. Postman will display the barcode image in the response body viewer.

---
### Royalty Points (`/api/royalty`)

#### **Add Royalty Points**
*   **Method:** `POST`
*   **URL:** `http://localhost:8080/api/royalty`
*   **Authentication:** Required (Bearer Token)
*   **Request Body:**
    ```json
    {
        "patientId": "PATIENT-001",
        "points": 100
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "id": 1,
        "patientId": "PATIENT-001",
        "points": 100
    }
    ```

#### **Get Royalty Points by Patient**
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/royalty/PATIENT-001` (Replace `PATIENT-001` with a real ID)
*   **Authentication:** Required (Bearer Token)
*   **Success Response (200 OK):**
    ```json
    [
        {
            "id": 1,
            "patientId": "PATIENT-001",
            "points": 100
        }
    ]
    ```

---
### Staff Attendance (`/api/attendance`)

#### **Get All Attendance Records**
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/attendance`
*   **Authentication:** Required (Bearer Token)
*   **Success Response (200 OK):**
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
*   **Method:** `GET`
*   **URL:** `http://localhost:8080/api/attendance/1` (Replace `1` with a real Staff ID)
*   **Authentication:** Required (Bearer Token)
*   **Success Response (200 OK):**
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
