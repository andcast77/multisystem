# Plan 7 — Re-audit Task 1: Users Authorization

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 1`

| Field | Detail |
|---|---|
| **Objective** | Prevent regression of `/api/users*` authorization invariants (RBAC + resolved `companyId` + service-layer membership checks). |
| **Current re-audit status** | Resolved, but must remain protected long-term. |
| **Risk if it regresses** | Tenant/user management actions become broadly accessible. |

## Tasks

- [ ] Add/extend regression tests to ensure every `/api/users*` route keeps the required preHandlers.
  - Evidence: `packages/api/src/controllers/users.controller.ts`
- [ ] Add regression tests ensuring service-layer membership checks are always executed before any target user read/update/delete.
  - Evidence: `packages/api/src/services/users.service.ts`
- [ ] Add cross-tenant negative tests:
  - caller with wrong role gets `403`
  - caller with correct role but different company gets `403/404` (avoid existence leaks)
  - caller without company context gets `401`

## Definition of done

- CI includes tests that would fail if route guards or service-layer invariants regress.
- Error codes are consistent and do not leak resource existence across companies.

