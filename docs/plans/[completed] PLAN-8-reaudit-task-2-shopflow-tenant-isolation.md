# Plan 8 — Re-audit Task 2: Shopflow Tenant Isolation

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 2`

| Field | Detail |
|---|---|
| **Objective** | Remove Shopflow tenant-scope defects (loyalty/customer/points/config). |
| **Current re-audit status** | Active (tenant-scope defects remain). |
| **Risk if it persists** | Cross-company data reads and incorrect global configuration mutation. |

## Tasks

- [x] Enforce tenant scoping invariants in Shopflow loyalty/customer/points/config paths.
  - Evidence: `packages/api/src/services/shopflow.service.ts` (`updateLoyaltyConfig()` and `getCustomerPoints()`).
- [x] Remove/replace any null/global `companyId` write paths.
  - Evidence: `packages/api/src/services/shopflow.service.ts` (`updateLoyaltyConfig()`).
- [x] Add regression tests that attempt cross-tenant access for:
  - loyalty config reads/writes
  - customer points reads
- [x] Verify corrected behavior returns `403/404` appropriately without leaking resource existence.

## Definition of done

- All affected Shopflow service paths enforce `companyId` scoping on every referenced entity lookup/write.
- Negative tests prevent cross-tenant leakage and validate consistent error behavior.

