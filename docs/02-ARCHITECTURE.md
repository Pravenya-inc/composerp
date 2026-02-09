# Composerp Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Web Portal, Mobile Apps, Third-party Integrations)        │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST/GraphQL APIs
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    API Gateway / Load Balancer               │
│              (Authentication, Rate Limiting, Routing)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│   Planning   │ │ Forecasting│ │Replenishment│
│   Service    │ │  Service   │ │  Service   │
└───────┬──────┘ └─────┬──────┘ └─────┬──────┘
        │              │              │
┌───────▼──────────────▼──────────────▼──────┐
│         Inventory Ledger Service            │
│    (Store Stock Ledger + Warehouse SL)      │
└───────┬──────────────────────────────────────┘
        │
        │ Events
        │
┌───────▼──────────────────────────────────────┐
│            Event Bus (Kafka/RabbitMQ)        │
│         (State Changes, Notifications)        │
└───────┬──────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────┐
│         Canonical Data Models (Database)      │
│    (PostgreSQL with JSON for extensibility)   │
└───────────────────────────────────────────────┘
```

## Domain Services Architecture

### Service Boundaries

Each service is a **bounded context** with:
- **Own database** (or schema) - Database per service pattern
- **Own API** - REST and/or GraphQL
- **Event publishing** - Publishes domain events
- **Event consumption** - Subscribes to relevant events

### Core Services

#### 1. Inventory Ledger Service
**Responsibilities:**
- Real-time inventory tracking (on-hand, on-order, in-transit, reserved, damaged)
- Transaction recording (receipts, sales, transfers, adjustments)
- Inventory position updates
- Store Stock Ledger (SSLE) and Warehouse Stock Ledger (WSLE)

**Database:** Own schema with `inventory_positions`, `transactions` tables

**Events Published:**
- `INVENTORY_UPDATED`
- `INVENTORY_LOW_STOCK`
- `INVENTORY_TRANSACTION_CREATED`

**Events Consumed:**
- `PURCHASE_ORDER_RECEIVED` (from Replenishment Service)
- `SALE_COMPLETED` (from external systems)

#### 2. Forecasting Service
**Responsibilities:**
- Demand forecasting by item/location/time
- Pluggable forecasting models (baseline, ML models)
- Forecast generation and storage
- Forecast accuracy tracking

**Database:** Own schema with `forecasts` table

**Events Published:**
- `FORECAST_GENERATED`
- `FORECAST_UPDATED`

**Events Consumed:**
- `INVENTORY_UPDATED` (to improve forecast accuracy)
- `SALE_COMPLETED` (to update historical data)

#### 3. Replenishment & Ordering Service
**Responsibilities:**
- Replenishment rule evaluation
- Purchase order generation
- Order quantity calculation
- Supplier management

**Database:** Own schema with `purchase_orders`, `replenishment_rules`, `suppliers` tables

**Events Published:**
- `PURCHASE_ORDER_CREATED`
- `PURCHASE_ORDER_APPROVED`
- `REPLENISHMENT_TRIGGERED`

**Events Consumed:**
- `INVENTORY_UPDATED` (to evaluate replenishment needs)
- `FORECAST_GENERATED` (for forecast-based replenishment)

#### 4. Planning Service (Future)
**Responsibilities:**
- Assortment planning
- Financial targets
- Store clusters
- Scenario planning

**Database:** Own schema

**Events Published:**
- `PLAN_CREATED`
- `PLAN_UPDATED`

## Data Architecture

### Canonical Models

Shared across services via **API contracts** and **event schemas**:

```
Item
├── id, tenantId, sku, name
├── category, subCategory, brand
├── unitOfMeasure, temperatureZone
└── customAttributes (JSON)

Supplier
├── id, tenantId, code, name
├── contactEmail, contactPhone, address
└── customAttributes (JSON)

Location
├── id, tenantId, code, name
├── type (STORE, WAREHOUSE, DC)
├── address, timezone
├── temperatureZones (array)
└── customAttributes (JSON)

InventoryPosition
├── id, tenantId, itemId, locationId
├── onHand, onOrder, inTransit
├── reserved, damaged, available
└── lastUpdatedAt

