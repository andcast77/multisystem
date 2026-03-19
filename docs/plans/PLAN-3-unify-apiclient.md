# Plan 3 — Unify ApiClient

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §6 Frontend, §9 duplicate client.

| Field | Detail |
|-------|--------|
| **Objective** | One HTTP client pattern from `@multisystem/shared`. |
| **Risk addressed** | Duplicate `ApiClient` in shopflow/workify; drift vs `@multisystem/contracts`. |
| **Parallel with** | Plan 4 (different touchpoints). |

## Tasks

- [x] Inventory app-local `ApiClient` (shopflow, workify, others).
- [x] Shopflow `X-Store-Id` handled via a thin per-app wrapper (no change required in `@multisystem/shared`).
- [x] Migrate apps to shared client; delete duplicates.
- [ ] Optional: document **ideal** `api-sdk` / OpenAPI path (see audit §18).

## Definition of done

- No duplicate ApiClient classes across apps (migration completed for `shopflow`, `workify`, `techservices`, and `hub`).
- Module-specific headers live in shared or documented thin wrappers only (Shopflow `X-Store-Id` is injected in `apps/shopflow/src/lib/api/client.ts`).
