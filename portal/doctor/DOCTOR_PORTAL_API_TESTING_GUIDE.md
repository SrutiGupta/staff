# Doctor Portal API Testing Guide (Postman)

## Complete Medical Prescription Management System

---

## 🩺 **OVERVIEW**

This guide provides comprehensive Postman testing for the **Doctor Portal** - a medical prescription management system for optometrists. The portal allows doctors to:

- **🔐 Secure Login/Logout** with attendance tracking
- **👥 Patient Management** (view patients added by staff)
- **📋 Prescription Creation** with detailed eye measurements
- **🖨️ Thermal Printing** for prescription receipts
- **📄 PDF Generation** for professional prescription documents

**Base URL**: `http://localhost:8080`
**Portal Path**: `/doctor`
**Total Endpoints**: 8

---

## 🛠️ **POSTMAN COLLECTION SETUP**

### **Environment Variables**

Create a Postman environment with these variables:

```json
{
  "baseUrl": "http://localhost:8080",
  "doctorToken": "{{loginToken}}",
  "doctorEmail": "doctor@shop1.com",
  "doctorPassword": "doctorPassword123",
  "testPatientId": "1"
}
```

---

## 🔐 **AUTHENTICATION ENDPOINTS**

### **1. POST /doctor/login**

- **Description**: Doctor login with attendance tracking
- **Type**: Public Route
- **Method**: POST
- **URL**: `{{baseUrl}}/doctor/login`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "email": "{{doctorEmail}}",
    "password": "{{doctorPassword}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "doctor": {
      "id": 3,
      "email": "doctor@shop1.com",
      "name": "Dr. John Optometrist",
      "role": "OPTOMETRIST",
      "shopId": 3
    }
  }
  ```
- **Post-request Script**:

  ```javascript
  pm.test("Doctor login successful", function () {
    pm.response.to.have.status(200);
  });

  pm.test("Token exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.environment.set("doctorToken", jsonData.token);
  });

  pm.test("Doctor has OPTOMETRIST role", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.doctor.role).to.eql("OPTOMETRIST");
  });
  ```

- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Token is returned
  - ✅ Doctor role is OPTOMETRIST
  - ✅ Shop ID is present
  - ✅ Attendance record created (check via shop admin)

---

### **2. POST /doctor/logout**

- **Description**: Doctor logout with attendance tracking
- **Type**: Protected Route
- **Method**: POST
- **URL**: `{{baseUrl}}/doctor/logout`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}"
  }
  ```
- **Request Body**: None
- **Expected Response (200)**:
  ```json
  {
    "message": "Doctor logout successful",
    "doctor": {
      "id": 3,
      "name": "Dr. John Optometrist",
      "role": "OPTOMETRIST"
    }
  }
  ```
- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Logout message confirmed
  - ✅ Attendance logout time recorded

---

## 👥 **PATIENT MANAGEMENT ENDPOINTS**

### **3. GET /doctor/patients**

- **Description**: Get all patients from doctor's shop
- **Type**: Protected Route
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/patients`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Test Patient",
        "age": 35,
        "gender": "Male",
        "phone": "+1234567890",
        "address": "123 Test St",
        "medicalHistory": "No major issues",
        "lastVisit": null,
        "createdAt": "2025-09-23T03:46:57.019Z",
        "shop": {
          "id": 3,
          "name": "Test Optical Shop"
        }
      }
    ],
    "count": 1
  }
  ```
- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Success flag is true
  - ✅ Patient data structure is correct
  - ✅ Shop isolation (only shop's patients shown)
  - ✅ Patient count matches data array length

---

## 📋 **PRESCRIPTION MANAGEMENT ENDPOINTS**

### **4. POST /doctor/prescriptions**

- **Description**: Create new prescription for a patient
- **Type**: Protected Route
- **Method**: POST
- **URL**: `{{baseUrl}}/doctor/prescriptions`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "patientId": {{testPatientId}},
    "rightEye": {
      "sphere": -2.5,
      "cylinder": -0.5,
      "axis": 90,
      "add": 0.0
    },
    "leftEye": {
      "sphere": -2.0,
      "cylinder": -0.25,
      "axis": 85,
      "add": 0.0
    }
  }
  ```
- **Expected Response (201)**:
  ```json
  {
    "success": true,
    "message": "Prescription created successfully",
    "data": {
      "id": 1,
      "patientId": 1,
      "rightEye": {
        "sphere": -2.5,
        "cylinder": -0.5,
        "axis": 90,
        "add": 0.0
      },
      "leftEye": {
        "sphere": -2.0,
        "cylinder": -0.25,
        "axis": 85,
        "add": 0.0
      },
      "createdAt": "2025-09-23T03:47:24.379Z",
      "updatedAt": "2025-09-23T03:47:24.379Z",
      "patient": {
        "id": 1,
        "name": "Test Patient",
        "age": 35,
        "gender": "Male",
        "shop": {
          "id": 3,
          "name": "Test Optical Shop"
        }
      }
    },
    "doctorInfo": {
      "id": 3,
      "name": "Dr. John Optometrist",
      "role": "OPTOMETRIST",
      "shopId": 3
    }
  }
  ```
- **Post-request Script**:
  ```javascript
  pm.test("Prescription created successfully", function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.environment.set("prescriptionId", jsonData.data.id);
  });
  ```
- **Tests to Include**:
  - ✅ Status code is 201
  - ✅ Prescription ID generated
  - ✅ Eye measurements correctly stored
  - ✅ Patient data included
  - ✅ Doctor information included
  - ✅ Shop isolation maintained

---

### **5. GET /doctor/prescriptions**

- **Description**: Get all prescriptions for doctor's shop with pagination
- **Type**: Protected Route
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/prescriptions?page=1&limit=10`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}"
  }
  ```
- **Query Parameters**:
  - `page`: 1 (optional, default: 1)
  - `limit`: 10 (optional, default: 10)
  - `patientId`: (optional, filter by patient)
- **Expected Response (200)**:
  ```json
  {
    "prescriptions": [
      {
        "id": 1,
        "patientId": 1,
        "rightEye": {
          "sphere": -2.5,
          "cylinder": -0.5,
          "axis": 90
        },
        "leftEye": {
          "sphere": -2.0,
          "cylinder": -0.25,
          "axis": 85
        },
        "createdAt": "2025-09-23T03:47:24.379Z",
        "updatedAt": "2025-09-23T03:47:24.379Z",
        "patient": {
          "id": 1,
          "name": "Test Patient",
          "age": 35,
          "gender": "Male",
          "phone": "+1234567890",
          "shop": {
            "id": 3,
            "name": "Test Optical Shop"
          }
        }
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
  ```
- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Pagination info correct
  - ✅ Prescription array structure
  - ✅ Patient data included
  - ✅ Shop isolation maintained

---

### **6. GET /doctor/prescriptions/:id**

- **Description**: Get specific prescription by ID
- **Type**: Protected Route
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/prescriptions/{{prescriptionId}}`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}"
  }
  ```
- **Expected Response (200)**:
  ```json
  {
    "id": 1,
    "patientId": 1,
    "rightEye": {
      "axis": 90,
      "sphere": -2.5,
      "cylinder": -0.5
    },
    "leftEye": {
      "axis": 85,
      "sphere": -2,
      "cylinder": -0.25
    },
    "createdAt": "2025-09-23T03:47:24.379Z",
    "updatedAt": "2025-09-23T03:47:24.379Z",
    "patient": {
      "id": 1,
      "name": "Test Patient",
      "age": 35,
      "gender": "Male",
      "phone": "+1234567890",
      "address": "123 Test St",
      "medicalHistory": "No major issues",
      "shop": {
        "id": 3,
        "name": "Test Optical Shop"
      }
    }
  }
  ```
- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Prescription details complete
  - ✅ Patient information included
  - ✅ Eye measurements accurate
  - ✅ Shop access validation

---

## 🖨️ **DOCUMENT GENERATION ENDPOINTS**

### **7. GET /doctor/prescriptions/:id/pdf**

- **Description**: Generate PDF document for prescription
- **Type**: Protected Route
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/prescriptions/{{prescriptionId}}/pdf`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}"
  }
  ```
- **Expected Response (200)**:
  - **Content-Type**: `application/pdf`
  - **Content-Disposition**: `attachment; filename="Prescription-1.pdf"`
  - **Body**: Binary PDF file
- **Postman Test Script**:

  ```javascript
  pm.test("PDF generated successfully", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.headers.get("Content-Type")).to.include(
      "application/pdf"
    );
  });

  pm.test("PDF has correct filename", function () {
    var disposition = pm.response.headers.get("Content-Disposition");
    pm.expect(disposition).to.include("Prescription-");
    pm.expect(disposition).to.include(".pdf");
  });
  ```

- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Content-Type is application/pdf
  - ✅ File downloads correctly
  - ✅ Filename includes prescription ID
  - ✅ PDF contains prescription data

---

### **8. GET /doctor/prescriptions/:id/thermal**

- **Description**: Generate thermal printer receipt for prescription
- **Type**: Protected Route
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/prescriptions/{{prescriptionId}}/thermal`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer {{doctorToken}}"
  }
  ```
- **Expected Response (200)**:

  - **Content-Type**: `text/plain`
  - **Content-Disposition**: `attachment; filename="Prescription-1-Thermal.txt"`
  - **Body**:

    ```
                      PRESCRIPTION
                   Test Optical Shop
                      123 Main St
    ------------------------------------------------
    Prescription ID:                               1
    Date:                                  23/9/2025
    Doctor:                     Dr. John Optometrist
    ------------------------------------------------
                  PATIENT INFORMATION
    Name:                               Test Patient
    Age:                                    35 years
    Gender:                                     Male
    Phone:                               +1234567890
    ------------------------------------------------
                  PRESCRIPTION DETAILS

    Right Eye (OD):
      Sphere: -2.5
      Cylinder: -0.5
      Axis: 90°

    Left Eye (OS):
      Sphere: -2
      Cylinder: -0.25
      Axis: 85°
    ------------------------------------------------
                    MEDICAL HISTORY
    No major issues
    ------------------------------------------------
            Generated: 23/9/2025, 9:22:49 am
    ------------------------------------------------
    ```

- **Postman Test Script**:

  ```javascript
  pm.test("Thermal print generated successfully", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.headers.get("Content-Type")).to.include("text/plain");
  });

  pm.test("Thermal print has correct filename", function () {
    var disposition = pm.response.headers.get("Content-Disposition");
    pm.expect(disposition).to.include("Prescription-");
    pm.expect(disposition).to.include("Thermal.txt");
  });

  pm.test("Thermal print contains prescription data", function () {
    var responseText = pm.response.text();
    pm.expect(responseText).to.include("PRESCRIPTION");
    pm.expect(responseText).to.include("Right Eye");
    pm.expect(responseText).to.include("Left Eye");
  });
  ```

- **Tests to Include**:
  - ✅ Status code is 200
  - ✅ Content-Type is text/plain
  - ✅ File downloads correctly
  - ✅ Thermal format is correct (48-char width)
  - ✅ Contains all prescription details

---

## 🚫 **ERROR TESTING SCENARIOS**

### **9. Invalid Authentication Test**

- **Description**: Test endpoints with invalid/expired tokens
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/patients`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer invalid_token_here"
  }
  ```
- **Expected Response (400)**:
  ```json
  {
    "msg": "Token is not valid"
  }
  ```

### **10. Missing Authentication Test**

- **Description**: Test protected endpoints without token
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/patients`
- **Headers**: None
- **Expected Response (401)**:
  ```json
  {
    "msg": "No token, authorization denied"
  }
  ```

