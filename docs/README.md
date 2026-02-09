# Composerp Documentation

**Composerp** is a modern, composable, API-first ERP platform designed to replace monolithic legacy ERPs.

## 📚 Documentation Index

### Getting Started
- **[Overview](./01-OVERVIEW.md)** - Product vision, principles, and goals
- **[Architecture](./02-ARCHITECTURE.md)** - High-level architecture and design patterns
- **[Technology Stack](./03-TECHNOLOGY-STACK.md)** - Technology evaluation and decisions

### Domain Design
- **[Domain Models](./04-DOMAIN-MODELS.md)** - Canonical data models and entities
- **[Retail Merchandising (openMerch)](./05-OPENMERCH.md)** - Retail domain specifications
- **[API Design](./06-API-DESIGN.md)** - API contracts and standards

### Technical Deep Dives
- **[Event-Driven Architecture](./07-EVENT-DRIVEN.md)** - Event bus patterns and implementation
- **[Workflow & Configuration](./08-WORKFLOWS.md)** - Configurable business logic
- **[Multi-Tenancy](./09-MULTI-TENANCY.md)** - Tenant isolation and data architecture

### Operations
- **[Deployment](./10-DEPLOYMENT.md)** - Cloud-native deployment strategies
- **[Scalability](./11-SCALABILITY.md)** - Scaling considerations for 20 warehouses, 2000 stores
- **[Integration Patterns](./12-INTEGRATION.md)** - Integrating with existing WMS/procurement systems

### Reference
- **[Glossary](./REFERENCE-GLOSSARY.md)** - Terminology and concepts
- **[Decisions Log](./DECISIONS.md)** - Architecture and technology decisions

---

## 🎯 Core Principles

1. **Modular & Independently Deployable** - Microservices/domain services architecture
2. **Canonical Data Models** - Extensible JSON schema style per domain
3. **Event-Driven** - Every business action emits events
4. **Configurable Workflows** - Rules instead of hardcoded logic
5. **Enterprise Ownership** - Full customization control, no forced upgrades

## 🏗️ Current Focus: Retail Merchandising (openMerch)

### Core Modules
1. **Planning Service** - Assortment planning, financial targets, store clusters, scenario planning
2. **Forecasting Service** - Demand forecasting by item/location/time with pluggable models
3. **Replenishment & Ordering Service** - Min/max, safety stock, lead time logic, automatic PO generation
4. **Store Stock Ledger Service (SSLE)** - Real-time inventory per store
5. **Warehouse Stock Ledger Service (WSLE)** - Inventory per DC with case/pallet level tracking

## 📊 Retail Context

- **20 Warehouses** (Distribution Centers)
- **2000 Stores**
- **Products** spanning multiple categories and subcategories
- **Multiple WMS** systems (warehouse management)
- **Multiple Procurement** systems
- **Temperature Zones** - Ambient, Refrigerated, Frozen
- **Product Categories** - Various retail categories

---

## 🚀 Getting Started

1. Read the [Overview](./01-OVERVIEW.md) to understand the product vision
2. Review [Architecture](./02-ARCHITECTURE.md) for system design
3. Explore [Technology Stack](./03-TECHNOLOGY-STACK.md) for implementation options
4. Study [Domain Models](./04-DOMAIN-MODELS.md) for data structure

---

*Last Updated: February 2026*
