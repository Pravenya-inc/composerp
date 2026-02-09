# Multi-Tenancy Architecture

This document describes the **multi-tenancy** approach for Composerp.

## Principles

1. **Tenant Isolation** - Complete data isolation between tenants
2. **Shared Infrastructure** - Efficient resource utilization
3. **Tenant Context** - All operations scoped to tenant
4. **Security** - Prevent cross-tenant data access
5. **Scalability** - Support thousands of tenants

---

## Multi-Tenancy Models

### Option 1: Shared Database, Shared Schema (Current Approach)

**Architecture:**
- Single database
- Single schema
- `tenantId` column in every table
- Application-level filtering

**Pros:**
- ✅ Efficient resource usage
- ✅ Easy to manage
- ✅ Lower cost
- ✅ Simple backup/restore

**Cons:**
- ❌ Risk of data leakage (if bug in filtering)
- ❌ Harder to scale per tenant
- ❌ Shared performance impact

**Use Case:** Recommended for initial implementation

### Option 2: Shared Database, Separate Schema

**Architecture:**
- Single database
- Separate schema per tenant (`tenant_123`, `tenant_456`)
- No `tenantId` column needed

**Pros:**
- ✅ Better isolation
- ✅ Easier per-tenant customization
- ✅ Better performance isolation

**Cons:**
- ❌ More complex management
- ❌ Schema migration complexity
- ❌ Higher operational overhead

**Use Case:** Medium-scale deployments

### Option 3: Separate Database

**Architecture:**
- Separate database per tenant
- Complete isolation

**Pros:**
- ✅ Complete isolation
- ✅ Easy per-tenant scaling
- ✅ Easy per-tenant backup

**Cons:**
- ❌ High cost
- ❌ Complex management
- ❌ Resource overhead

**Use Case:** Enterprise customers, high-security requirements

---

## Current Implementation: Shared Database, Shared Schema

### Database Schema

Every table includes `tenantId`:

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sku VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ...
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_items_tenant_id ON items(tenant_id);
```

### Application-Level Filtering

**Prisma Example:**
```typescript
// Always filter by tenantId
const items = await prisma.item.findMany({
  where: {
    tenantId: currentTenantId,
    isActive: true
  }
});
```

### Tenant Context

**Extract from JWT:**
```typescript
// JWT contains tenantId
const token = jwt.decode(authToken);
const tenantId = token.tenantId;

// Use in all queries
const items = await this.getItemService().findAll(tenantId);
```

---

## Tenant Isolation Strategies

### 1. Row-Level Security (PostgreSQL)

**Implementation:**
```sql
-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON items
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**Pros:**
- ✅ Database-level enforcement
- ✅ Prevents application bugs
- ✅ Strong security

**Cons:**
- ❌ Requires connection per tenant (or session variable)
- ❌ More complex connection pooling

### 2. Application-Level Filtering (Current)

**Implementation:**
```typescript
// Always include tenantId in queries
const items = await prisma.item.findMany({
  where: { tenantId }
});
```

**Pros:**
- ✅ Simple implementation
- ✅ Works with connection pooling
- ✅ Flexible

**Cons:**
- ❌ Risk if developer forgets filter
- ❌ Requires code review discipline

**Mitigation:**
- Code review checklist
- Automated tests
- Middleware to enforce tenantId

### 3. Middleware Enforcement

**Implementation:**
```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = this.extractTenantId(request);
    
    // Set tenantId in request
    request.tenantId = tenantId;
    
    return true;
  }
}

// Service automatically uses tenantId
@Injectable()
export class ItemService {
  async findAll(tenantId: string) {
    return this.prisma.item.findMany({
      where: { tenantId } // Enforced by service
    });
  }
}
```

---

## Tenant Data Model

### Tenant Entity

```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;              // URL-friendly identifier
  status: TenantStatus;      // ACTIVE, SUSPENDED, CANCELLED
  subscriptionTier: string;  // FREE, PRO, ENTERPRISE
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum TenantStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED"
}
```

