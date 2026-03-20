# Plan 13 — Re-audit: Production-Critical Prisma Audit

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 13`

| Field | Detail |
|---|---|
| **Objective** | Enforce strict tenant isolation and production-safe Prisma behavior across schema, queries, and migrations. |
| **Current re-audit status** | Completed. |
| **Risk if it persists** | Cross-tenant data exposure, unsafe writes, irreversible production data loss, and integrity drift. |

## Tasks

- [x] Seal tenant scope at mutation boundaries (no id-only update/delete after pre-checks).
  - Evidence targets: `packages/api/src/services/shopflow-notifications.service.ts`, `packages/api/src/services/techservices.service.ts`, `packages/api/src/services/work-orders.service.ts`, `packages/api/src/services/shopflow-sales.service.ts`
- [x] Enforce repository write scoping for tenant safety.
  - Evidence targets: `packages/api/src/repositories/store.repository.ts`, `packages/api/src/repositories/inventory-transfer.repository.ts`, `packages/api/src/repositories/product.repository.ts`, `packages/api/src/repositories/customer.repository.ts`, `packages/api/src/repositories/supplier.repository.ts`, `packages/api/src/repositories/category.repository.ts`
- [x] Add schema-level same-tenant relational guarantees (composite tenant-aware constraints/FKs).
  - Evidence target: `packages/database/prisma/schema.prisma`
- [x] Harden `InventoryTransfer` relational integrity with explicit store FKs and company-consistent constraints.
  - Evidence target: `packages/database/prisma/schema.prisma`, migration `20260319200000_add_inventory_transfer_store_fks_and_indexes`
- [x] Replace destructive migration steps with backward-safe staged migration strategy.
  - Evidence targets: `packages/database/prisma/migrations/20260310000000_enforce_tenant_scoping/migration.sql`, `packages/database/prisma/manual_scripts/001_remove_product_stock_fields.sql`
- [x] Review cascade delete blast radius for audit/history/compliance-sensitive entities.
  - Evidence target: `packages/database/prisma/migrations/20260214100000_baseline/migration.sql`
- [x] Close index gaps on tenant key and hot filter/join paths.
  - Evidence targets: `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260319200000_add_inventory_transfer_store_fks_and_indexes/migration.sql`
- [x] Add regression tests for cross-tenant mutation attempts and relation injection.
  - Evidence targets: `packages/api/src/__tests__/integration/shopflow-tenant-mutation-isolation.test.ts`, `packages/api/src/__tests__/integration/tenant-integrity-composite-fk.test.ts`

## Definition of done

- All critical/high Prisma write paths enforce tenant scoping at query boundary.
- Schema and migrations enforce tenant-safe relational integrity without destructive production data loss.
- Bulk operations (`updateMany`/`deleteMany`) are strictly scoped and validated.
- Regression tests prove cross-tenant access is blocked for reads, writes, and relations.

