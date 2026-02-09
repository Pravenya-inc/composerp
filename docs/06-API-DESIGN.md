# API Design

This document defines the **API contracts and standards** for Composerp services.

## API Principles

1. **RESTful** - Follow REST principles
2. **GraphQL** - Optional GraphQL support for flexible queries
3. **Versioning** - API versioning (e.g., `/v1/`, `/v2/`)
4. **Pagination** - All list endpoints support pagination
5. **Filtering** - Support filtering and sorting
6. **Error Handling** - Consistent error responses
7. **Authentication** - OAuth 2.0 / JWT tokens
8. **Multi-Tenancy** - Tenant isolation via `tenantId` header or JWT claim

---

## API Structure

### Base URL
```
https://api.composerp.com/v1
```

### Service-Specific URLs
```
https://inventory.composerp.com/v1      # Inventory Ledger Service
https://forecast.composerp.com/v1       # Forecasting Service
https://replenish.composerp.com/v1      # Replenishment Service
https://planning.composerp.com/v1        # Planning Service
```

### API Gateway (Unified)
```
https://api.composerp.com/v1/inventory  # Routes to Inventory Service
https://api.composerp.com/v1/forecast   # Routes to Forecast Service
https://api.composerp.com/v1/replenish  # Routes to Replenishment Service
```

---

## Authentication

### OAuth 2.0 / JWT

**Request Header:**
```
Authorization: Bearer <jwt_token>
```

**JWT Claims:**
```json
{
  "sub": "user_id",
  "tenantId": "tenant_uuid",
  "roles": ["admin", "user"],
  "exp": 1234567890
}
```

**Tenant Isolation:**
- `tenantId` extracted from JWT claim
- All queries filtered by `tenantId`
- Cross-tenant access requires platform admin role

---

## Common Patterns

### Pagination

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `cursor` - Cursor-based pagination (alternative)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering

**Query Parameters:**
- `filter[field]=value` - Filter by field
- `filter[field][gte]=value` - Greater than or equal
- `filter[field][lte]=value` - Less than or equal
- `filter[field][in]=value1,value2` - In array

**Example:**
```
GET /items?filter[category]=Grocery&filter[isActive]=true
GET /inventory/positions?filter[locationId]=loc-123&filter[available][lte]=10
```

### Sorting

**Query Parameters:**
- `sort=field` - Sort ascending
- `sort=-field` - Sort descending
- `sort=field1,-field2` - Multiple fields

**Example:**
```
GET /items?sort=-createdAt
GET /transactions?sort=createdAt,-quantity
```

### Field Selection

**Query Parameters:**
- `fields=field1,field2` - Select specific fields
- `include=relation1,relation2` - Include relations