Transaction
├── id, tenantId, itemId, locationId
├── transactionType, quantity, unitCost
├── referenceId, referenceType
├── lotNumber, expiryDate
└── metadata (JSON)

Forecast
├── id, tenantId, itemId, locationId
├── forecastDate, forecastedQuantity
├── confidence, modelType
└── metadata (JSON)

PurchaseOrder
├── id, tenantId, poNumber
├── supplierId, locationId, status
├── orderDate, expectedDeliveryDate
└── lines[] (PurchaseOrderLine)
```

### Multi-Tenancy

- **Tenant isolation** at database level (`tenantId` in every table)
- **Row-level security** or application-level filtering
- **Shared infrastructure** with logical separation
- **Tenant-specific configurations** stored in database

### Extensibility

- **Custom attributes** as JSON columns
- **JSON Schema validation** for custom attributes
- **Versioned schemas** for API evolution
- **Plugin architecture** for forecasting models

## Communication Patterns

### Synchronous Communication (REST/GraphQL)
- **Service-to-service** calls for real-time queries
- **Client-to-service** direct API calls
- **API Gateway** for routing and authentication

### Asynchronous Communication (Event Bus)
- **State changes** published as events
- **Event-driven workflows** for business processes
- **Event sourcing** for audit trails
- **CQRS** pattern for read/write separation (optional)

### Event Flow Example

```
1. Sale occurs at Store A
   ↓
2. External system publishes SALE_COMPLETED event
   ↓
3. Inventory Ledger Service consumes event
   ↓
4. Updates inventory position (onHand -= quantity)
   ↓
5. Publishes INVENTORY_UPDATED event
   ↓
6. Forecasting Service consumes INVENTORY_UPDATED
   ↓
7. Updates historical data for forecast accuracy
   ↓
8. Replenishment Service consumes INVENTORY_UPDATED
   ↓
9. Evaluates replenishment rules
   ↓
10. If reorder needed, creates purchase order
    ↓
11. Publishes PURCHASE_ORDER_CREATED event
```

## Deployment Architecture

### Containerization
- Each service as **Docker container**
- **Kubernetes** for orchestration
- **Helm charts** for deployment

### Database Strategy
- **PostgreSQL** for relational data
- **JSON columns** for extensibility
- **Database per service** (or schema per service)
- **Read replicas** for scaling reads
- **Connection pooling** (PgBouncer)

### Event Bus Options
- **Apache Kafka** (recommended for scale)
- **RabbitMQ** (simpler, good for smaller scale)
- **Azure Service Bus** (cloud-native option)
- **NATS** (lightweight alternative)

### API Gateway
- **Kong** or **Traefik** for routing
- **Authentication/Authorization** middleware
- **Rate limiting** and throttling
- **Request/Response transformation**

## Scalability Considerations

### Horizontal Scaling
- **Stateless services** - scale pods horizontally
- **Database read replicas** - distribute read load
- **Event bus partitions** - parallel processing
- **Caching layer** (Redis) - reduce database load

### Performance Optimization
- **Database indexing** on tenantId, itemId, locationId
- **Materialized views** for complex queries
- **API response caching** (Redis)
- **Pagination** for large result sets
- **Batch processing** for bulk operations

### High Availability
- **Multi-AZ deployment** (availability zones)
- **Database replication** (primary + replicas)
- **Event bus replication** (Kafka replication)
- **Health checks** and auto-recovery
- **Circuit breakers** for service resilience

## Security Architecture

### Authentication & Authorization
- **OAuth 2.0 / JWT** tokens
- **Multi-tenant isolation** (tenantId validation)
- **Role-based access control** (RBAC)
- **API key authentication** for service-to-service

### Data Security
- **Encryption at rest** (database encryption)
- **Encryption in transit** (TLS/HTTPS)
- **PII data masking** in logs
- **Audit logging** for all operations

### Network Security
- **Private networks** for service communication
- **Firewall rules** (whitelist approach)
- **VPN** for on-premise integrations
- **DDoS protection** at API gateway

---

*Next: [Technology Stack](./03-TECHNOLOGY-STACK.md)*
