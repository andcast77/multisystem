# Plan 3 — Unify ApiClient

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §6 Frontend, §9 duplicate client.

| Field | Detail |
|-------|--------|
| **Objective** | One HTTP client class/pattern from `@multisystem/shared`, with thin app wrappers only when needed. |
| **Risk addressed** | Duplicate app-local `ApiClient` implementations and drift in request/auth behavior vs shared contracts/runtime. |
| **Parallel with** | Plan 4 (different touchpoints). |

## Tasks

- [x] Inventory app-local `ApiClient` (shopflow, workify, others).
- [x] Shopflow `X-Store-Id` handled via a thin per-app wrapper (no change required in `@multisystem/shared`).
- [x] Migrate apps to shared client; delete duplicates.
- [x] Optional: document **ideal** `api-sdk` / OpenAPI path (see audit §18).

## Ideal api-sdk / OpenAPI path (optional follow-through)

- **Preferred end-state:** Introduce a single `@multisystem/api-sdk` package generated from OpenAPI (or assembled from `@multisystem/contracts` + shared fetch wrapper as an interim step).
- **Transport/auth constraints (must preserve current runtime):**
  - Cookie session model remains primary: API sets `ms_session`, and frontend requests use `credentials: 'include'`.
  - `Authorization: Bearer` remains supported for scripts/tests and compatibility scenarios.
- **Wrapper strategy:** Keep app-level wrappers thin and focused on module-specific concerns only (for example, Shopflow `X-Store-Id` header injection), while endpoint methods/types converge on the shared SDK surface.
- **Incremental rollout:** Start with auth + common company/member endpoints, then move module endpoints (`shopflow`, `workify`, `techservices`) without breaking existing wrappers.

## Definition of done

- No duplicate `ApiClient` classes across apps (single class in `packages/shared/src/api-client.ts`; apps consume shared client via wrappers).
- Module-specific headers live only in documented thin wrappers (Shopflow `X-Store-Id` is injected in `apps/shopflow/src/lib/api/client.ts`).
- App wrapper entrypoints are intentional and minimal; duplicate wrapper files should be tracked as cleanup, not a return to duplicate client classes.