**Example:**
```
GET /items?fields=id,name,sku&include=supplierItems
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    },
    "requestId": "request-uuid",
    "timestamp": "2026-02-09T12:00:00Z"
  }
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no content
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service unavailable

### Error Codes

- `VALIDATION_ERROR` - Validation failed
- `NOT_FOUND` - Resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `INSUFFICIENT_PERMISSIONS` - Permission denied
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `SERVICE_UNAVAILABLE` - Service unavailable
- `INTERNAL_ERROR` - Internal server error

---

## Inventory Ledger Service API

### Base Path
```
/inventory
```

### Endpoints

#### Get Inventory Position
```
GET /inventory/positions/:itemId/:locationId
```

**Response:**
```json
{
  "id": "pos-uuid",
  "tenantId": "tenant-uuid",
  "itemId": "item-uuid",
  "locationId": "location-uuid",
  "onHand": 100.0,
  "onOrder": 50.0,
  "inTransit": 25.0,
  "reserved": 10.0,
  "damaged": 5.0,
  "available": 85.0,
  "lastUpdatedAt": "2026-02-09T12:00:00Z",
  "item": {
    "id": "item-uuid",
    "sku": "SKU-123",
    "name": "Product Name"
  },
  "location": {
    "id": "location-uuid",
    "code": "STORE-001",
    "name": "Store 001"
  }
}
```

#### List Inventory Positions
```
GET /inventory/positions?locationId=loc-123&filter[available][lte]=10
```

**Response:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

#### Create Transaction
```
POST /inventory/transactions
```

**Request Body:**
```json
{
  "itemId": "item-uuid",
  "locationId": "location-uuid",
  "transactionType": "SALE",
  "quantity": 5.0,
  "unitCost": 10.50,
  "referenceId": "sale-uuid",
  "referenceType": "SALES_ORDER",
  "notes": "Customer sale",
  "metadata": {
    "cashierId": "cashier-123"
  }
}
```

**Response:**
```json
{
  "transaction": {
    "id": "txn-uuid",
    "tenantId": "tenant-uuid",
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "transactionType": "SALE",
    "quantity": 5.0,
    "unitCost": 10.50,
    "referenceId": "sale-uuid",
    "referenceType": "SALES_ORDER",
    "createdAt": "2026-02-09T12:00:00Z"
  },
  "position": {
    "id": "pos-uuid",
    "onHand": 95.0,
    "available": 80.0,
    "lastUpdatedAt": "2026-02-09T12:00:00Z"
  }
}
```

#### List Transactions
```
GET /inventory/transactions?itemId=item-123&locationId=loc-123&filter[transactionType]=SALE
```

---

## Forecasting Service API

### Base Path
```
/forecasts
```

### Endpoints

#### Generate Forecast
```
POST /forecasts/generate
```

**Request Body:**
```json
{
  "itemId": "item-uuid",
  "locationId": "location-uuid",
  "modelType": "BASELINE",
  "periods": 4,
  "forecastDays": 30
}
```

**Response:**
```json
{
  "forecasts": [
    {
      "id": "forecast-uuid",
      "itemId": "item-uuid",
      "locationId": "location-uuid",
      "forecastDate": "2026-02-10",
      "forecastedQuantity": 25.5,
      "confidence": 70.0,
      "modelType": "BASELINE"
    },
    ...
  ]
}
```

#### Get Forecasts
```
GET /forecasts?itemId=item-123&locationId=loc-123&startDate=2026-02-10&endDate=2026-03-10
```

**Response:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

#### Get Forecast Accuracy
```
GET /forecasts/accuracy?itemId=item-123&locationId=loc-123&startDate=2026-01-01&endDate=2026-01-31
```

**Response:**
```json
{
  "itemId": "item-uuid",
  "locationId": "location-uuid",
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "accuracy": {
    "mape": 15.5,
    "mae": 5.2,
    "rmse": 7.8
  },
  "forecastCount": 30,
  "actualCount": 30
}
```

---

## Replenishment Service API

### Base Path
```
/replenishment
```

### Endpoints

#### Evaluate Replenishment
```
POST /replenishment/evaluate
```

**Request Body:**
```json
{
  "locationId": "location-uuid"
}
```

**Response:**
```json
{
  "locationId": "location-uuid",
  "evaluatedAt": "2026-02-09T12:00:00Z",
  "purchaseOrders": [
    {
      "id": "po-uuid",
      "poNumber": "PO-2026-001",
      "supplierId": "supplier-uuid",
      "status": "PENDING",
      "totalAmount": 5000.00,
      "lines": [...]
    }
  ],
  "rulesEvaluated": 15,
  "reordersTriggered": 3
}
```

#### List Replenishment Rules
```
GET /replenishment/rules?locationId=loc-123&filter[isActive]=true
```

#### Create Replenishment Rule
```
POST /replenishment/rules
```

**Request Body:**
```json
{
  "itemId": "item-uuid",
  "locationId": "location-uuid",
  "ruleType": "MIN_MAX",
  "minStock": 10.0,
  "maxStock": 100.0,
  "priority": 50,
  "isActive": true
}
```

#### Update Replenishment Rule
```
PUT /replenishment/rules/:id
```

#### List Purchase Orders
```
GET /purchase-orders?status=PENDING&filter[supplierId]=supplier-123
```

#### Get Purchase Order
```
GET /purchase-orders/:id
```

#### Approve Purchase Order
```
POST /purchase-orders/:id/approve
```

**Response:**
```json
{
  "id": "po-uuid",
  "status": "APPROVED",
  "approvedAt": "2026-02-09T12:00:00Z",
  "approvedBy": "user-uuid"
}
```

#### Send Purchase Order
```
POST /purchase-orders/:id/send
```

---

## Common Entity APIs

### Items

#### List Items
```
GET /items?filter[category]=Grocery&filter[isActive]=true&sort=-createdAt
```

#### Get Item
```
GET /items/:id
```

#### Create Item
```
POST /items
```

**Request Body:**
```json
{
  "sku": "SKU-123",
  "name": "Product Name",
  "description": "Product description",
  "category": "Grocery",
  "subCategory": "Dairy",
  "brand": "Brand Name",
  "unitOfMeasure": "EA",
  "temperatureZone": "REFRIGERATED",
  "customAttributes": {
    "barcode": "1234567890123",
    "shelfLife": 30
  }
}
```

#### Update Item
```
PUT /items/:id
```

### Suppliers

#### List Suppliers
```
GET /suppliers?filter[isActive]=true
```

#### Get Supplier
```
GET /suppliers/:id
```

#### Create Supplier
```
POST /suppliers
```

### Locations

#### List Locations
```
GET /locations?filter[type]=STORE&filter[isActive]=true
```

#### Get Location
```
GET /locations/:id
```

#### Create Location
```
POST /locations
```

---

## GraphQL API (Optional)

### Schema Example

```graphql
type Query {
  inventoryPosition(itemId: ID!, locationId: ID!): InventoryPosition
  inventoryPositions(locationId: ID, filter: InventoryFilter): [InventoryPosition!]!
  forecasts(itemId: ID!, locationId: ID!, startDate: Date!, endDate: Date!): [Forecast!]!
  purchaseOrders(status: PurchaseOrderStatus, locationId: ID): [PurchaseOrder!]!
}

type Mutation {
  createTransaction(input: CreateTransactionInput!): TransactionResponse!
  generateForecast(input: GenerateForecastInput!): [Forecast!]!
  evaluateReplenishment(locationId: ID!): ReplenishmentResponse!
  createPurchaseOrder(input: CreatePurchaseOrderInput!): PurchaseOrder!
}

type InventoryPosition {
  id: ID!
  item: Item!
  location: Location!
  onHand: Float!
  available: Float!
  lastUpdatedAt: DateTime!
}
```

---

## Rate Limiting

### Limits
- **Authenticated:** 1000 requests/hour
- **Service-to-Service:** 10000 requests/hour
- **Public:** 100 requests/hour

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1234567890
```

---

## Webhooks (Future)

### Supported Events
- `inventory.updated`
- `purchase_order.created`
- `purchase_order.approved`
- `forecast.generated`

### Webhook Payload
```json
{
  "event": "inventory.updated",
  "timestamp": "2026-02-09T12:00:00Z",
  "data": {
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "position": {...}
  }
}
```

---

*Next: [Event-Driven Architecture](./07-EVENT-DRIVEN.md)*
