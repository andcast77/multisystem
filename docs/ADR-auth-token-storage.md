# ADR: Auth token storage (Plan 1)

## Decision

We use an **httpOnly, Secure session cookie** (`ms_session`) set **only by the API** on login, register, and company context switch. The JWT is **not** exposed to JavaScript via `document.cookie` and is **not** returned in JSON for those flows (except where backward compatibility requires Bearer for automation).

## Rationale

- **XSS**: Non-httpOnly cookies allow any script on the page to steal the session. HttpOnly cookies are not readable from JS.
- **Cross-origin SPAs** (hub, shopflow, workify, techservices on different ports/origins than the API): The session cookie is scoped to the **API host**. Browsers send it on `fetch(API_URL, { credentials: 'include' })`.
- **SameSite / Secure**: Cross-site credentialed requests require `SameSite=None` and `Secure`. Local development uses `localhost`; modern browsers allow `Secure` cookies over `http://localhost`.

## Alternatives considered

| Approach | Why not chosen |
|----------|----------------|
| **BFF (same-origin cookie per app)** | Strong for Next middleware; higher operational cost (proxy per app). |
| **Short access JWT in memory + httpOnly refresh** | More moving parts; refresh rotation and storage still needed. |
| **Readable `token` cookie** | Previous model; rejected for XSS risk. |

## Implications

- **Next.js middleware** on app origins cannot read the API session cookie. Route protection uses **client-side checks** (e.g. `GET /api/auth/me` with `credentials: 'include'`) or future BFF.
- **`Authorization: Bearer`** remains supported for API clients, tests, and scripts.
- **Logout** clears `ms_session` via `Set-Cookie` from the API.

## References

- [\[completed\] PLAN-1-security-auth-hardening.md](plans/[completed]%20PLAN-1-security-auth-hardening.md)
- [packages/api/README.md](../packages/api/README.md) — env and CORS
