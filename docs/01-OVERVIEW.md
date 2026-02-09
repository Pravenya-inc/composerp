# Composerp Overview

## Vision

Composerp is a **composable, API-first ERP platform** designed to replace monolithic legacy ERPs. It enables enterprises to build, customize, and evolve their business systems without vendor lock-in or forced upgrades.

## Core Principles

### 1. Modular & Independently Deployable
- **Microservices/domain services** architecture
- Each service can be developed, deployed, and scaled independently
- Services communicate via well-defined APIs
- No shared databases between services (database per service pattern)

### 2. Canonical Data Models
- **Extensible JSON schema style** per domain
- Standardized entities across the platform:
  - Item (Product)
  - Supplier (Vendor)
  - Location (Store/Warehouse)
  - InventoryPosition
  - Transaction
  - Forecast
  - Plan
  - PurchaseOrder
- **Custom attributes** support for enterprise-specific fields

### 3. Event-Driven Architecture
- **Every business action emits events**
- Services react to events asynchronously
- Enables loose coupling between services
- Supports audit trails and event sourcing patterns
- Kafka-like event bus for state changes

### 4. Configurable Workflows
- **Rules instead of hardcoded logic**
- Business logic defined as configuration
- No code changes required for workflow modifications
- Supports different rules per product/vendor/location
- Priority-based rule evaluation

### 5. Enterprise Ownership
- **Full customization control**
- No forced upgrades
- Enterprises own their data and configurations
- API-first approach enables integration with existing systems

### 6. Salesforce-Like Flexibility
- **Custom fields** - Add custom fields to any entity with types, validation, display names
- **Custom objects** - Create entirely new entities/tables dynamically
- **User-friendly names** - Display names independent of technical field names
- **No code changes** - Customize without developers

### 7. AI-First Design
- **Cross-references by default** - All relationships automatically tracked
- **RAG-ready** - Structured for Retrieval Augmented Generation
- **AI agents** - Built-in support for AI agents with natural language queries
- **MCP servers** - Model Context Protocol server support
- **Semantic search** - Vector embeddings for all entities

## Design Goals

### Cloud Native
- Containerized services
- Kubernetes-ready
- Auto-scaling capabilities
- Multi-cloud support

### Scalable
- Designed for enterprise scale:
  - 20 warehouses
  - 2000 stores
  - Millions of products
  - High transaction volumes
- Horizontal scaling
- Database sharding support

### Configurable Business Logic
- No hardcoded retailer-specific assumptions
- Configurable replenishment rules
- Customizable workflows
- Extensible data models

### Strong Typing & Schemas
- TypeScript for type safety
- JSON Schema for validation
- OpenAPI/Swagger for API documentation
- GraphQL support (optional)

## Product Evolution

Composerp is intended to evolve into a **full composable ERP platform** across industries:

1. **Phase 1: Retail Merchandising (openMerch)** ← Current Focus
   - Inventory Ledger
   - Forecasting
   - Replenishment
   - Planning

2. **Phase 2: Supply Chain**
   - Transportation Management
   - Warehouse Management
   - Logistics Optimization

3. **Phase 3: Financials**
   - General Ledger
   - Accounts Payable/Receivable
   - Financial Reporting

4. **Phase 4: Human Resources**
   - Payroll
   - Workforce Management
   - Talent Management

5. **Phase 5: Manufacturing**
   - Production Planning
   - Quality Management
   - Shop Floor Control

## Target Users

### Primary Users
- **Retail Enterprises** with complex inventory operations
- **Multi-location retailers** (stores + warehouses)
- **Organizations** requiring customization and control

### Key Requirements
- Integration with existing systems (WMS, procurement)
- Support for multiple temperature zones
- Category-based product management
- Real-time inventory visibility
- Automated replenishment
- Demand forecasting

## Success Metrics

- **Modularity**: Services can be deployed independently
- **Scalability**: Handles 2000+ stores, 20+ warehouses
- **Performance**: Sub-second API response times
- **Reliability**: 99.9% uptime
- **Extensibility**: Custom attributes and workflows without code changes
- **Integration**: Seamless integration with existing systems

---

*Next: [Architecture](./02-ARCHITECTURE.md)*
