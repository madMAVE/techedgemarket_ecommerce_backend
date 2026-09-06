# TechEdge Market – Bulk Product Upload API Documentation

## Endpoint

| Method | URL                      | Description                  |
|--------|--------------------------|------------------------------|
| POST   | `/api/products`          | Create a single product      |
| POST   | `/api/products/bulk`     | Create multiple products     |

> **Note:** The frontend currently calls `POST /api/products` in a loop for each product. If the backend supports a bulk endpoint, switch to a single call.

---

## Request Body (Single Product)

```json
{
  "name":            "string",
  "description":     "string",
  "price":           "number",
  "originalPrice":   "number | null",
  "category":        "string",
  "subcategory":     "string | null",
  "brand":           "string",
  "model":           "string",
  "partNumber":      "string",
  "stock":           "number",
  "leadTime":        "string | null",
  "keywords":         "string[] | null",
  "featured":        "boolean | null",
  "badge":           "string | null",
  "specs":           "object | null",
  "image":           "string | null",
  "images":          "string[] | null",
  "isActive":        "boolean"
}
```

---

## Parameter Details

| Parameter       | Data Type              | Required | Description                                                                 |
|-----------------|------------------------|----------|-----------------------------------------------------------------------------|
| `name`          | `string`               | ✅ Yes   | Full product name. Used in SKU generation (initials of each word).          |
| `description`   | `string`               | ✅ Yes   | Product description / key features.                                         |
| `price`         | `number`               | ✅ Yes   | Selling price in INR. Must be > 0.                                          |
| `originalPrice` | `number / null`        | ✅ Yes   | MRP / original price. If provided and > price, discount % is shown.         |
| `category`      | `string`               | ✅ Yes   | Must be one of the allowed categories (see below).                          |
| `subcategory`   | `string / null`        | ❌ No    | Sub-category within the main category. Usually blank.                       |
| `brand`         | `string`               | ✅ Yes   | Brand name (e.g. "Siemens", "ABB"). NOT a UUID.                             |
| `model`         | `string`               | ❌ No    | Manufacturer model number.                                                  |
| `partNumber`    | `string`               | ❌ No    | Manufacturer part number.                                                   |
| `stock`         | `number`               | ❌ No    | Available quantity. Defaults to 0 if missing.                               |
| `leadTime`      | `string / null`        | ❌ No    | Delivery lead time (e.g. "3–5 days").                                       |
| `keywords`        | `string[] / null`    | ❌ No    | Array of search / filter keywords.                                              |
| `featured`      | `boolean / null`       | ❌ No    | Show on homepage featured section. Defaults to false.                       |
| `badge`         | `string / null`        | ❌ No    | Display badge text (e.g. "New", "Best Seller", "Sale").                     |
| `specs`         | `object / null`        | ❌ No    | Key-value pairs of technical specifications.                                |
| `image`         | `string / null`        | ❌ No    | Primary image URL. Falls back to placeholder if null/empty.                 |
| `images`        | `string[] / null`      | ❌ No    | Array of additional image URLs.                                             |
| `isActive`      | `boolean`              | ❌ No    | Whether product is visible/active in shop. Defaults to true.                |

---

## Allowed Categories

```
"Automation"
"Switchgear"
"Drives & Motors"
"Safety Systems"
"Sensors & Instrumentation"
"Cables & Wiring"
"Control Panels"
"Spare Parts"
```

---

## Allowed Brands

```
"Siemens"
"ABB"
"Schneider Electric"
"Omron"
"Allen-Bradley"
"Mitsubishi"
"SICK"
"Keyence"
"Pilz"
"Fluke"
"Rittal"
"Belden"
"Eaton"
"Endress+Hauser"
"Balluff"
"TechEdge OEM"
```

---

## SKU Generation Rule

The backend generates the SKU automatically using this format:

```
{NAME_INITIALS}-{BRAND_INITIAL}-{UUID}
```

- **NAME_INITIALS** = First letter of each word in the product name (uppercase)
- **BRAND_INITIAL** = First letter of the brand name (uppercase)
- **UUID** = A unique identifier (v4 UUID or equivalent)

### Examples

| Product Name              | Brand    | SKU Example                              |
|---------------------------|----------|------------------------------------------|
| Temperature Controller    | ABB      | `TC-A-f47ac10b-58cc-4372...`             |
| Siemens S7-1200 PLC       | Siemens  | `SSPLC-S-a3f2b8c1-...`                   |
| ABB ACS580 VFD            | ABB      | `AAV-A-b9e4d7f2-...`                     |
| Schneider Emergency Stop  | Schneider Electric | `SES-S-c1d8e3a5-...`              |

