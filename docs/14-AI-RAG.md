# AI & RAG Architecture

Composerp is designed from the ground up to support **Retrieval Augmented Generation (RAG)**, **AI agents**, and **MCP servers**.

## Design Principles

1. **Cross-References by Default** - All relationships automatically tracked
2. **Semantic Metadata** - Rich metadata for AI understanding
3. **Vector Embeddings** - All text fields embedded for semantic search
4. **Knowledge Graph** - Relationship graph for context
5. **Agent-Ready** - Built-in support for AI agents
6. **MCP Compatible** - Model Context Protocol server support

---

## RAG Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│              Entity Updates (Item, Transaction, etc.)    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Relationship Tracker                        │
│  - Detects relationships automatically                   │
│  - Updates relationship graph                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              RAG Document Generator                      │
│  - Creates natural language representation              │
│  - Includes all fields and relationships                │
│  - Generates embeddings                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Vector Store (Pinecone/Weaviate/Qdrant)    │
│  - Stores embeddings                                    │
│  - Enables semantic search                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              RAG Query Engine                           │
│  - Receives natural language query                      │
│  - Retrieves relevant documents                        │
│  - Returns context for LLM                             │
└─────────────────────────────────────────────────────────┘
```

### RAG Document Structure

Every entity in Composerp has a corresponding **RAG document**:

```typescript
interface RAGDocument {
  id: string;
  tenantId: string;
  entityType: string;                // "Item", "Supplier", "Location", etc.
  entityId: string;
  
  // Natural language representation
  content: string;
  
  // Vector embeddings (1536 dimensions for OpenAI)
  embeddings: number[];
  
  // Rich metadata
  metadata: {
    // All field values
    fields: Record<string, any>;
    
    // Related entities
    relationships: {
      type: string;                  // "SUPPLIER", "LOCATION", etc.
      targetEntityType: string;
      targetEntityId: string;
      targetDisplayName: string;     // For human-readable context
    }[];
    
    // Semantic information
    semanticType: string;            // "product", "supplier", "location"
    category?: string;               // For categorization
    tags: string[];                  // Searchable tags
    
    // Timestamps
    createdAt: string;
    updatedAt: string;
  };
  
  // For filtering
  filters: {
    tenantId: string;
    entityType: string;
    category?: string;
    isActive?: boolean;
  };
}
```

### Example RAG Documents

#### Item Document

```json
{
  "entityType": "Item",
  "entityId": "item-123",
  "content": "Product: Organic Whole Milk (SKU: MILK-ORG-001). Category: Dairy, Subcategory: Milk. Brand: FarmFresh Organic. Unit of Measure: Gallon. Temperature Zone: Refrigerated. Supplier: FarmFresh Dairy (Supplier Code: FF-DAIRY-001, Lead Time: 3 days). Available Inventory: Store 001 (50 gallons), Store 002 (30 gallons), Warehouse A (200 gallons). Recent Sales: 25 gallons sold at Store 001 on 2026-02-08. Forecast: Expected demand of 30 gallons per day for next 30 days.",
  "embeddings": [0.123, 0.456, ...],
  "metadata": {
    "fields": {
      "sku": "MILK-ORG-001",
      "name": "Organic Whole Milk",
      "category": "Dairy",
      "subCategory": "Milk",
      "brand": "FarmFresh Organic",
      "unitOfMeasure": "Gallon",
      "temperatureZone": "REFRIGERATED"
    },
    "relationships": [
      {
        "type": "SUPPLIER",
        "targetEntityType": "Supplier",
        "targetEntityId": "supplier-456",
        "targetDisplayName": "FarmFresh Dairy"
      },
      {
        "type": "INVENTORY_STORE",
        "targetEntityType": "Location",
        "targetEntityId": "location-001",
        "targetDisplayName": "Store 001"
      },
      {
        "type": "INVENTORY_STORE",
        "targetEntityType": "Location",
        "targetEntityId": "location-002",
        "targetDisplayName": "Store 002"
      },
      {
        "type": "INVENTORY_WAREHOUSE",
        "targetEntityType": "Location",
        "targetEntityId": "warehouse-a",
        "targetDisplayName": "Warehouse A"
      }
    ],
    "semanticType": "product",
    "category": "Dairy",
    "tags": ["milk", "dairy", "organic", "refrigerated", "grocery"]
  }
}
```

#### Supplier Document

```json
{
  "entityType": "Supplier",
  "entityId": "supplier-456",
  "content": "Supplier: FarmFresh Dairy (Code: FF-DAIRY-001). Contact: contact@farmfresh.com, Phone: 555-0123. Address: 123 Farm Road, Dairyville, CA 12345. Provides products: Organic Whole Milk (MILK-ORG-001), Organic Yogurt (YOG-ORG-001), Organic Cheese (CHEESE-ORG-001). Lead Times: 3-5 days. Payment Terms: NET30. Active Purchase Orders: 2 orders totaling $5,000.",
  "embeddings": [0.789, 0.012, ...],
  "metadata": {
    "fields": {
      "code": "FF-DAIRY-001",
      "name": "FarmFresh Dairy",
      "contactEmail": "contact@farmfresh.com",
      "contactPhone": "555-0123"
    },
    "relationships": [
      {
        "type": "PROVIDES_ITEMS",
        "targetEntityType": "Item",
        "targetEntityId": "item-123",
        "targetDisplayName": "Organic Whole Milk"
      },
      {
        "type": "PURCHASE_ORDER",
        "targetEntityType": "PurchaseOrder",
        "targetEntityId": "po-789",
        "targetDisplayName": "PO-2026-001"
      }
    ],
    "semanticType": "supplier",
    "tags": ["dairy", "organic", "food", "supplier"]
  }
}
```

---

## Relationship Graph

### Automatic Relationship Detection

Composerp **automatically detects and tracks** all relationships:

```typescript
interface Relationship {
  id: string;
  tenantId: string;
  