### Tenant Configuration

```typescript
interface TenantConfig {
  tenantId: string;
  settings: {
    defaultCurrency: string;
    defaultTimezone: string;
    dateFormat: string;
    numberFormat: string;
  };
  features: {
    forecasting: boolean;
    advancedReplenishment: boolean;
    customAttributes: boolean;
  };
  limits: {
    maxLocations: number;
    maxItems: number;
    maxUsers: number;
  };
}
```

---

## Tenant Context Propagation

### Request Flow

```
1. Client Request
   ↓
2. API Gateway (Extract tenantId from JWT)
   ↓
3. Service (Receive tenantId in request)
   ↓
4. Database Query (Filter by tenantId)
```

### JWT Token

```json
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "roles": ["admin", "user"],
  "exp": 1234567890
}
```

### Service-to-Service Communication

**Option 1: Pass tenantId in header**
```
X-Tenant-Id: tenant-uuid
```

**Option 2: Include in event**
```json
{
  "eventType": "INVENTORY_UPDATED",
  "tenantId": "tenant-uuid",
  "payload": {...}
}
```

---

## Tenant Isolation Best Practices

### 1. Always Filter by tenantId

**✅ Good:**
```typescript
const items = await prisma.item.findMany({
  where: { tenantId, isActive: true }
});
```

**❌ Bad:**
```typescript
const items = await prisma.item.findMany({
  where: { isActive: true } // Missing tenantId!
});
```

### 2. Validate tenantId in Middleware

```typescript
@Injectable()
export class TenantGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = this.extractTenantId(request);
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID required');
    }
    
    request.tenantId = tenantId;
    return true;
  }
}
```

### 3. Use Base Service Class

```typescript
abstract class BaseService {
  protected async findOne<T>(
    model: string,
    id: string,
    tenantId: string
  ): Promise<T> {
    return this.prisma[model].findFirst({
      where: { id, tenantId }
    });
  }
}
```

### 4. Automated Tests

```typescript
describe('Tenant Isolation', () => {
  it('should not return items from other tenants', async () => {
    const tenant1Items = await service.getItems('tenant-1');
    const tenant2Items = await service.getItems('tenant-2');
    
    expect(tenant1Items).not.toContain(tenant2Items[0]);
  });
});
```

---

## Tenant Scaling

### Per-Tenant Limits

```typescript
interface TenantLimits {
  maxLocations: number;      // 2000 stores max
  maxItems: number;          // 1M items max
  maxUsers: number;          // 100 users max
  maxApiCallsPerHour: number; // 10000 calls/hour
}
```

### Resource Allocation

**Option 1: Shared Resources**
- All tenants share same resources
- Fair usage policies
- Cost-effective

**Option 2: Reserved Resources**
- Dedicated resources per tenant
- Guaranteed performance
- Higher cost

---

## Tenant Onboarding

### Steps

1. **Create Tenant** - Create tenant record
2. **Provision Database** - Set up tenant data
3. **Configure Settings** - Set default settings
4. **Create Admin User** - Create first admin user
5. **Send Welcome Email** - Send onboarding email

### API

```
POST /tenants
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "adminEmail": "admin@acme.com"
}
```

---

## Tenant Migration

### Export Tenant Data

```typescript
async exportTenantData(tenantId: string) {
  const data = {
    items: await this.getItemService().export(tenantId),
    locations: await this.getLocationService().export(tenantId),
    // ... other entities
  };
  
  return data;
}
```

### Import Tenant Data

```typescript
async importTenantData(tenantId: string, data: TenantData) {
  await this.prisma.$transaction(async (tx) => {
    await this.getItemService().import(tenantId, data.items, tx);
    await this.getLocationService().import(tenantId, data.locations, tx);
    // ... other entities
  });
}
```

---

*Next: [Deployment](./10-DEPLOYMENT.md)*
