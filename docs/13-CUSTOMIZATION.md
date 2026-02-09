# Customization & Extensibility

Composerp is designed to be as flexible as Salesforce, allowing enterprises to create custom attributes, custom tables, and user-friendly field names without code changes.

## Design Philosophy

### Salesforce-Like Flexibility
- **Custom Fields** - Add custom fields to any entity
- **Custom Objects** - Create entirely new entities/tables
- **User-Friendly Names** - Display names independent of technical field names
- **Field Types** - Support all common field types (text, number, date, picklist, lookup, etc.)
- **Validation Rules** - Define validation rules for custom fields
- **Formulas** - Calculated fields based on formulas
- **Relationships** - Create relationships between custom objects

### AI-First Design
- **Cross-References** - All relationships tracked for AI/RAG
- **Semantic Metadata** - Rich metadata for AI understanding
- **RAG-Ready** - Structured for Retrieval Augmented Generation
- **Agent Support** - Built-in support for AI agents
- **MCP Servers** - Model Context Protocol server support

---

## Custom Fields (Custom Attributes)

### Overview

Every canonical entity supports **custom attributes** as JSON, but Composerp provides a **metadata layer** that makes these fields:
- **Type-safe** - With proper validation
- **User-friendly** - With display names and descriptions
- **Searchable** - Indexed for queries
- **AI-aware** - With semantic metadata

### Custom Field Definition

```typescript
interface CustomField {
  id: string;
  tenantId: string;
  entityType: string;              // "Item", "Supplier", "Location", etc.
  fieldName: string;                // Technical name (e.g., "custom_barcode")
  displayName: string;              // User-friendly name (e.g., "Barcode")
  description?: string;             // Field description
  fieldType: CustomFieldType;       // TEXT, NUMBER, DATE, PICKLIST, LOOKUP, etc.
  isRequired: boolean;              // Required field
  isUnique: boolean;                // Unique constraint
  defaultValue?: any;               // Default value
  validationRules?: ValidationRule[]; // Validation rules
  options?: string[];              // For PICKLIST type
  lookupEntityType?: string;        // For LOOKUP type
  formula?: string;                 // For FORMULA type
  aiMetadata?: AIMetadata;          // AI/RAG metadata
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum CustomFieldType {
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  NUMBER = "NUMBER",
  DECIMAL = "DECIMAL",
  DATE = "DATE",
  DATETIME = "DATETIME",
  BOOLEAN = "BOOLEAN",
  PICKLIST = "PICKLIST",
  MULTI_PICKLIST = "MULTI_PICKLIST",
  LOOKUP = "LOOKUP",
  MASTER_DETAIL = "MASTER_DETAIL",
  FORMULA = "FORMULA",
  CURRENCY = "CURRENCY",
  PERCENT = "PERCENT",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  URL = "URL",
  JSON = "JSON"
}

interface ValidationRule {
  name: string;
  errorMessage: string;
  formula: string;                  // Expression to evaluate
}

interface AIMetadata {
  semanticType?: string;            // "product_identifier", "contact_info", etc.
  embeddingField?: string;          // Field to use for embeddings
  searchable: boolean;              // Include in semantic search
  ragContext: boolean;              // Include in RAG context
  agentAccessible: boolean;          // Accessible by AI agents
  description: string;             // Natural language description for AI
}
```

### Example: Adding Custom Field to Item

```json
{
  "entityType": "Item",
  "fieldName": "custom_barcode",
  "displayName": "Barcode",
  "description": "Product barcode (UPC/EAN)",
  "fieldType": "TEXT",
  "isRequired": true,
  "isUnique": true,
  "validationRules": [
    {
      "name": "barcode_length",
      "errorMessage": "Barcode must be 12 or 13 digits",
      "formula": "LEN(custom_barcode) == 12 OR LEN(custom_barcode) == 13"
    }
  ],
  "aiMetadata": {
    "semanticType": "product_identifier",
    "searchable": true,
    "ragContext": true,
    "agentAccessible": true,
    "description": "Unique product identifier used for scanning and inventory tracking"
  }
}
```

