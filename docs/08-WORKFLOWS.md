# Workflow & Configuration

This document describes **configurable workflows and business logic** in Composerp.

## Principles

1. **Config over Code** - Business logic defined as configuration
2. **Rules Engine** - Rule-based logic instead of hardcoded
3. **Priority-Based** - Rules evaluated by priority
4. **Extensible** - Easy to add new rule types
5. **No Code Changes** - Modify workflows without deploying code

---

## Replenishment Rules

### Rule Types

#### 1. MIN_MAX Rule
**Purpose:** Maintain inventory between min and max levels

**Configuration:**
```json
{
  "ruleType": "MIN_MAX",
  "minStock": 10.0,
  "maxStock": 100.0
}
```

**Logic:**
- If `available <= minStock`, reorder
- Order quantity: `maxStock - available`
- Example: Stock=5, minStock=10, maxStock=100 → Order 95 units

#### 2. REORDER_POINT Rule
**Purpose:** Reorder when stock falls below reorder point

**Configuration:**
```json
{
  "ruleType": "REORDER_POINT",
  "reorderPoint": 20.0,
  "orderQuantity": 50.0
}
```

**Logic:**
- If `available <= reorderPoint`, reorder
- Order quantity: `orderQuantity` (fixed)
- Example: Stock=15, reorderPoint=20, orderQuantity=50 → Order 50 units

#### 3. SAFETY_STOCK Rule
**Purpose:** Maintain safety stock level

**Configuration:**
```json
{
  "ruleType": "SAFETY_STOCK",
  "safetyStock": 30.0
}
```

**Logic:**
- If `available <= safetyStock`, reorder
- Order quantity: Calculated based on forecast + lead time
- Example: Stock=25, safetyStock=30 → Reorder based on forecast

#### 4. FORECAST_BASED Rule
**Purpose:** Reorder based on forecasted demand

**Configuration:**
```json
{
  "ruleType": "FORECAST_BASED",
  "forecastDays": 7,
  "safetyStockMultiplier": 1.5
}
```

**Logic:**
- Get forecast for next `forecastDays`
- Calculate forecasted demand
- Order quantity: `forecastedDemand * safetyStockMultiplier - available`
- Example: Forecast=100 units/week, Stock=50 → Order 100 units

---

## Rule Evaluation

### Rule Matching

Rules are matched based on specificity:

1. **Most Specific:** `itemId + locationId + supplierId`
2. **Category + Location:** `category + locationId`
3. **Item Only:** `itemId`
4. **Category Only:** `category`
5. **Location Only:** `locationId`
6. **Default:** No filters

### Priority

- Lower `priority` number = Higher priority
- Rules evaluated in priority order
- First matching rule wins

### Example Rule Set

```json
[
  {
    "id": "rule-1",
    "itemId": "item-123",
    "locationId": "store-001",
    "ruleType": "MIN_MAX",
    "minStock": 10.0,
    "maxStock": 100.0,
    "priority": 10
  },
  {
    "id": "rule-2",
    "category": "Grocery",
    "locationId": "store-001",
    "ruleType": "REORDER_POINT",
    "reorderPoint": 20.0,
    "orderQuantity": 50.0,
    "priority": 50
  },
  {
    "id": "rule-3",
    "category": "Grocery",
    "ruleType": "SAFETY_STOCK",
    "safetyStock": 30.0,
    "priority": 100
  }
]
```

**Evaluation:**
- Item `item-123` at `store-001`: Uses `rule-1` (most specific)
- Other Grocery items at `store-001`: Uses `rule-2` (category + location)
- Other Grocery items at other stores: Uses `rule-3` (category only)

---

## Order Quantity Calculation

### Constraints

After calculating order quantity, apply constraints:

1. **Min Order Quantity** - From `SupplierItem.minOrderQuantity`
   - If `orderQuantity < minOrderQuantity`, set to `minOrderQuantity`

2. **Order Multiple** - From `SupplierItem.orderMultiple`
   - Round up to nearest multiple: `Math.ceil(orderQuantity / orderMultiple) * orderMultiple`

