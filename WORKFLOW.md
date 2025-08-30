# Backend Workflow

This document outlines the architecture and data flow of the backend system.

## 1. Core Technology Stack

*   **Framework:** Express.js
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** JSON Web Tokens (JWT)

## 2. Project Structure

The project follows a standard Model-View-Controller (MVC) pattern:

*   **`routes/`:** Defines the API endpoints.
*   **`controllers/`:** Contains the business logic for each endpoint.
*   **`prisma/`:** Manages the database schema and migrations.
*   **`middleware/`:** Includes custom middleware, such as authentication checks.

## 3. Workflow

### 1. Request Lifecycle

1.  **Request:** A client sends an HTTP request to a specific endpoint (e.g., `POST /api/invoice`).
2.  **Routing:** Express matches the request to the corresponding route defined in the `routes/` directory.
3.  **Middleware:** The request passes through any middleware assigned to the route, such as the `auth.js` middleware for JWT verification.
4.  **Controller:** The route forwards the request to the appropriate controller function (e.g., `createInvoice` in `invoiceController.js`).
5.  **Prisma Client:** The controller uses the Prisma client to interact with the database.
6.  **Database:** Prisma sends the query to the PostgreSQL database.
7.  **Response:** The controller sends a response back to the client, typically in JSON format.

### 2. Authentication

1.  **Login:** A staff member logs in with their email and password via the `/api/auth/login` endpoint.
2.  **JWT Creation:** Upon successful authentication, a JWT is generated and signed with a secret key.
3.  **Token:** The JWT is sent back to the client.
4.  **Authenticated Requests:** For protected endpoints, the client must include the JWT in the `Authorization` header as a bearer token.
5.  **Verification:** The `auth.js` middleware intercepts the request, verifies the JWT, and attaches the user's information to the request object.

### 3. Database Management

*   **Schema:** The database schema is defined in `prisma/schema.prisma`.
*   **Migrations:** Database migrations are managed using the `prisma migrate` command. This ensures that the database schema stays in sync with the application's models.
*   **Seeding:** The `seed-staff.js` file can be used to populate the database with initial staff data.

## 4. Key Workflows

### Creating an Invoice

1.  The client sends a `POST` request to `/api/invoice` with the patient ID and a list of items.
2.  The `createInvoice` function in `invoiceController.js` is called.
3.  The controller validates the request and calculates the total amount.
4.  A new invoice and its associated items are created in the database within a transaction to ensure data integrity.
5.  The inventory is updated to reflect the new sale.

### Generating a PDF or Thermal Receipt

1.  The client sends a `GET` request to `/api/invoice/:id/pdf` or `/api/invoice/:id/thermal`.
2.  The corresponding controller function fetches the invoice data from the database.
3.  For PDFs, the `pdfkit` library is used to generate the document.
4.  For thermal receipts, a plain text response is formatted and sent.