  // Source entity
  sourceEntityType: string;
  sourceEntityId: string;
  
  // Target entity
  targetEntityType: string;
  targetEntityId: string;
  
  // Relationship type
  relationshipType: string;          // "SUPPLIER_ITEM", "LOCATION_ITEM", etc.
  
  // Relationship metadata
  metadata: {
    // For SupplierItem relationship
    leadTimeDays?: number;
    unitCost?: number;
    
    // For InventoryPosition relationship
    quantity?: number;
    available?: number;
    
    // For PurchaseOrder relationship
    poNumber?: string;
    status?: string;
    
    // For Transaction relationship
    transactionType?: string;
    transactionDate?: string;
  };
  
  // Strength/weight of relationship (for graph algorithms)
  weight?: number;
  
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Relationship Types

**Automatic Relationships:**

| Source Entity | Target Entity | Relationship Type | Trigger |
|---------------|---------------|-------------------|---------|
| Item | Supplier | SUPPLIER_ITEM | SupplierItem created |
| Item | Location | LOCATION_ITEM | InventoryPosition created |
| PurchaseOrder | Supplier | PO_SUPPLIER | PurchaseOrder created |
| PurchaseOrder | Location | PO_LOCATION | PurchaseOrder created |
| Transaction | Item | TXN_ITEM | Transaction created |
| Transaction | Location | TXN_LOCATION | Transaction created |
| Forecast | Item | FORECAST_ITEM | Forecast created |
| Forecast | Location | FORECAST_LOCATION | Forecast created |

**Custom Relationships:**
- User-defined relationships via custom fields (LOOKUP, MASTER_DETAIL)

### Relationship Graph Queries

**Traverse Relationships:**

```typescript
// Get all items supplied by a supplier
GET /relationships/traverse
{
  "sourceEntityType": "Supplier",
  "sourceEntityId": "supplier-456",
  "relationshipType": "SUPPLIER_ITEM",
  "targetEntityType": "Item"
}

// Get all locations with inventory for an item
GET /relationships/traverse
{
  "sourceEntityType": "Item",
  "sourceEntityId": "item-123",
  "relationshipType": "LOCATION_ITEM",
  "targetEntityType": "Location"
}

// Multi-hop traversal: Get all suppliers for items at a location
GET /relationships/traverse
{
  "sourceEntityType": "Location",
  "sourceEntityId": "location-001",
  "path": [
    { "relationshipType": "LOCATION_ITEM", "targetEntityType": "Item" },
    { "relationshipType": "SUPPLIER_ITEM", "targetEntityType": "Supplier" }
  ]
}
```

---

## Semantic Search

### Vector Embeddings

**Embedding Generation:**

```typescript
interface EmbeddingService {
  // Generate embeddings for text
  generateEmbedding(text: string): Promise<number[]>;
  
  // Generate embeddings for entity
  generateEntityEmbedding(entity: RAGDocument): Promise<number[]>;
  
  // Batch generate embeddings
  generateBatchEmbeddings(entities: RAGDocument[]): Promise<number[][]>;
}
```

**Embedding Models:**
- **OpenAI text-embedding-3-large** (3072 dimensions) - Recommended
- **OpenAI text-embedding-3-small** (1536 dimensions) - Cost-effective
- **OpenAI text-embedding-ada-002** (1536 dimensions) - Legacy
- **Cohere embed-english-v3.0** - Alternative
- **Custom models** - Fine-tuned on retail domain

### Vector Store Options

**Option 1: Pinecone**
- Managed vector database
- Excellent performance
- Pay-per-use pricing

**Option 2: Weaviate**
- Open source
- Self-hosted or cloud
- Built-in RAG capabilities

**Option 3: Qdrant**
- Open source
- High performance
- Self-hosted or cloud

**Option 4: PostgreSQL with pgvector**
- Extension for PostgreSQL
- No separate infrastructure
- Good for smaller deployments

### Semantic Search API

```typescript
POST /ai/semantic-search
{
  "query": "dairy products with low stock",
  "entityTypes": ["Item"],              // Filter by entity type
  "filters": {
    "category": "Dairy",
    "available": { "$lt": 20 }         // Available < 20
  },
  "limit": 10,
  "includeRelationships": true,        // Include related entities
  "relationshipDepth": 2               // Traverse 2 levels deep
}

// Response
{
  "results": [
    {
      "entityType": "Item",
      "entityId": "item-123",
      "score": 0.95,                    // Similarity score
      "content": "...",
      "metadata": {...},
      "relationships": [...]            // Related entities
    }
  ],
  "queryEmbedding": [0.123, ...],      // Generated query embedding
  "totalResults": 5
}
```

---

## AI Agent Support

### Agent API

**Natural Language Queries:**

```typescript
POST /ai/query
{
  "query": "What items are low in stock at Store 001?",
  "context": {
    "tenantId": "tenant-123",
    "agentId": "agent-456",
    "conversationId": "conv-789"
  },
  "includeReasoning": true             // Include agent reasoning steps
}

// Response
{
  "answer": "There are 3 items with low stock at Store 001: Organic Whole Milk (5 gallons available, reorder point: 20), Organic Yogurt (8 units available, reorder point: 15), and Organic Cheese (3 units available, reorder point: 10).",
  "entities": [
    {
      "entityType": "Item",
      "entityId": "item-123",
      "name": "Organic Whole Milk",
      "available": 5,
      "reorderPoint": 20
    }
  ],
  "reasoning": [
    "Retrieved inventory positions for Store 001",
    "Filtered items with available < reorderPoint",
    "Retrieved replenishment rules for each item",
    "Formatted response with item details"
  ],
  "sources": [
    {
      "entityType": "InventoryPosition",
      "entityId": "pos-123"
    }
  ]
}
```

**Agent Tools:**

```typescript
// Available tools for agents
interface AgentTools {
  // Inventory tools
  getInventoryPosition(itemId: string, locationId: string): InventoryPosition;
  createTransaction(transaction: CreateTransactionDto): Transaction;
  
  // Forecasting tools
  generateForecast(itemId: string, locationId: string): Forecast[];
  getForecastAccuracy(itemId: string, locationId: string): AccuracyMetrics;
  
  // Replenishment tools
  evaluateReplenishment(locationId: string): PurchaseOrder[];
  createPurchaseOrder(order: CreatePurchaseOrderDto): PurchaseOrder;
  
  // Search tools
  semanticSearch(query: string, filters?: any): RAGDocument[];
  relationshipTraverse(entityType: string, entityId: string, depth: number): Relationship[];
  
  // Custom tools (from custom fields/objects)
  [toolName: string]: (...args: any[]) => any;
}
```

---

## MCP Server

### Model Context Protocol

Composerp provides an **MCP server** for AI models to interact with the system.

### MCP Server Definition

```typescript
interface MCPServer {
  name: "composerp";
  version: "1.0.0";
  
  // Available tools
  tools: MCPTool[];
  
  // Available resources
  resources: MCPResource[];
  
  // Prompt templates
  prompts: MCPPrompt[];
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

interface MCPPrompt {
  name: string;
  description: string;
  arguments: JSONSchema;
}
```

### MCP Tools

```typescript
const MCPTools: MCPTool[] = [
  {
    name: "get_inventory_position",
    description: "Get current inventory position for an item at a location",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Item ID" },
        locationId: { type: "string", description: "Location ID" }
      },
      required: ["itemId", "locationId"]
    }
  },
  {
    name: "create_transaction",
    description: "Create an inventory transaction (receipt, sale, transfer, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        locationId: { type: "string" },
        transactionType: {
          type: "string",
          enum: ["RECEIPT", "SALE", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT"]
        },
        quantity: { type: "number" },
        unitCost: { type: "number" },
        referenceId: { type: "string" },
        notes: { type: "string" }
      },
      required: ["itemId", "locationId", "transactionType", "quantity"]
    }
  },
  {
    name: "semantic_search",
    description: "Semantic search for entities (items, suppliers, locations, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        entityTypes: {
          type: "array",
          items: { type: "string" },
          description: "Filter by entity types (Item, Supplier, Location, etc.)"
        },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  },
  {
    name: "get_relationships",
    description: "Get all relationships for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entityType: { type: "string" },
        entityId: { type: "string" },
        relationshipType: { type: "string" },
        depth: { type: "number", default: 1 }
      },
      required: ["entityType", "entityId"]
    }
  },
  {
    name: "generate_forecast",
    description: "Generate demand forecast for an item at a location",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        locationId: { type: "string" },
        modelType: { type: "string", default: "BASELINE" },
        periods: { type: "number", default: 4 }
      },
      required: ["itemId", "locationId"]
    }
  },
  {
    name: "evaluate_replenishment",
    description: "Evaluate replenishment needs and generate purchase orders",
    inputSchema: {
      type: "object",
      properties: {
        locationId: { type: "string" }
      },
      required: ["locationId"]
    }
  }
];
```

### MCP Resources

```typescript
const MCPResources: MCPResource[] = [
  {
    uri: "composerp://items",
    name: "Items",
    description: "All items in the system",
    mimeType: "application/json"
  },
  {
    uri: "composerp://inventory",
    name: "Inventory Positions",
    description: "All inventory positions across all locations"
  },
  {
    uri: "composerp://suppliers",
    name: "Suppliers",
    description: "All suppliers"
  },
  {
    uri: "composerp://locations",
    name: "Locations",
    description: "All stores and warehouses"
  },
  {
    uri: "composerp://relationships",
    name: "Relationship Graph",
    description: "Complete relationship graph"
  }
];
```

### MCP Prompts

```typescript
const MCPPrompts: MCPPrompt[] = [
  {
    name: "inventory_analysis",
    description: "Analyze inventory levels and identify issues",
    arguments: {
      type: "object",
      properties: {
        locationId: { type: "string" },
        category: { type: "string" }
      }
    }
  },
  {
    name: "replenishment_recommendation",
    description: "Generate replenishment recommendations",
    arguments: {
      type: "object",
      properties: {
        locationId: { type: "string" }
      }
    }
  }
];
```

---

## Implementation Architecture

### Services

```
┌─────────────────────────────────────────┐
│         RAG Service                     │
│  - Document generation                  │
│  - Embedding generation                 │
│  - Vector store management              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Relationship Service                │
│  - Relationship detection                │
│  - Graph management                      │
│  - Traversal queries                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         AI Agent Service                 │
│  - Natural language queries              │
│  - Tool orchestration                    │
│  - Reasoning engine                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         MCP Server                       │
│  - Tool registration                     │
│  - Resource management                   │
│  - Protocol handling                     │
└─────────────────────────────────────────┘
```

### Database Schema

```sql
-- RAG documents
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  embeddings VECTOR(3072), -- OpenAI text-embedding-3-large
  metadata JSONB NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX(tenant_id, entity_type, entity_id),
  INDEX USING ivfflat (embeddings vector_cosine_ops) -- Vector index
);

-- Relationships
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  source_entity_type VARCHAR(100) NOT NULL,
  source_entity_id UUID NOT NULL,
  target_entity_type VARCHAR(100) NOT NULL,
  target_entity_id UUID NOT NULL,
  relationship_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX(tenant_id, source_entity_type, source_entity_id),
  INDEX(tenant_id, target_entity_type, target_entity_id),
  INDEX(tenant_id, relationship_type)
);

-- Agent sessions
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  conversation_id UUID,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX(tenant_id, agent_id, conversation_id)
);
```

---

## Benefits

### For AI/RAG
- **Rich Context** - All relationships automatically tracked
- **Semantic Search** - Vector embeddings for all entities
- **Knowledge Graph** - Complete relationship graph
- **Natural Language** - Human-readable content generation

### For AI Agents
- **Tool Access** - Built-in tools for common operations
- **Natural Language Queries** - Query in plain English
- **Reasoning Support** - Step-by-step reasoning
- **Context Awareness** - Full entity and relationship context

### For MCP Integration
- **Standard Protocol** - Compatible with MCP clients
- **Tool Discovery** - Automatic tool registration
- **Resource Access** - Direct data access
- **Prompt Templates** - Pre-defined prompts

---

*Next: [Customization & Extensibility](./13-CUSTOMIZATION.md)*
