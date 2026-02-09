# Event-Driven Architecture

This document describes the **event-driven architecture** patterns used in Composerp.

## Principles

1. **Every business action emits events** - State changes trigger events
2. **Loose coupling** - Services communicate via events, not direct calls
3. **Event sourcing** - Events serve as audit trail
4. **Asynchronous processing** - Events processed asynchronously
5. **Event replay** - Ability to replay events for recovery/analytics

---

## Event Bus Architecture

### Event Flow

```
Service A (Producer)
    ↓
Event Bus (Kafka/RabbitMQ)
    ↓
Service B (Consumer)
    ↓
Service C (Consumer)
```

### Event Types

#### Domain Events
- **INVENTORY_UPDATED** - Inventory position changed
- **PURCHASE_ORDER_CREATED** - New purchase order created
- **FORECAST_GENERATED** - New forecast generated
- **REPLENISHMENT_TRIGGERED** - Replenishment rule triggered

#### Integration Events
- **SALE_COMPLETED** - Sale completed (from POS)
- **RECEIPT_COMPLETED** - Receipt completed (from WMS)
- **TRANSFER_INITIATED** - Transfer initiated

---

## Event Schema

### Standard Event Format

```json
{
  "eventId": "event-uuid",
  "eventType": "INVENTORY_UPDATED",
  "aggregateType": "INVENTORY_POSITION",
  "aggregateId": "position-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-02-09T12:00:00Z",
  "version": "1.0",
  "payload": {
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "onHand": 100.0,
    "available": 85.0,
    "transactionId": "txn-uuid"
  },
  "metadata": {
    "source": "inventory-ledger-service",
    "userId": "user-uuid",
    "correlationId": "correlation-uuid"
  }
}
```

### Event Fields

- **eventId** - Unique event identifier
- **eventType** - Event type (e.g., "INVENTORY_UPDATED")
- **aggregateType** - Aggregate type (e.g., "INVENTORY_POSITION")
- **aggregateId** - Aggregate identifier
- **tenantId** - Tenant identifier (for multi-tenancy)
- **timestamp** - Event timestamp
- **version** - Event schema version
- **payload** - Event-specific data
- **metadata** - Event metadata (source, user, correlation ID)

---

## Event Types

### Inventory Events

#### INVENTORY_UPDATED
**Published by:** Inventory Ledger Service  
**Consumed by:** Forecasting Service, Replenishment Service

```json
{
  "eventType": "INVENTORY_UPDATED",
  "aggregateType": "INVENTORY_POSITION",
  "payload": {
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "onHand": 100.0,
    "available": 85.0,
    "transactionId": "txn-uuid",
    "transactionType": "SALE"
  }
}
```

#### INVENTORY_LOW_STOCK
**Published by:** Inventory Ledger Service  
**Consumed by:** Alert Service, Replenishment Service

```json
{
  "eventType": "INVENTORY_LOW_STOCK",
  "aggregateType": "INVENTORY_POSITION",
  "payload": {
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "available": 5.0,
    "threshold": 10.0
  }
}
```

### Purchase Order Events

#### PURCHASE_ORDER_CREATED
**Published by:** Replenishment Service  
**Consumed by:** Procurement System, Notification Service

```json
{
  "eventType": "PURCHASE_ORDER_CREATED",
  "aggregateType": "PURCHASE_ORDER",
  "payload": {
    "purchaseOrderId": "po-uuid",
    "poNumber": "PO-2026-001",
    "supplierId": "supplier-uuid",
    "locationId": "location-uuid",
    "totalAmount": 5000.00,
    "status": "PENDING"
  }
}
```

#### PURCHASE_ORDER_APPROVED
**Published by:** Replenishment Service  
**Consumed by:** Procurement System

```json
{
  "eventType": "PURCHASE_ORDER_APPROVED",
  "aggregateType": "PURCHASE_ORDER",
  "payload": {
    "purchaseOrderId": "po-uuid",
    "approvedBy": "user-uuid",
    "approvedAt": "2026-02-09T12:00:00Z"
  }
}
```

### Forecast Events

#### FORECAST_GENERATED
**Published by:** Forecasting Service  
**Consumed by:** Replenishment Service, Analytics Service

```json
{
  "eventType": "FORECAST_GENERATED",
  "aggregateType": "FORECAST",
  "payload": {
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "modelType": "BASELINE",
    "forecastCount": 30,
    "startDate": "2026-02-10",
    "endDate": "2026-03-11"
  }
}
```

### External Integration Events

#### SALE_COMPLETED
**Published by:** POS System (External)  
**Consumed by:** Inventory Ledger Service