3. **Max Order Quantity** - Optional constraint
   - If `orderQuantity > maxOrderQuantity`, set to `maxOrderQuantity`

### Example

```typescript
// Initial calculation
orderQuantity = 47.0;

// Apply min order quantity
minOrderQuantity = 10.0;
if (orderQuantity < minOrderQuantity) {
  orderQuantity = minOrderQuantity; // 47 >= 10, no change
}

// Apply order multiple
orderMultiple = 5.0;
orderQuantity = Math.ceil(orderQuantity / orderMultiple) * orderMultiple;
// Math.ceil(47 / 5) * 5 = 10 * 5 = 50

// Final order quantity: 50
```

---

## Workflow Configuration

### Replenishment Workflow

**Steps:**
1. **Evaluate Rules** - Find applicable rule for item/location
2. **Check Stock** - Get current inventory position
3. **Calculate Order** - Calculate order quantity based on rule
4. **Apply Constraints** - Apply min order, multiples, etc.
5. **Create PO** - Create purchase order
6. **Notify** - Send notification (optional)

**Configuration:**
```json
{
  "workflowType": "REPLENISHMENT",
  "steps": [
    {
      "step": "EVALUATE_RULES",
      "enabled": true
    },
    {
      "step": "CHECK_STOCK",
      "enabled": true
    },
    {
      "step": "CALCULATE_ORDER",
      "enabled": true
    },
    {
      "step": "APPLY_CONSTRAINTS",
      "enabled": true,
      "config": {
        "applyMinOrder": true,
        "applyMultiples": true,
        "applyMaxOrder": false
      }
    },
    {
      "step": "CREATE_PO",
      "enabled": true
    },
    {
      "step": "NOTIFY",
      "enabled": true,
      "config": {
        "channels": ["email", "slack"],
        "recipients": ["manager@example.com"]
      }
    }
  ]
}
```

---

## Rule Configuration API

### Create Rule
```
POST /replenishment/rules
```

**Request:**
```json
{
  "itemId": "item-123",
  "locationId": "store-001",
  "ruleType": "MIN_MAX",
  "minStock": 10.0,
  "maxStock": 100.0,
  "priority": 10,
  "isActive": true
}
```

### Update Rule
```
PUT /replenishment/rules/:id
```

### Deactivate Rule
```
PATCH /replenishment/rules/:id
{
  "isActive": false
}
```

### Bulk Import Rules
```
POST /replenishment/rules/bulk-import
```

**Request:** CSV or JSON file with rules

---

## Custom Business Logic

### Custom Attributes

Use `customAttributes` JSON field for custom logic:

**Example:**
```json
{
  "itemId": "item-123",
  "customAttributes": {
    "replenishmentStrategy": "JIT",
    "seasonalMultiplier": 1.5,
    "promotionActive": true
  }
}
```

### Custom Rule Types

Extend system with custom rule types:

**Configuration:**
```json
{
  "ruleType": "CUSTOM_SEASONAL",
  "config": {
    "baseStock": 50.0,
    "seasonalMultipliers": {
      "Q4": 2.0,
      "Q1": 0.8
    }
  }
}
```

---

## Workflow Engine (Future)

### Planned Features

1. **Visual Workflow Builder** - Drag-and-drop workflow designer
2. **Conditional Logic** - If/then/else conditions
3. **Approval Workflows** - Multi-step approval processes
4. **Scheduled Workflows** - Time-based triggers
5. **Event Triggers** - Event-driven workflows

### Example Workflow

```
Trigger: INVENTORY_UPDATED
  ↓
Condition: available < 10
  ↓
Action: Evaluate Replenishment Rules
  ↓
Condition: Rule matched
  ↓
Action: Create Purchase Order
  ↓
Condition: PO amount > $10000
  ↓
Action: Require Approval
  ↓
Action: Send Notification
```

---

*Next: [Multi-Tenancy](./09-MULTI-TENANCY.md)*
