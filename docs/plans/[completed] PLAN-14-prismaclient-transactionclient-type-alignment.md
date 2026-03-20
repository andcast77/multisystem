# Plan 14 — PrismaClient/TransactionClient Type Alignment

**Incident ref:** Vercel build failure on `master` (commit `ac8908c`) with `TS2345` in `packages/api/src/repositories/index.ts`.

| Field | Detail |
|---|---|
| **Objective** | Eliminate repository typing mismatch between `PrismaClient` and transaction-scoped Prisma clients. |
| **Current status** | Implemented and validated locally. |
| **Risk if it persists** | CI/CD build failures in Vercel for `@multisystem/api`, blocking deployments. |

## Tasks

- [x] Confirm root cause in repository construction path.
  - Evidence targets: `packages/api/src/repositories/index.ts`, `packages/api/src/services/shopflow.service.ts`
- [x] Update shared repository base type to accept both full and transaction Prisma clients.
  - Evidence target: `packages/api/src/common/database/base-repository.ts`
- [x] Keep `UnitOfWork` contract strict (`PrismaClient`) where `$transaction` is required.
  - Evidence target: `packages/api/src/common/database/unit-of-work.ts`
- [x] Re-run API build to verify TypeScript errors are resolved.
  - Verification command: `pnpm run build:api`

## Applied change

- Updated `TenantScopedRepository` constructor type from:
  - `PrismaClient`
- To:
  - `PrismaClient | TransactionClient`
- Imported `TransactionClient` from `./unit-of-work.js` in:
  - `packages/api/src/common/database/base-repository.ts`

## Definition of done

- `createRepositories(tenantId, tx)` compiles when `tx` is interactive transaction client.
- `@multisystem/api` TypeScript build completes without `TS2345` Prisma client mismatch errors.
- No runtime behavior changes; type-only alignment.