```json
{
  "eventType": "SALE_COMPLETED",
  "aggregateType": "SALES_ORDER",
  "payload": {
    "saleId": "sale-uuid",
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "quantity": 5.0,
    "amount": 52.50,
    "timestamp": "2026-02-09T12:00:00Z"
  }
}
```

#### RECEIPT_COMPLETED
**Published by:** WMS System (External)  
**Consumed by:** Inventory Ledger Service

```json
{
  "eventType": "RECEIPT_COMPLETED",
  "aggregateType": "RECEIPT",
  "payload": {
    "receiptId": "receipt-uuid",
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "quantity": 100.0,
    "lotNumber": "LOT-123",
    "expiryDate": "2026-03-09",
    "timestamp": "2026-02-09T12:00:00Z"
  }
}
```

---

## Event Bus Options

### Option 1: Apache Kafka

**Pros:**
- High throughput and scalability
- Event replay capability
- Strong durability
- Partitioning for parallel processing
- Industry standard

**Cons:**
- Complex setup and operations
- Higher infrastructure costs
- Steeper learning curve

**Use Case:** Large-scale deployments, high throughput

**Topics:**
- `inventory-events` - Inventory-related events
- `purchase-order-events` - Purchase order events
- `forecast-events` - Forecast events
- `integration-events` - External integration events

### Option 2: RabbitMQ

**Pros:**
- Simpler than Kafka
- Good for message queuing
- Mature and stable
- Good management UI

**Cons:**
- Less scalable than Kafka
- No event replay (without plugins)

**Use Case:** Medium-scale deployments

**Exchanges:**
- `composerp.events` - Topic exchange for all events
- Routing keys: `inventory.*`, `purchase_order.*`, `forecast.*`

### Option 3: Azure Service Bus / AWS EventBridge

**Pros:**
- Managed service (less ops)
- Cloud-native
- Good integration

**Cons:**
- Vendor lock-in
- Cost at scale

**Use Case:** Cloud-native deployments

---

## Event Processing Patterns

### Pattern 1: Event Sourcing

**Use Case:** Audit trail, event replay

**Implementation:**
- Store all events in event log
- Replay events to rebuild state
- Query events for audit purposes

### Pattern 2: CQRS (Command Query Responsibility Segregation)

**Use Case:** Separate read/write models

**Implementation:**
- Write model: Event-driven updates
- Read model: Materialized views/denormalized data
- Event handlers update read model

### Pattern 3: Saga Pattern

**Use Case:** Distributed transactions

**Implementation:**
- Choreography: Services coordinate via events
- Orchestration: Central orchestrator coordinates

---

## Event Handlers

### Inventory Ledger Service Handlers

#### Handle SALE_COMPLETED
```typescript
async handleSaleCompleted(event: SaleCompletedEvent) {
  // Create transaction
  const transaction = await this.createTransaction({
    type: 'SALE',
    itemId: event.payload.itemId,
    locationId: event.payload.locationId,
    quantity: event.payload.quantity,
    referenceId: event.payload.saleId,
    referenceType: 'SALES_ORDER'
  });
  
  // Publish INVENTORY_UPDATED
  await this.eventBus.publish({
    eventType: 'INVENTORY_UPDATED',
    aggregateType: 'INVENTORY_POSITION',
    aggregateId: transaction.positionId,
    payload: { ... }
  });
}
```

### Replenishment Service Handlers

#### Handle INVENTORY_UPDATED
```typescript
async handleInventoryUpdated(event: InventoryUpdatedEvent) {
  // Evaluate replenishment rules
  const shouldReorder = await this.evaluateReplenishment(
    event.payload.itemId,
    event.payload.locationId
  );
  
  if (shouldReorder) {
    // Create purchase order
    const po = await this.createPurchaseOrder(...);
    
    // Publish PURCHASE_ORDER_CREATED
    await this.eventBus.publish({
      eventType: 'PURCHASE_ORDER_CREATED',
      aggregateType: 'PURCHASE_ORDER',
      aggregateId: po.id,
      payload: { ... }
    });
  }
}
```

---

## Event Replay

### Use Cases
- **Recovery** - Rebuild state after failure
- **Analytics** - Reprocess events for analytics
- **Testing** - Replay events in test environment
- **Migration** - Migrate to new schema

### Implementation
- Store events in event log (database or Kafka)
- Replay events in order
- Rebuild aggregates from events

---

## Event Versioning

### Schema Evolution
- **Version field** in event schema
- **Backward compatibility** - New consumers handle old events
- **Forward compatibility** - Old consumers ignore new fields

### Migration Strategy
- **Versioned topics** - `inventory-events-v1`, `inventory-events-v2`
- **Event transformation** - Transform old events to new format
- **Dual write** - Write to both old and new topics during migration

---

*Next: [Workflow & Configuration](./08-WORKFLOWS.md)*
