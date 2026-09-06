# TechEdge Market — API Documentation

Base URL: `http://localhost:5000/api`

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Response Format

Every endpoint returns this shape:
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "meta": {
    "page": 1, "limit": 20,
    "total": 100, "totalPages": 5,
    "hasNext": true, "hasPrev": false
  }
}
```

---

## AUTH  `/api/auth`

| Method | Endpoint          | Auth | Role | Description            |
|--------|-------------------|------|------|------------------------|
| POST   | /register         | ✗    | —    | Register new customer  |
| POST   | /login            | ✗    | —    | Login, get JWT tokens  |
| POST   | /refresh          | ✗    | —    | Refresh access token   |
| POST   | /logout           | ✓    | any  | Logout (client clears) |
| GET    | /me               | ✓    | any  | Get current user       |

### POST /api/auth/register
```json
{
  "name":    "Raj Mehta",
  "email":   "raj@company.in",
  "password":"Secure@123",
  "company": "Indopack Machines",
  "phone":   "+91-9876543210",
  "gstin":   "27AABCI1234B1Z5"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "user":         { "id":"...", "name":"Raj Mehta", "role":"customer" },
    "accessToken":  "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST /api/auth/login
```json
{ "email": "admin@techedgemarket.in", "password": "Admin@1234" }
```

---

## PRODUCTS  `/api/products`

| Method | Endpoint              | Auth | Role           | Description              |
|--------|-----------------------|------|----------------|--------------------------|
| GET    | /                     | ✗    | —              | List products (paginated)|
| GET    | /:id                  | ✗    | —              | Get product by ID        |
| GET    | /sku/:sku             | ✗    | —              | Get product by SKU       |
| POST   | /                     | ✓    | admin,manager  | Create product           |
| PUT    | /:id                  | ✓    | admin,manager  | Update product           |
| DELETE | /:id                  | ✓    | admin          | Soft delete product      |
| PATCH  | /:id/featured         | ✓    | admin,manager  | Toggle featured flag     |

### Query Parameters (GET /)
```
?page=1
&limit=20
&search=siemens
&category=Automation
&brand=Siemens
&featured=true
&sort=price
&order=asc
```

### POST /api/products  (admin/manager)
```json
{
  "name":         "Siemens SIMATIC S7-1500 PLC",
  "description":  "High performance PLC for demanding automation",
  "price":        1250.00,
  "originalPrice":1500.00,
  "category":     "Automation",
  "brand":        "Siemens",
  "model":        "6ES7515-2AM02-0AB0",
  "partNumber":   "6ES7515-2AM02-0AB0",
  "stock":        15,
  "leadTime":     "3–5 days",
  "tags":         ["plc","siemens","s7-1500"],
  "featured":     true,
  "badge":        "New",
  "specs":        { "CPU":"CPU 1515-2 PN","Supply":"24 VDC" }
}
```
Response includes auto-generated `sku: "SIE-AUT-6ES751"`.

---

## ORDERS  `/api/orders`

| Method | Endpoint              | Auth | Role           | Description                     |
|--------|-----------------------|------|----------------|---------------------------------|
| GET    | /                     | ✓    | any            | List orders (own or all for admin)|
| GET    | /:id                  | ✓    | any            | Get order by ID                 |
| POST   | /                     | ✓    | any            | Place new order                 |
| PATCH  | /:id/status           | ✓    | admin,manager  | Update order status             |

### POST /api/orders
```json
{
  "items": [
    { "productId": "p001", "quantity": 3 },
    { "productId": "p007", "quantity": 10 }
  ],
  "paymentMethod":  "Bank Transfer (NEFT)",
  "poReference":    "IPM/PO/25-0388",
  "shippingAddress": {
    "street": "Plot 22, MIDC Industrial Area",
    "city":   "Pune",
    "state":  "Maharashtra",
    "zip":    "411019",
    "country":"India"
  },
  "notes": "Handle with care"
}
```
Response includes auto-calculated GST, shipping, and order number `TEM-2025-00142`.

### PATCH /api/orders/:id/status  (admin/manager)
```json
{
  "status":           "shipped",
  "trackingNumber":   "DTDC9912345678",
  "estimatedDelivery":"2025-04-10"
}
```
**Valid status transitions:**
```
pending → confirmed → processing → shipped → delivered → refunded
pending → cancelled
confirmed → cancelled
processing → cancelled
```

---

## INVENTORY  `/api/inventory`

| Method | Endpoint         | Auth | Role          | Description          |
|--------|------------------|------|---------------|----------------------|
| GET    | /                | ✓    | admin,manager | All inventory items  |
| GET    | /low-stock       | ✓    | admin,manager | Low & out of stock   |
| PATCH  | /:id             | ✓    | admin,manager | Update stock levels  |

---

## PROCUREMENT  `/api/procurement`

| Method | Endpoint         | Auth | Role          | Description          |
|--------|------------------|------|---------------|----------------------|
| GET    | /                | ✓    | admin,manager | All purchase orders  |
| GET    | /:id             | ✓    | admin,manager | Single PO            |
| POST   | /                | ✓    | admin,manager | Create PO            |
| PATCH  | /:id/status      | ✓    | admin,manager | Update PO status     |

---

## PROSPECTS / CRM  `/api/prospects`

| Method | Endpoint  | Auth | Role                   | Description          |
|--------|-----------|------|------------------------|----------------------|
| GET    | /         | ✓    | admin,manager,sales    | All prospects        |
| GET    | /:id      | ✓    | admin,manager,sales    | Single prospect      |
| POST   | /         | ✓    | admin,manager,sales    | Create prospect      |
| PUT    | /:id      | ✓    | admin,manager,sales    | Update prospect      |
| DELETE | /:id      | ✓    | admin                  | Delete prospect      |

---

## SERVICE TICKETS  `/api/tickets`

| Method | Endpoint  | Auth | Role | Description          |
|--------|-----------|------|------|----------------------|
| GET    | /         | ✓    | any  | All tickets          |
| GET    | /:id      | ✓    | any  | Single ticket        |
| POST   | /         | ✓    | any  | Create ticket        |
| PATCH  | /:id      | ✓    | any  | Update ticket        |

### Query Parameters
```
?status=open
&priority=critical
&search=plc
```

---

## ANALYTICS  `/api/analytics`

| Method | Endpoint   | Auth | Role          | Description        |
|--------|------------|------|---------------|--------------------|
| GET    | /analytics | ✓    | admin,manager | Business overview  |

---

## User Roles

| Role     | Access Level                                        |
|----------|-----------------------------------------------------|
| admin    | Full access — all endpoints                         |
| manager  | Products, Orders, Inventory, Procurement, Prospects |
| sales    | Prospects only                                      |
| customer | Own orders only, public products                    |

---

## Error Codes

| Code | Meaning                |
|------|------------------------|
| 400  | Validation error       |
| 401  | Unauthorized           |
| 403  | Forbidden (wrong role) |
| 404  | Not found              |
| 409  | Conflict (duplicate)   |
| 422  | Validation failed      |
| 429  | Rate limit exceeded    |
| 500  | Internal server error  |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env

# 3. Seed database
npm run seed

# 4. Start dev server
npm run dev

# 5. Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techedgemarket.in","password":"Admin@1234"}'

# 6. Get products (public)
curl http://localhost:5000/api/products

# 7. Create product (admin token required)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test PLC","price":500,"category":"Automation","brand":"Siemens","model":"S7-TEST","partNumber":"TEST-001","stock":10}'
```

---

## Connecting the Next.js Frontend

Replace static data calls with API calls using the interceptor:

```typescript
// src/lib/interceptor.ts is already set up!
// Just set the base URL and token:

import api, { setAuthToken } from "@/lib/interceptor";

// After login:
setAuthToken(response.data.accessToken);

// Fetch products:
const { data } = await api.get<Product[]>("/api/products");

// Create product:
const { data } = await api.post<Product>("/api/products", productData);

// Update order status:
await api.patch(`/api/orders/${id}/status`, { status: "confirmed" });
```
