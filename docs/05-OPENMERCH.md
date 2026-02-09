# Retail Merchandising (openMerch)

**openMerch** is the first domain being built for Composerp, focusing on retail merchandising operations.

## Domain Overview

openMerch provides **composable retail merchandising services** that can be integrated with existing systems (WMS, procurement) or used standalone.

## Core Modules

### 1. Planning Service

**Purpose:** Strategic planning and assortment management

**Capabilities:**
- **Assortment Planning** - Plan product mix by store/location
- **Financial Targets** - Set revenue and margin targets
- **Store Clusters** - Group stores by characteristics (size, location, demographics)
- **Scenario Planning** - What-if analysis for different scenarios

**Status:** Future module (not in initial build)

**Key Entities:**
- Plan
- Assortment
- StoreCluster
- FinancialTarget
- Scenario

---

### 2. Forecasting Service

**Purpose:** Demand forecasting by item/location/time

**Capabilities:**
- **Demand Forecasting** - Predict demand for items at specific locations
- **Pluggable Models** - Support multiple forecasting models:
  - Baseline (simple average)
  - Time series (ARIMA, Exponential Smoothing)
  - Machine Learning (future)
- **API-Driven** - Generate forecasts via API
- **Forecast Accuracy Tracking** - Measure forecast vs. actual

**Status:** Initial build (simple baseline model)

**Key Entities:**
- Forecast (see Domain Models)

**API Endpoints:**
- `POST /forecasts/generate` - Generate forecast for item/location
- `GET /forecasts` - Get forecasts for item/location/date range
- `GET /forecasts/accuracy` - Get forecast accuracy metrics

**Forecasting Models:**

#### Baseline Model (Initial)
- Simple average of last N periods
- Configurable period (e.g., last 4 weeks)
- Daily average calculation
- Low confidence (70%)

#### Future Models
- **ARIMA** - Time series forecasting
- **Exponential Smoothing** - Trend and seasonality
- **Machine Learning** - Neural networks, XGBoost
- **Ensemble** - Combine multiple models

---

### 3. Replenishment & Ordering Service

**Purpose:** Automated replenishment and purchase order generation

**Capabilities:**
- **Min/Max Replenishment** - Reorder when stock <= min, order up to max
- **Safety Stock** - Maintain safety stock level
- **Lead Time Logic** - Account for supplier lead times
- **Automatic PO Generation** - Generate purchase orders automatically
- **Rule-Based Configuration** - Different rules per product/vendor/location

**Status:** Initial build

**Key Entities:**
- ReplenishmentRule (see Domain Models)
- PurchaseOrder (see Domain Models)

**Replenishment Rule Types:**

#### MIN_MAX
- Reorder when `available <= minStock`
- Order quantity: `maxStock - available`
- Example: minStock=10, maxStock=100 → reorder when stock <= 10, order up to 100

#### REORDER_POINT
- Reorder when `available <= reorderPoint`
- Order quantity: `orderQuantity` (fixed)
- Example: reorderPoint=20, orderQuantity=50 → reorder when stock <= 20, order 50 units

#### SAFETY_STOCK
- Maintain `safetyStock` level
- Reorder when `available <= safetyStock`
- Order quantity: calculated based on forecast
- Example: safetyStock=30 → reorder when stock <= 30

#### FORECAST_BASED
- Reorder based on forecasted demand
- Considers lead time and forecast
- Order quantity: forecasted demand + safety stock - current stock
- Example: forecast=100 units/week, leadTime=2 weeks → order 200 units

**Rule Evaluation:**
1. Find applicable rule (most specific wins)
2. Check if reorder needed (based on rule type)
3. Calculate order quantity
4. Apply min order quantity and order multiples
5. Create purchase order

**API Endpoints:**
- `POST /replenishment/evaluate` - Evaluate replenishment for location(s)
- `GET /replenishment/rules` - Get replenishment rules
- `POST /replenishment/rules` - Create replenishment rule
- `PUT /replenishment/rules/:id` - Update replenishment rule
- `GET /purchase-orders` - Get purchase orders
- `POST /purchase-orders/:id/approve` - Approve purchase order