### **11. Invalid Login Credentials**

- **Description**: Test login with wrong credentials
- **Method**: POST
- **URL**: `{{baseUrl}}/doctor/login`
- **Request Body**:
  ```json
  {
    "email": "invalid@doctor.com",
    "password": "wrongpassword"
  }
  ```
- **Expected Response (404)**:
  ```json
  {
    "error": "Doctor not found."
  }
  ```

### **12. Prescription Validation Errors**

- **Description**: Test prescription creation with invalid data
- **Method**: POST
- **URL**: `{{baseUrl}}/doctor/prescriptions`
- **Request Body** (Missing patientId):
  ```json
  {
    "rightEye": { "sphere": -2.5 },
    "leftEye": { "sphere": -2.0 }
  }
  ```
- **Expected Response (400)**:
  ```json
  {
    "error": "Patient ID is required."
  }
  ```

### **13. Non-existent Resource**

- **Description**: Test accessing prescription that doesn't exist
- **Method**: GET
- **URL**: `{{baseUrl}}/doctor/prescriptions/99999`
- **Expected Response (404)**:
  ```json
  {
    "error": "Prescription not found."
  }
  ```

---

## 📋 **POSTMAN COLLECTION STRUCTURE**

### **Recommended Collection Organization**:

```
Doctor Portal API
├── 🔐 Authentication
│   ├── Login Doctor
│   └── Logout Doctor
├── 👥 Patient Management
│   └── Get All Patients
├── 📋 Prescription Management
│   ├── Create Prescription
│   ├── Get All Prescriptions
│   └── Get Single Prescription
├── 🖨️ Document Generation
│   ├── Generate PDF
│   └── Generate Thermal Print
└── 🚫 Error Testing
    ├── Invalid Auth Test
    ├── Missing Auth Test
    ├── Invalid Login Test
    ├── Validation Error Test
    └── Non-existent Resource Test
```

