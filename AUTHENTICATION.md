# Authentication with JWT

This guide explains how to obtain and use a JSON Web Token (JWT) to authenticate with the API.

## How to Get Your JWT

To get your JWT, you need to send a `POST` request to the login endpoint with your staff credentials.

1.  **URL:** `http://localhost:3000/api/auth/login`
2.  **Method:** `POST`
3.  **Headers:** `Content-Type: application/json`
4.  **Body:**
    ```json
    {
      "email": "staff@example.com",
      "password": "password"
    }
    ```

**Example using cURL:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "email": "staff@example.com",
    "password": "password"
}'
```

**Success Response:**

The API will return a token in the response body.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU2NTM1MTQyLCJleHAiOjE3NTY2MjE1NDJ9.YXGu3P4HT2qfJ50YEV77ArE2ff0n0I0rWRKJKMLfCt4"
}
```

## How to Use Your JWT

For every protected endpoint, you must include the token in your request's `Authorization` header. The token should be in the format `Bearer <YOUR_JWT>`.

### Using Postman

1.  Go to the **Authorization** tab in your Postman request.
2.  Select **Bearer Token** from the **Type** dropdown.
3.  Paste the JWT you received from the login response into the **Token** field.

![Postman Authorization Header](https://i.imgur.com/7k3vL9A.png)

### Using cURL

Here is an example of how to use the token in a `cURL` command to access a protected endpoint:

```bash
curl -X GET http://localhost:3000/api/product \
-H "Authorization: Bearer <YOUR_JWT>"
```