---

### 4. Store Stock Ledger Service (SSLE)

**Purpose:** Real-time inventory tracking per store

**Capabilities:**
- **Real-Time Inventory** - Track on-hand, on-order, in-transit, reserved, damaged
- **Transaction Recording** - Record all inventory movements
- **Event-Driven Updates** - Update inventory on events (sales, receipts, transfers)
- **Store-Level Visibility** - Inventory visibility at store level

**Status:** Initial build

**Key Entities:**
- InventoryPosition (see Domain Models)
- Transaction (see Domain Models)

**Transaction Types:**
- **RECEIPT** - Goods received from supplier
- **SALE** - Goods sold to customer
- **TRANSFER_IN** - Transfer from another location
- **TRANSFER_OUT** - Transfer to another location
- **ADJUSTMENT** - Manual adjustment
- **DAMAGE** - Damaged goods
- **RETURN** - Return to supplier
- **RESERVATION** - Reserve inventory (for sales orders)
- **RESERVATION_RELEASE** - Release reservation

**API Endpoints:**
- `GET /inventory/positions` - Get inventory positions
- `GET /inventory/positions/:itemId/:locationId` - Get specific position
- `POST /inventory/transactions` - Create transaction
- `GET /inventory/transactions` - Get transactions
- `GET /inventory/locations/:locationId` - Get all inventory for location

**Event Flow:**
1. External system (POS, WMS) publishes `SALE_COMPLETED` event
2. SSLE consumes event
3. Creates Transaction record
4. Updates InventoryPosition
5. Publishes `INVENTORY_UPDATED` event

---

### 5. Warehouse Stock Ledger Service (WSLE)

**Purpose:** Inventory tracking per distribution center/warehouse

**Capabilities:**
- **Case/Pallet Level Tracking** - Track inventory at case/pallet level
- **FIFO/LIFO** - First-In-First-Out or Last-In-First-Out costing
- **Lot Tracking** - Track lots/batches
- **Expiry Management** - Track expiry dates
- **Warehouse-Level Visibility** - Inventory visibility at warehouse level

**Status:** Initial build (basic tracking, FIFO/LIFO future)

**Key Entities:**
- InventoryPosition (same as SSLE, but at warehouse level)
- Transaction (with lotNumber, expiryDate)
- Lot (future entity for lot tracking)

**Differences from SSLE:**
- Tracks at **case/pallet level** (not individual units)
- Supports **lot tracking** (lotNumber in transactions)
- Supports **expiry tracking** (expiryDate in transactions)
- **FIFO/LIFO costing** (future)

**API Endpoints:**
- Same as SSLE, but warehouse-focused
- `GET /inventory/lots` - Get lot information (future)
- `GET /inventory/expiring` - Get expiring inventory (future)

---

## Integration Points

### External Systems

#### Warehouse Management System (WMS)
- **Integration:** REST API or Event Bus
- **Events Consumed:** `RECEIPT`, `TRANSFER_OUT`, `TRANSFER_IN`
- **Events Published:** `INVENTORY_UPDATED`

#### Procurement System
- **Integration:** REST API
- **Events Consumed:** `PURCHASE_ORDER_CREATED`
- **Events Published:** `PURCHASE_ORDER_APPROVED`, `PURCHASE_ORDER_SENT`

#### Point of Sale (POS)
- **Integration:** REST API or Event Bus
- **Events Consumed:** `SALE_COMPLETED`
- **Events Published:** `INVENTORY_UPDATED`

#### ERP System
- **Integration:** REST API or Event Bus
- **Bidirectional:** Can consume and publish events

---

## Business Flows

### Flow 1: Sale at Store

