# Plan 13 — Re-audit: Production-Critical Prisma Audit

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 13`

| Field | Detail |
|---|---|
| **Objective** | Enforce strict tenant isolation and production-safe Prisma behavior across schema, queries, and migrations. |
| **Current re-audit status** | Active (critical and high-risk gaps identified). |
| **Risk if it persists** | Cross-tenant data exposure, unsafe writes, irreversible production data loss, and integrity drift. |

## Tasks

- [ ] Seal tenant scope at mutation boundaries (no id-only update/delete after pre-checks).
  - Evidence targets: `packages/api/src/services/shopflow-notifications.service.ts`, `packages/api/src/services/techservices.service.ts`, `packages/api/src/services/work-orders.service.ts`, `packages/api/src/services/shopflow-sales.service.ts`
- [ ] Enforce repository write scoping for tenant safety.
  - Evidence targets: `packages/api/src/repositories/store.repository.ts`, `packages/api/src/repositories/inventory-transfer.repository.ts`, `packages/api/src/repositories/product.repository.ts`, `packages/api/src/repositories/customer.repository.ts`, `packages/api/src/repositories/supplier.repository.ts`, `packages/api/src/repositories/category.repository.ts`
- [ ] Add schema-level same-tenant relational guarantees (composite tenant-aware constraints/FKs).
  - Evidence target: `packages/database/prisma/schema.prisma`
- [ ] Harden `InventoryTransfer` relational integrity with explicit store FKs and company-consistent constraints.
  - Evidence target: `packages/database/prisma/schema.prisma`
- [ ] Replace destructive migration steps with backward-safe staged migration strategy.
  - Evidence targets: `packages/database/prisma/migrations/20260310000000_enforce_tenant_scoping/migration.sql`, `packages/database/prisma/migrations/manual/001_remove_product_stock_fields.sql`
- [ ] Review cascade delete blast radius for audit/history/compliance-sensitive entities.
  - Evidence target: `packages/database/prisma/migrations/20260214100000_baseline/migration.sql`
- [ ] Close index gaps on tenant key and hot filter/join paths.
  - Evidence targets: `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260310000001_add_missing_indexes/migration.sql`
- [ ] Add regression tests for cross-tenant mutation attempts and relation injection.
  - Evidence targets: `packages/api/src/__tests__/integration/`

## Definition of done

- All critical/high Prisma write paths enforce tenant scoping at query boundary.
- Schema and migrations enforce tenant-safe relational integrity without destructive production data loss.
- Bulk operations (`updateMany`/`deleteMany`) are strictly scoped and validated.
- Regression tests prove cross-tenant access is blocked for reads, writes, and relations.