---

## 🔧 **COLLECTION-LEVEL SCRIPTS**

### **Pre-request Script (Collection Level)**:

```javascript
// Auto-login if token is missing or expired for protected routes
if (
  pm.request.url.toString().includes("/doctor/") &&
  !pm.request.url.toString().includes("/login") &&
  !pm.environment.get("doctorToken")
) {
  pm.sendRequest(
    {
      url: pm.environment.get("baseUrl") + "/doctor/login",
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
      body: {
        mode: "raw",
        raw: JSON.stringify({
          email: pm.environment.get("doctorEmail"),
          password: pm.environment.get("doctorPassword"),
        }),
      },
    },
    function (err, response) {
      if (response.code === 200) {
        var jsonData = response.json();
        pm.environment.set("doctorToken", jsonData.token);
      }
    }
  );
}
```

### **Test Script (Collection Level)**:

```javascript
// Global test for response time
pm.test("Response time is less than 2000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Global test for content type on JSON responses
if (
  pm.response.headers.get("Content-Type") &&
  pm.response.headers.get("Content-Type").includes("application/json")
) {
  pm.test("Response is valid JSON", function () {
    pm.response.to.be.json;
  });
}
```

---

## 📊 **TESTING CHECKLIST**

### **Functional Testing**:

- [ ] Doctor login with attendance tracking
- [ ] Doctor logout with attendance completion
- [ ] Patient list retrieval (shop-specific)
- [ ] Prescription creation with validation
- [ ] Prescription listing with pagination
- [ ] Individual prescription retrieval
- [ ] PDF generation and download
- [ ] Thermal print generation and download

### **Security Testing**:

- [ ] Authentication required for protected routes
- [ ] Token validation working
- [ ] Shop-based data isolation
- [ ] Role-based access (OPTOMETRIST only)
- [ ] Invalid credentials rejection
- [ ] SQL injection prevention

### **Performance Testing**:

- [ ] Response times under 2 seconds
- [ ] PDF generation within 5 seconds
- [ ] Thermal print generation within 3 seconds
- [ ] Pagination efficiency

### **Integration Testing**:

- [ ] Patient data from staff portal visible
- [ ] Attendance tracking in shop admin portal
- [ ] Prescription data consistency
- [ ] File download functionality

---

## 🎯 **SUCCESS CRITERIA**

✅ **All 8 endpoints respond correctly**
✅ **Authentication/authorization working**
✅ **PDF and thermal printing functional**
✅ **Shop-based data isolation maintained**
✅ **Error handling comprehensive**
✅ **Response times acceptable**
✅ **File downloads working**
✅ **Integration with other portals confirmed**

---

## 📝 **NOTES**

- **Environment**: Ensure server is running on `localhost:8080`
- **Database**: PostgreSQL with proper seeded data
- **Dependencies**: PDFKit for PDF generation
- **Printer**: Thermal printer width configurable via `THERMAL_PRINTER_WIDTH` env var
- **Authentication**: JWT tokens with 24-hour expiration
- **Role**: Only users with `OPTOMETRIST` role can access doctor portal

---

**Total Test Cases**: 13 core + 5 error scenarios = **18 test cases**
**Expected Testing Time**: 2-3 hours for complete coverage
**Tools Required**: Postman, Running Server, Valid Test Data
