# Plan A — Security & auth hardening

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §11 (JWT cookie, rate limit), §14 High.

| Field | Detail |
|-------|--------|
| **Objective** | Remove XSS token theft path; tighten auth endpoint abuse surface. |
| **Risk addressed** | JWT in JS-readable cookie (High); shared global rate bucket on auth (Low). |
| **Dependencies** | May require BFF or same-site cookie domain decisions before httpOnly. |
| **Priority** | Run after Plan B or in parallel once CORS/dev flow is stable. |

## Tasks

- [x] Choose strategy: **httpOnly API session cookie** (`ms_session`) set only by the API (JWT not readable from JS). Decision documented in [ADR-auth-token-storage.md](../ADR-auth-token-storage.md).
- [x] Implement chosen strategy in API + `@multisystem/shared`: API sets the cookie and `requireAuth` accepts **cookie session or Bearer** during migration. Legacy client token cookie handling is deprecated/no-op in the shared client.
- [x] Add stricter / isolated rate limits for auth abuse:
  - Global `100/min` skips unauthenticated auth public endpoints.
  - Dedicated bucket `ms-auth-public`: `20/min` for `POST /api/auth/login`, `POST /api/auth/register`, and `POST /api/auth/verify`.
- [x] Ensure **JWT_SECRET** is never empty in deployed environments (production, staging, Vercel); in local dev we warn instead of silently weakening behavior.
- [x] **Swagger:** disable UI in production by default; can be re-enabled with `ENABLE_API_DOCS=true`.

## Implemented details (what changed)

Token/session storage:
- API now sets `ms_session` as **`HttpOnly; Secure`** with **`SameSite=None`** for cross-origin SPAs (configurable via `AUTH_SESSION_INSECURE=1` for local environments if needed).
- Cookie is set/cleared from:
  - `packages/api/src/core/session-cookie.ts`
  - `packages/api/src/controllers/auth.controller.ts`
  - `packages/api/src/core/auth.ts` (`requireAuth` reads Bearer or `ms_session` cookie)

Frontend/shared integration:
- `packages/shared/src/api-client.ts` sends `credentials: 'include'` and no longer reads `Authorization: Bearer` from a JS-readable `token` cookie.
- `packages/shared/src/auth.ts` keeps `clearTokenCookie` for the legacy readable cookie, but `setTokenCookie` is a no-op under the new model.

Rate limiting:
- Auth public endpoints are excluded from the global rate limiter and placed into a dedicated `ms-auth-public` bucket in `packages/api/src/server.ts`.

JWT_SECRET & Swagger policy:
- JWT secret enforcement and Swagger gating are implemented in `packages/api/src/server.ts`.
- API docs in `packages/api/README.md` and `packages/api/.env.example` reflect the new flags (`ENABLE_API_DOCS`, `AUTH_SESSION_INSECURE`).

## Definition of done

- No long-lived auth secret in `document.cookie` (unless explicitly accepted interim): achieved by moving the session to `HttpOnly` `ms_session`.
- Auth routes rate-limited independently of global bucket: achieved via global skip + dedicated `ms-auth-public`.
- Prod Swagger policy documented in README or runbook: achieved via `ENABLE_API_DOCS` + updated `packages/api/README.md`.
