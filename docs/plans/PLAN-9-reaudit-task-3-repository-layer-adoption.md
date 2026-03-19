# Plan 9 — Re-audit Task 3: Repository Layer Adoption

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 3`

| Field | Detail |
|---|---|
| **Objective** | Reduce service/repository boundary drift by migrating remaining Prisma usage behind repositories. |
| **Current re-audit status** | Partially implemented (repository layer exists; bypasses remain). |
| **Risk if it persists** | Harder testing, duplicated enforcement logic, and architecture erosion. |

## Tasks

- [] Inventory Prisma usage in high-risk services and identify the exact query paths to migrate.
  - Evidence: `packages/api/src/services/users.service.ts`, `packages/api/src/services/shopflow.service.ts`
- [] Add/extend repository functions for those query paths.
  - Evidence: `packages/api/src/repositories/*`
- [] Refactor services to call repository methods instead of direct `prisma.*` for those paths.
- [] Add tests that validate tenant scoping and authorization invariants through repository methods.

## Scope for this phase (minimal high-risk)

- [] `users.service.ts`: migrate authorization-sensitive persistence paths behind repositories.
- [] `shopflow.service.ts`: migrate loyalty and user-preference access-check paths behind repositories.
- [] Deferred follow-up: migrate remaining direct `prisma.*` usage in non-targeted shopflow flows (store config, ticket config, inventory transfers, push subscriptions, and other persistence paths).

## Definition of done

- Critical tenant/authorization-related persistence no longer bypasses repositories.
- Repository methods are unit-testable and enforce/assume tenant scoping consistently.