```
1. Customer makes purchase at Store A
   ↓
2. POS system records sale
   ↓
3. POS publishes SALE_COMPLETED event
   ↓
4. SSLE consumes event
   ↓
5. SSLE creates Transaction (type: SALE)
   ↓
6. SSLE updates InventoryPosition (onHand -= quantity)
   ↓
7. SSLE publishes INVENTORY_UPDATED event
   ↓
8. Forecasting Service consumes INVENTORY_UPDATED
   ↓
9. Forecasting Service updates historical data
   ↓
10. Replenishment Service consumes INVENTORY_UPDATED
    ↓
11. Replenishment Service evaluates rules
    ↓
12. If reorder needed, creates PurchaseOrder
    ↓
13. Replenishment Service publishes PURCHASE_ORDER_CREATED event
```

### Flow 2: Receipt at Warehouse

```
1. Goods arrive at Warehouse B
   ↓
2. WMS records receipt
   ↓
3. WMS publishes RECEIPT event (with lotNumber, expiryDate)
   ↓
4. WSLE consumes event
   ↓
5. WSLE creates Transaction (type: RECEIPT)
   ↓
6. WSLE updates InventoryPosition (onHand += quantity)
   ↓
7. WSLE publishes INVENTORY_UPDATED event
```

### Flow 3: Transfer Store to Store

```
1. Store A transfers goods to Store B
   ↓
2. System creates Transaction (type: TRANSFER_OUT) at Store A
   ↓
3. System creates Transaction (type: TRANSFER_IN) at Store B
   ↓
4. SSLE updates InventoryPosition at Store A (onHand -= quantity, inTransit += quantity)
   ↓
5. SSLE updates InventoryPosition at Store B (onHand += quantity, inTransit -= quantity)
   ↓
6. SSLE publishes INVENTORY_UPDATED events for both stores
```

### Flow 4: Automated Replenishment

```
1. Replenishment Service runs scheduled job (e.g., daily)
   ↓
2. For each store location:
   ↓
3. Get all inventory positions
   ↓
4. For each position:
   ↓
5. Find applicable ReplenishmentRule
   ↓
6. Evaluate rule (check if reorder needed)
   ↓
7. If reorder needed:
   ↓
8. Get SupplierItem (supplier, lead time, costs)
   ↓
9. Calculate order quantity (apply min order, multiples)
   ↓
10. Create PurchaseOrder
    ↓
11. Publish PURCHASE_ORDER_CREATED event
    ↓
12. Procurement system consumes event
    ↓
13. Procurement system sends PO to supplier
```

---

## Retail Context Considerations

### Scale Requirements
- **20 Warehouses** - WSLE must handle warehouse-level inventory
- **2000 Stores** - SSLE must handle store-level inventory at scale
- **Millions of Products** - Efficient querying and indexing required
- **High Transaction Volume** - Optimized for high throughput

### Product Categories
- **Multiple Categories** - Grocery, Electronics, Apparel, etc.
- **Subcategories** - Dairy, Frozen, Produce, etc.
- **Category-Based Rules** - Replenishment rules can be category-specific

### Temperature Zones
- **AMBIENT** - Room temperature products
- **REFRIGERATED** - Cold products (2-8°C)
- **FROZEN** - Frozen products (-18°C)
- **Location Support** - Locations can support multiple temperature zones
- **Product Assignment** - Products assigned to temperature zones

### Multiple Systems
- **Different WMS** - Must integrate with multiple warehouse management systems
- **Different Procurement** - Must integrate with multiple procurement systems
- **API-First** - REST/GraphQL APIs for integration
- **Event-Driven** - Event bus for loose coupling

---

## Future Enhancements

1. **Advanced Forecasting** - ML models, ensemble methods
2. **FIFO/LIFO Costing** - Cost accounting in WSLE
3. **Lot Tracking** - Full lot/batch tracking
4. **Expiry Management** - Automated expiry alerts
5. **Multi-Echelon** - Store → Warehouse → Supplier replenishment
6. **Optimization** - Inventory optimization algorithms
7. **Analytics** - Inventory analytics and reporting

---

*Next: [API Design](./06-API-DESIGN.md)*