> **Note:** The frontend also generates the SKU client-side using `crypto.randomUUID()`. If the backend generates its own SKU, the response `sku` field takes precedence.

---

## Response (Success – 201 Created)

```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "price": "number",
  "originalPrice": "number | null",
  "category": "string",
  "subcategory": "string | null",
  "brand": "string",
  "model": "string",
  "partNumber": "string",
  "sku": "string",
  "image": "string",
  "images": "string[] | null",
  "rating": "number",
  "reviews": "number",
  "stock": "number",
  "keywords": "string[]",
  "featured": "boolean",
  "badge": "string | null",
  "specs": "object | null",
  "leadTime": "string | null",
  "isActive": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

---

## Response (Error – 4xx)

```json
{
  "message": "string",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

---

## CSV / Excel Upload – Column Mapping

The frontend parser accepts **flexible column names** (case-insensitive). Below is the mapping:

| CSV Header (accepted variations)     | Mapped Field    | Notes                                      |
|--------------------------------------|-----------------|--------------------------------------------|
| `name`, `product name`               | `name`          | Required                                   |
| `description`                        | `description`   |                                            |
| `price`                              | `price`         | Required, must be numeric                  |
| `originalPrice`, `original price`    | `originalPrice` |                                            |
| `category`                           | `category`      | Required, must be from allowed list        |
| `subcategory`                        | `subcategory`   | Usually blank                              |
| `brand`, `brandId`, `brand id`       | `brand`         | Required, must be brand NAME not UUID      |
| `model`                              | `model`         |                                            |
| `partNumber`, `part number`          | `partNumber`    | Required                                   |
| `stock`                              | `stock`         | Defaults to 0                              |
| `leadTime`, `lead time`              | `leadTime`      |                                            |
| `keywords`, `tags`                     | `keywords`      | Comma-separated in CSV → `string[]`        |
| `featured`                           | `featured`      | `"true"` / `"false"`                       |
| `badge`                              | `badge`         |                                            |
| `image`                              | `image`         | Single URL string                          |
| `images`                             | `images`        | JSON array of URLs: `["url1","url2"]`      |
| `specs`                              | `specs`         | JSON object: `{"key":"value"}`             |
| `isActive`, `is active`              | `isActive`      | `"true"` / `"false"`, defaults to true     |

---

## Sample CSV Row

```csv
name,description,price,originalPrice,category,subcategory,brand,model,partNumber,stock,leadTime,keywords,featured,badge,image,images,specs,isActive
"Temperature Controller","PID temperature controller for industrial ovens",2500.00,3000.00,Automation,Temperature Controllers,ABB,TC-200,TC200-ABB,45,3-5 days,"temperature,pid,controller",true,New,https://cdn.example.com/tc200.jpg,"[""https://cdn.example.com/tc200-1.jpg"",""https://cdn.example.com/tc200-2.jpg""]","{""range"":""0-500°C"",""accuracy"":""±0.1°C"",""input"":""Type K/J"",""output"":""4-20mA""}",true
```

---

## Bulk Upload Request (if endpoint exists)

```json
{
  "products": [
    {
      "name": "string",
      "description": "string",
      "price": "number",
      "originalPrice": "number | null",
      "category": "string",
      "subcategory": "string | null",
      "brand": "string",
      "model": "string",
      "partNumber": "string",
      "stock": "number",
      "leadTime": "string | null",
      "keywords": "string[] | null",
      "featured": "boolean | null",
      "badge": "string | null",
      "specs": "object | null",
      "image": "string | null",
      "images": "string[] | null",
      "isActive": "boolean"
    }
  ]
}
```

---

## Notes for Backend

1. **`brand`** is sent as a **string name**, NOT a UUID. If the backend needs a `brandId`, it should resolve the name to an ID server-side.
2. **`specs`** can be `null` or a flat key-value object. Nested objects are NOT expected.
3. **`images`** is an array of URL strings. Can be `null` or empty array.
4. **`image`** is a single URL string for the primary/thumbnail image.
5. **`isActive`** controls product visibility. Default to `true` if not provided.
6. **`subcategory`** is usually blank/empty. Keep it as `null` or empty string.
7. **`sku`** is auto-generated by the backend. Client-side generation is a fallback only.
8. **`rating`** and **`reviews`** are NOT sent in the upload request. Backend should default them to `4.5` and `0` respectively.
