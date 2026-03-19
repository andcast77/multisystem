# Plan 12 — Re-audit Task 6: Normalize Environment Variables

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 6`

| Field | Detail |
|---|---|
| **Objective** | Eliminate env naming/base URL contract drift between apps and API runtime. |
| **Current re-audit status** | Active (env contract drift still present). |
| **Risk if it persists** | Credentialed requests fail due to wrong API origin and/or mismatched CORS settings. |

## Tasks

- [ ] Unify env variable naming for CORS: `CORS_ORIGIN` vs `CORS_ORIGINS`.
  - Evidence: `packages/api/src/plugins/core/env.plugin.ts`, `apps/hub/env.example`
- [ ] Standardize base URL env responsibilities between Vite and Next:
  - Vite: prefer `VITE_*` for build-time API base URL.
  - Next: prefer `NEXT_PUBLIC_*` for browser runtime API base URL.
  - Evidence: `apps/hub/env.example`, `packages/api/.env.example`
- [ ] Ensure docs and templates match runtime defaults.
- [ ] Add an “env contract sanity” checklist for any new app:
  - update CORS origins
  - update base URL env name
  - update any module-specific header requirements

## Definition of done

- Env templates across apps and API runtime use the same naming conventions for CORS and API base URL.
- Allowed origins cover all deployed frontend origins that need `credentials: 'include'`.