### Storage Strategy

**Option 1: JSON Column (Current)**
- Custom fields stored in `customAttributes` JSON column
- Fast reads, flexible schema
- Limited querying capabilities

**Option 2: EAV (Entity-Attribute-Value) Table**
- Separate table for custom field values
- Better querying, more complex joins
- Used for frequently queried fields

**Option 3: Hybrid Approach (Recommended)**
- Frequently accessed fields: EAV table
- Infrequently accessed fields: JSON column
- Metadata-driven routing

---

## Custom Objects (Custom Tables)

### Overview

Enterprises can create **entirely new entities** (custom objects) beyond the canonical models.

### Custom Object Definition

```typescript
interface CustomObject {
  id: string;
  tenantId: string;
  objectName: string;                // Technical name (e.g., "CustomProduct")
  displayName: string;              // User-friendly name (e.g., "Product")
  pluralName: string;               // Plural name (e.g., "Products")
  description?: string;             // Object description
  fields: CustomField[];            // Custom fields
  relationships: CustomRelationship[]; // Relationships to other objects
  aiMetadata?: AIMetadata;          // AI/RAG metadata
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface CustomRelationship {
  id: string;
  customObjectId: string;
  relatedObjectType: string;        // "Item", "Supplier", or another CustomObject
  relationshipType: RelationshipType; // LOOKUP, MASTER_DETAIL
  fieldName: string;                // Field name in custom object
  displayName: string;              // Display name
  cascadeDelete: boolean;           // Cascade delete (for MASTER_DETAIL)
}

enum RelationshipType {
  LOOKUP = "LOOKUP",                // Many-to-one (optional)
  MASTER_DETAIL = "MASTER_DETAIL"   // Many-to-one (required, cascade delete)
}
```

### Example: Creating Custom Object

```json
{
  "objectName": "ProductReview",
  "displayName": "Product Review",
  "pluralName": "Product Reviews",
  "description": "Customer reviews for products",
  "fields": [
    {
      "fieldName": "rating",
      "displayName": "Rating",
      "fieldType": "NUMBER",
      "isRequired": true,
      "validationRules": [
        {
          "name": "rating_range",
          "errorMessage": "Rating must be between 1 and 5",
          "formula": "rating >= 1 AND rating <= 5"
        }
      ]
    },
    {
      "fieldName": "reviewText",
      "displayName": "Review Text",
      "fieldType": "TEXTAREA",
      "isRequired": true
    },
    {
      "fieldName": "reviewerName",
      "displayName": "Reviewer Name",
      "fieldType": "TEXT"
    }
  ],
  "relationships": [
    {
      "relatedObjectType": "Item",
      "relationshipType": "MASTER_DETAIL",
      "fieldName": "product",
      "displayName": "Product",
      "cascadeDelete": false
    }
  ],
  "aiMetadata": {
    "semanticType": "customer_feedback",
    "searchable": true,
    "ragContext": true,
    "agentAccessible": true,
    "description": "Customer reviews and ratings for products"
  }
}
```

### Implementation Strategy

**Dynamic Schema Generation:**
- Custom objects create **dynamic database tables**
- Schema managed via migrations
- API endpoints auto-generated

**Table Naming:**
- Format: `custom_{objectName}_{tenantId}`
- Example: `custom_productreview_tenant123`

---

## User-Friendly Field Names

### Display Names vs. Technical Names

**Technical Name:** `custom_barcode` (used in API, database)
**Display Name:** "Barcode" (shown in UI, reports)

### Field Labeling

