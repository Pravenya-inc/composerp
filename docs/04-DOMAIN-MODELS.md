# Domain Models - Canonical Data Models

This document defines the **canonical data models** for Composerp. These models are shared across services via API contracts and event schemas.

## Design Principles

1. **Extensibility** - Every entity supports `customAttributes` (JSON) for enterprise-specific fields
2. **Multi-Tenancy** - Every entity includes `tenantId` for tenant isolation
3. **Auditability** - Entities include `createdAt`, `updatedAt` timestamps
4. **Soft Deletes** - Entities support `deletedAt` for soft deletion
5. **Type Safety** - Strong typing with enums for status fields

---

## Core Entities

### Item (Product)

**Purpose:** Canonical product definition across the platform

```typescript
interface Item {
  id: string;                    // UUID
  tenantId: string;              // Multi-tenant isolation
  sku: string;                   // Stock Keeping Unit (unique per tenant)
  name: string;                  // Product name
  description?: string;           // Product description
  category: string;               // e.g., "Grocery", "Electronics"
  subCategory?: string;           // e.g., "Dairy", "Frozen"
  brand?: string;                // Brand name
  unitOfMeasure: string;          // "EA", "CASE", "PALLET", "KG", "L"
  temperatureZone?: string;       // "AMBIENT", "REFRIGERATED", "FROZEN"
  customAttributes: JSON;         // Extensible JSON schema
  isActive: boolean;              // Active/inactive flag
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Constraints:**
- `sku` must be unique per tenant
- `category` is required (for categorization)
- `temperatureZone` optional but recommended for retail

**Custom Attributes Examples:**
```json
{
  "supplierCode": "SUP-123",
  "barcode": "1234567890123",
  "shelfLife": 30,
  "hazmat": false,
  "countryOfOrigin": "USA"
}
```

---

### Supplier (Vendor)

**Purpose:** Supplier/vendor information

```typescript
interface Supplier {
  id: string;
  tenantId: string;
  code: string;                   // Supplier code (unique per tenant)
  name: string;                   // Supplier name
  contactEmail?: string;
  contactPhone?: string;
  address?: Address;              // JSON: { street, city, state, zip, country }
  customAttributes: JSON;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Constraints:**
- `code` must be unique per tenant
- `name` is required

**Custom Attributes Examples:**
```json
{
  "paymentTerms": "NET30",
  "taxId": "12-3456789",
  "preferredContact": "email",
  "rating": 4.5
}
```

---

### SupplierItem

**Purpose:** Supplier-specific item information (supplier SKU, lead time, costs)

```typescript
interface SupplierItem {
  id: string;
  tenantId: string;
  supplierId: string;             // Reference to Supplier
  itemId: string;                // Reference to Item
  supplierSku?: string;           // Supplier's SKU for this item
  leadTimeDays: number;           // Lead time in days (default: 7)
  minOrderQuantity: number;       // Minimum order quantity (default: 1)
  orderMultiple: number;          // Order quantity must be multiple of this (default: 1)
  unitCost?: Decimal;             // Cost per unit
  customAttributes: JSON;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Constraints:**
- Unique combination of `tenantId`, `supplierId`, `itemId`
- `leadTimeDays` must be >= 0
- `minOrderQuantity` must be > 0
- `orderMultiple` must be > 0

**Use Case:** Different suppliers may have different SKUs, lead times, and costs for the same item.

---

### Location

**Purpose:** Stores, warehouses, and distribution centers

```typescript
interface Location {
  id: string;
  tenantId: string;
  code: string;                   // Location code (unique per tenant)
  name: string;                   // Location name
  type: LocationType;             // STORE, WAREHOUSE, DISTRIBUTION_CENTER
  address?: Address;              // JSON: { street, city, state, zip, country }
  timezone: string;               // Timezone (default: "UTC")
  temperatureZones: string[];     // Array: ["AMBIENT", "REFRIGERATED", "FROZEN"]
  customAttributes: JSON;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum LocationType {
  STORE = "STORE",
  WAREHOUSE = "WAREHOUSE",
  DISTRIBUTION_CENTER = "DISTRIBUTION_CENTER"
}
```

**Constraints:**
- `code` must be unique per tenant
- `type` is required
- `temperatureZones` array (can be empty)

**Custom Attributes Examples:**
```json
{
  "storeNumber": "001",
  "squareFootage": 5000,
  "managerName": "John Doe",
  "operatingHours": {
    "monday": "9:00-21:00",
    "tuesday": "9:00-21:00"
  }
}
```

---

### InventoryPosition

**Purpose:** Real-time inventory snapshot per item per location

```typescript
interface InventoryPosition {
  id: string;
  tenantId: string;
  itemId: string;                 // Reference to Item
  locationId: string;             // Reference to Location
  onHand: Decimal;                // Physical inventory on hand
  onOrder: Decimal;               // Quantity on order (POs)
  inTransit: Decimal;             // Quantity in transit (transfers)
  reserved: Decimal;              // Reserved inventory (sales orders)
  damaged: Decimal;               // Damaged inventory
  available: Decimal;             // Available = onHand - reserved - damaged
  lastUpdatedAt: DateTime;        // Last transaction timestamp
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Constraints:**
- Unique combination of `tenantId`, `itemId`, `locationId`
- All quantities must be >= 0
- `available` is calculated: `onHand - reserved - damaged`
- `lastUpdatedAt` updated on every transaction

**Business Rules:**
- `available` cannot exceed `onHand`
- `reserved` cannot exceed `onHand`
- `damaged` cannot exceed `onHand`

---

### Transaction

**Purpose:** Event-driven inventory movements (audit trail)

```typescript
interface Transaction {
  id: string;
  tenantId: string;
  itemId: string;                 // Reference to Item
  locationId: string;            // Reference to Location
  transactionType: TransactionType;
  quantity: Decimal;              // Positive or negative quantity
  unitCost?: Decimal;            // Cost per unit (for costing)
  referenceId?: string;          // PO ID, SO ID, Transfer ID, etc.
  referenceType?: string;        // "PURCHASE_ORDER", "SALES_ORDER", "TRANSFER", etc.
  lotNumber?: string;            // Lot/batch number (for lot tracking)
  expiryDate?: DateTime;         // Expiry date (for expiry tracking)
  notes?: string;                // Additional notes
  metadata: JSON;                 // Transaction-specific metadata
  createdAt: DateTime;            // Immutable timestamp
}

enum TransactionType {
  RECEIPT = "RECEIPT",                    // Goods received (from supplier)
  SALE = "SALE",                          // Goods sold
  ADJUSTMENT = "ADJUSTMENT",              // Manual adjustment
  TRANSFER_IN = "TRANSFER_IN",            // Transfer from another location
  TRANSFER_OUT = "TRANSFER_OUT",          // Transfer to another location
  RETURN = "RETURN",                      // Return to supplier
  DAMAGE = "DAMAGE",                      // Damaged goods
  EXPIRY = "EXPIRY",                      // Expired goods
  RESERVATION = "RESERVATION",            // Reserve inventory
  RESERVATION_RELEASE = "RESERVATION_RELEASE" // Release reservation
}
```

**Constraints:**
- `quantity` can be positive or negative
- `referenceId` and `referenceType` should be provided when applicable
- `createdAt` is immutable (transaction timestamp)

**Transaction Type Impact on Inventory:**

| Type | onHand | onOrder | inTransit | reserved | damaged |
|------|--------|---------|-----------|----------|---------|
| RECEIPT | + | - | - | - | - |
| SALE | - | - | - | - | - |
| TRANSFER_IN | + | - | - | - | - |
| TRANSFER_OUT | - | - | + | - | - |
| RESERVATION | - | - | - | + | - |
| RESERVATION_RELEASE | - | - | - | - | - |
| DAMAGE | - | - | - | - | + |

---

### Forecast

**Purpose:** Demand forecast by item/location/time

```typescript
interface Forecast {
  id: string;
  tenantId: string;
  itemId: string;                 // Reference to Item
  locationId: string;            // Reference to Location
  forecastDate: DateTime;        // Date being forecasted
  forecastedQuantity: Decimal;   // Forecasted demand quantity
  confidence?: Decimal;          // Confidence level (0-100)
  modelType: string;             // "BASELINE", "ML_MODEL_1", "ML_MODEL_2", etc.
  metadata: JSON;                // Model-specific metadata
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Constraints:**
- Unique combination of `tenantId`, `itemId`, `locationId`, `forecastDate`, `modelType`
- `forecastedQuantity` must be >= 0
- `confidence` between 0 and 100 (if provided)
- `modelType` identifies the forecasting model used

**Use Case:** Multiple forecasts can exist for the same item/location/date with different models (e.g., baseline vs. ML model).

---

### PurchaseOrder

**Purpose:** Purchase order to supplier

```typescript
interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;               // PO number (unique per tenant)
  supplierId: string;            // Reference to Supplier
  locationId: string;            // Destination location
  status: PurchaseOrderStatus;
  orderDate: DateTime;           // Order date
  expectedDeliveryDate?: DateTime; // Expected delivery date
  totalAmount?: Decimal;         // Total order amount
  notes?: string;                // Additional notes
  metadata: JSON;                 // PO-specific metadata
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum PurchaseOrderStatus {
  PENDING = "PENDING",                    // Created, pending approval
  APPROVED = "APPROVED",                   // Approved, ready to send
  SENT = "SENT",                           // Sent to supplier
  PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED", // Partially received
  RECEIVED = "RECEIVED",                   // Fully received
  CANCELLED = "CANCELLED"                  // Cancelled
}
```

**Constraints:**
- `poNumber` must be unique per tenant
- `status` transitions: PENDING → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED

---

### PurchaseOrderLine

**Purpose:** Line items in a purchase order

```typescript
interface PurchaseOrderLine {
  id: string;
  tenantId: string;
  purchaseOrderId: string;        // Reference to PurchaseOrder
  itemId: string;                // Reference to Item
  quantity: Decimal;              // Ordered quantity
  unitCost: Decimal;              // Cost per unit
  receivedQuantity: Decimal;      // Received quantity (default: 0)
  lineNumber: number;             // Line number in PO
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Constraints:**
- `quantity` must be > 0
- `receivedQuantity` cannot exceed `quantity`
- `lineNumber` must be unique within a PO

---

### ReplenishmentRule

**Purpose:** Configurable replenishment logic (rules instead of hardcoded logic)

```typescript
interface ReplenishmentRule {
  id: string;
  tenantId: string;
  itemId?: string;                // Rule applies to specific item (null = all items)
  locationId?: string;            // Rule applies to specific location (null = all locations)
  supplierId?: string;            // Rule applies to specific supplier (null = all suppliers)
  category?: string;              // Rule applies to category (null = all categories)
  ruleType: ReplenishmentRuleType;
  minStock?: Decimal;             // Minimum stock level
  maxStock?: Decimal;             // Maximum stock level
  safetyStock?: Decimal;          // Safety stock level
  reorderPoint?: Decimal;         // Reorder point
  orderQuantity?: Decimal;         // Fixed order quantity
  config: JSON;                   // Rule-specific configuration
  priority: number;               // Lower = higher priority (default: 100)
  isActive: boolean;              // Active/inactive flag
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum ReplenishmentRuleType {
  MIN_MAX = "MIN_MAX",                    // Reorder when stock <= minStock
  REORDER_POINT = "REORDER_POINT",        // Reorder when stock <= reorderPoint
  SAFETY_STOCK = "SAFETY_STOCK",          // Maintain safety stock level
  FORECAST_BASED = "FORECAST_BASED"       // Reorder based on forecast
}
```

**Rule Evaluation Priority:**
1. Most specific rule wins (itemId + locationId > category + locationId > locationId only)
2. Lower `priority` number = higher priority
3. Only `isActive = true` rules are evaluated

**Use Case:** Different products may have different replenishment strategies:
- Fast-moving items: MIN_MAX with high maxStock
- Slow-moving items: REORDER_POINT with low reorderPoint
- Critical items: SAFETY_STOCK with high safetyStock
- Seasonal items: FORECAST_BASED

---

## Event Models

### EventLog

**Purpose:** Event-driven architecture event log

```typescript
interface EventLog {
  id: string;
  tenantId: string;
  eventType: string;              // e.g., "INVENTORY_UPDATED", "PURCHASE_ORDER_CREATED"
  aggregateType: string;          // "INVENTORY_POSITION", "PURCHASE_ORDER", etc.
  aggregateId: string;           // ID of the aggregate
  payload: JSON;                  // Event payload
  metadata: JSON;                 // Event metadata
  processed: boolean;             // Whether event has been processed
  createdAt: DateTime;           // Event timestamp
}
```

**Common Event Types:**
- `INVENTORY_UPDATED` - Inventory position changed
- `PURCHASE_ORDER_CREATED` - New purchase order created
- `FORECAST_GENERATED` - New forecast generated
- `REPLENISHMENT_TRIGGERED` - Replenishment rule triggered

---

## Relationships

```
Item
├── InventoryPosition (1:N)
├── Forecast (1:N)
├── Transaction (1:N)
├── PurchaseOrderLine (1:N)
└── SupplierItem (1:N)

Supplier
├── PurchaseOrder (1:N)
└── SupplierItem (1:N)

Location
├── InventoryPosition (1:N)
├── Forecast (1:N)
├── Transaction (1:N)
├── PurchaseOrder (1:N)
└── ReplenishmentRule (1:N)

PurchaseOrder
└── PurchaseOrderLine (1:N)
```

---

## JSON Schema for Custom Attributes

Each entity's `customAttributes` should follow a JSON schema. Example for Item:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "supplierCode": { "type": "string" },
    "barcode": { "type": "string" },
    "shelfLife": { "type": "number", "minimum": 0 },
    "hazmat": { "type": "boolean" },
    "countryOfOrigin": { "type": "string" }
  },
  "additionalProperties": true
}
```

**Note:** `additionalProperties: true` allows enterprises to add their own fields.

---

*Next: [Retail Merchandising (openMerch)](./05-OPENMERCH.md)*
