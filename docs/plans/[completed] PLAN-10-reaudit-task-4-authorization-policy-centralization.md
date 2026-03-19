# Plan 10 — Re-audit Task 4: Authorization Policy Centralization

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 4`

| Field | Detail |
|---|---|
| **Objective** | Reduce authorization drift by consolidating duplicated authorization checks into reusable policy helpers. |
| **Current re-audit status** | Completed (authorization checks centralized into policy helpers and covered by regression tests). |
| **Risk if it persists** | Inconsistent authorization over time as new endpoints/features are added. |

## Tasks

- [x] Inventory duplicated authorization checks across services (especially Users + Shopflow).
  - Evidence: `packages/api/src/services/users.service.ts`, `packages/api/src/services/shopflow.service.ts`
- [x] Extract reusable policy helpers and standardize the canonical sources for:
  - user management permissions
  - store-level access rules (from `X-Store-Id` + `companyId`)
- [x] Ensure request-level guards remain first line of defense.
  - Evidence: `packages/api/src/core/auth-context.ts` (`requireRole`, `requireCompanyContext`, `requireShopflowContext`)
- [x] Refactor services to call policy helpers instead of embedding repeated authorization logic.
- [x] Add regression tests covering authorization boundaries (role changes, store changes, company changes).

## Definition of done

- Authorization rules have a single source of truth per rule category.
- Services depend on policy helpers instead of duplicating rule logic.
- Regression tests cover cross-company and cross-store authorization boundaries.