```typescript
interface FieldLabel {
  technicalName: string;            // "custom_barcode"
  displayName: string;              // "Barcode"
  shortLabel?: string;               // "Barcode" (for compact views)
  pluralLabel?: string;              // "Barcodes"
  description?: string;              // "Product barcode (UPC/EAN)"
  helpText?: string;                 // Detailed help text
  placeholder?: string;              // Placeholder text for forms
}
```

### Multi-Language Support

```typescript
interface FieldLabelTranslation {
  fieldId: string;
  locale: string;                   // "en", "es", "fr", etc.
  displayName: string;
  description?: string;
  helpText?: string;
}
```

---

## Cross-References & Relationships

### Automatic Relationship Tracking

Composerp **automatically tracks all relationships** for AI/RAG purposes:

```typescript
interface Relationship {
  id: string;
  tenantId: string;
  sourceEntityType: string;          // "Item"
  sourceEntityId: string;
  targetEntityType: string;          // "Supplier"
  targetEntityId: string;
  relationshipType: string;          // "SUPPLIER_ITEM", "LOCATION_ITEM", etc.
  metadata: JSON;                     // Relationship metadata
  createdAt: DateTime;
}

// Automatic relationship detection:
// - Item → Supplier (via SupplierItem)
// - Item → Location (via InventoryPosition)
// - PurchaseOrder → Supplier
// - PurchaseOrder → Location
// - Transaction → Item
// - Transaction → Location
// - Forecast → Item
// - Forecast → Location
```

### Relationship Graph

All relationships stored in a **relationship graph** for:
- **RAG queries** - "What items does Supplier X provide?"
- **Agent reasoning** - "Find all stores with low stock for Supplier X items"
- **Semantic search** - "Products similar to Item Y"

---

## AI-Enabled Features

### RAG (Retrieval Augmented Generation) Support

**Structured Data for RAG:**
- All entities include **semantic metadata**
- Relationships tracked in **knowledge graph**
- **Embeddings** generated for text fields
- **Vector search** support

**RAG Data Structure:**

```typescript
interface RAGDocument {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  content: string;                   // Natural language representation
  embeddings: number[];              // Vector embeddings
  metadata: {
    fields: Record<string, any>;     // All field values
    relationships: Relationship[];   // Related entities
    semanticType: string;            // Semantic type
  };
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Example RAG Document for Item:**

```json
{
  "entityType": "Item",
  "entityId": "item-123",
  "content": "Product: Milk (SKU: MILK-001), Category: Dairy, Brand: FarmFresh, Temperature Zone: Refrigerated, Supplier: FarmFresh Dairy, Available at: Store 001 (50 units), Store 002 (30 units)",
  "embeddings": [0.123, 0.456, ...],
  "metadata": {
    "fields": {
      "sku": "MILK-001",
      "name": "Milk",
      "category": "Dairy",
      "brand": "FarmFresh",
      "temperatureZone": "REFRIGERATED"
    },
    "relationships": [
      {
        "type": "SUPPLIER",
        "targetEntityId": "supplier-456",
        "targetEntityType": "Supplier"
      },
      {
        "type": "INVENTORY",
        "targetEntityId": "location-789",
        "targetEntityType": "Location"
      }
    ],
    "semanticType": "product"
  }
}
```

### AI Agent Support

**Agent-Accessible API:**
- **Natural language queries** - "What items are low in stock?"
- **Semantic search** - "Find products similar to milk"
- **Relationship traversal** - "What suppliers provide dairy products?"

**Agent API Endpoints:**

```
POST /ai/query
{
  "query": "What items are low in stock at Store 001?",
  "context": {
    "tenantId": "tenant-123",
    "agentId": "agent-456"
  }
}

POST /ai/semantic-search
{
  "query": "dairy products",
  "entityTypes": ["Item"],
  "limit": 10
}

POST /ai/relationship-traverse
{
  "entityType": "Item",
  "entityId": "item-123",
  "relationshipType": "SUPPLIER",
  "depth": 2
}
```

### MCP (Model Context Protocol) Server

**MCP Server for Composerp:**

```typescript
interface MCPServer {
  name: "composerp";
  version: "1.0.0";
  tools: [
    {
      name: "get_inventory_position",
      description: "Get inventory position for item at location",
      inputSchema: {
        itemId: string;
        locationId: string;
      }
    },
    {
      name: "create_transaction",
      description: "Create inventory transaction",
      inputSchema: {
        itemId: string;
        locationId: string;
        transactionType: string;
        quantity: number;
      }
    },
    {
      name: "search_items",
      description: "Semantic search for items",
      inputSchema: {
        query: string;
        filters?: Record<string, any>;
      }
    },
    {
      name: "get_relationships",
      description: "Get relationships for entity",
      inputSchema: {
        entityType: string;
        entityId: string;
      }
    }
  ];
  resources: [
    {
      uri: "composerp://items",
      name: "Items",
      description: "All items in the system"
    },
    {
      uri: "composerp://inventory",
      name: "Inventory Positions",
      description: "All inventory positions"
    }
  ];
}
```

**MCP Server Capabilities:**
- **Tool calling** - AI agents can call Composerp functions
- **Resource access** - AI agents can access Composerp data
- **Prompt templates** - Pre-defined prompts for common tasks
- **Streaming** - Real-time data streaming

---

## Implementation Architecture

### Metadata Service

**Dedicated service** for managing custom fields and objects:

```
Metadata Service
├── Custom Field Management
├── Custom Object Management
├── Schema Generation
├── Validation Engine
└── AI Metadata Generation
```

### Database Schema

**Metadata Tables:**

```sql
-- Custom field definitions
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  validation_rules JSONB,
  ai_metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, field_name)
);

-- Custom object definitions
CREATE TABLE custom_objects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  object_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  fields JSONB NOT NULL,
  relationships JSONB,
  ai_metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, object_name)
);

-- Relationship graph
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  source_entity_type VARCHAR(100) NOT NULL,
  source_entity_id UUID NOT NULL,
  target_entity_type VARCHAR(100) NOT NULL,
  target_entity_id UUID NOT NULL,
  relationship_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(tenant_id, source_entity_type, source_entity_id),
  INDEX(tenant_id, target_entity_type, target_entity_id)
);

-- RAG documents
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  embeddings VECTOR(1536), -- OpenAI embeddings dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(tenant_id, entity_type, entity_id)
);
```

### API Endpoints

**Custom Field Management:**

```
GET    /metadata/fields?entityType=Item
POST   /metadata/fields
PUT    /metadata/fields/:id
DELETE /metadata/fields/:id

GET    /metadata/objects
POST   /metadata/objects
PUT    /metadata/objects/:id
DELETE /metadata/objects/:id
```

**AI/RAG Endpoints:**

```
POST   /ai/query
POST   /ai/semantic-search
POST   /ai/relationship-traverse
GET    /ai/rag-documents/:entityType/:entityId
POST   /ai/rag-documents (reindex)
```

**MCP Server:**

```
GET    /mcp/tools
GET    /mcp/resources
POST   /mcp/call-tool
GET    /mcp/resource/:uri
```

---

## Benefits

### For Enterprises
- **No Code Changes** - Customize without developers
- **Salesforce-Like Flexibility** - Familiar customization model
- **User-Friendly** - Display names, descriptions, help text
- **Type Safety** - Validation and type checking

### For AI/RAG
- **Rich Context** - All relationships tracked
- **Semantic Search** - Vector embeddings for all entities
- **Agent Support** - Built-in agent APIs
- **MCP Integration** - Standard protocol for AI tools

### For Developers
- **API-First** - All customization via API
- **Schema Generation** - Automatic schema management
- **Type Safety** - TypeScript types generated from metadata
- **Extensible** - Easy to add new field types

---

*Next: [AI & RAG Architecture](./14-AI-RAG.md)*
