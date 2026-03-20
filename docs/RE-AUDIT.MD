You are a senior software engineer working on a production monorepo.

Your task is to **implement critical architecture and security fixes** in an existing system.

---

# Project Context

* Monorepo using Turborepo
* Frontend: React (Vite + Next.js)
* Backend: Fastify (Node.js)
* ORM: Prisma
* Multi-tenant system (company-based isolation)

Architecture:

* Controllers → Services → Repositories → Prisma
* Auth via session cookie (`ms_session`)
* Context resolved via:

  * requireAuth
  * requireCompanyContext
  * requireShopflowContext

---

# 🚨 CRITICAL RULES

* DO NOT rewrite the entire system
* DO NOT break existing functionality
* DO incremental, safe refactors
* ALWAYS preserve current behavior unless fixing a bug or vulnerability
* If unsure, ask or leave TODO comments

---

# TASK 1 — Fix Authorization on `/api/users*`

## Problem
The original risk (“`/api/users*` uses `requireAuth` only”) is **no longer accurate** as a system-level finding.

During the 2026-03-19 re-audit, `/api/users*` routes apply **authentication + resolved company context + role gating**, and the service layer also enforces company membership for the target user.

If future changes remove/alter route guards, the remaining failure mode to watch is: “service assumes invariants that route guards no longer guarantee”.

## Requirements

1. Implement a role-based guard:

```ts
requireRole(['owner', 'admin'])
```

2. Apply it to all `/api/users*` routes

3. Ensure ALL queries are scoped by `companyId`

4. Prevent cross-tenant access explicitly

## Expected outcome

* Only authorized roles can manage users
* No user can access another company’s data

## Status (re-audit)
Resolved (RBAC + tenant scoping enforced in both routing and service-layer membership checks)

## Re-audit evidence (2026-03-19)
* `packages/api/src/controllers/users.controller.ts`: `usersGuard = [requireAuth, requireCompanyContext, requireRole(['owner', 'admin'])]` is applied to all `/api/users*` routes.
* `packages/api/src/services/users.service.ts`: `ensureUserInCompanyOrThrow()` checks `prisma.companyMember` for the target `userId` and the resolved `companyId` before any cross-user read/update/delete.

---

# TASK 2 — Enforce Multi-Tenant Isolation (Shopflow)

## Problem

Some service methods allow weak or missing tenant scoping.

## Requirements

1. All Prisma queries MUST include:

```ts
where: { companyId: ctx.companyId }
```

2. Remove or refactor any logic using:

* `companyId: null`
* global/shared configs without tenant isolation

3. Audit:

* products
* sales
* customers
* configs
* reports

## Expected outcome

* Strict tenant isolation across all Shopflow features

---
## Status (re-audit)
Active (tenant-scope gaps still present in Shopflow domain services)

## Re-audit evidence (2026-03-19)
* `packages/api/src/services/shopflow.service.ts`:
  * `updateLoyaltyConfig()` writes `loyaltyConfig` with `companyId: null as unknown as string` and then deactivates other active rows via `updateMany` without tenant scoping.
  * `getCustomerPoints()` loads the customer via `prisma.customer.findUnique({ where: { id: customerId } })` without a `companyId` constraint, while loyalty points are later scoped by `companyId`.

---

# TASK 3 — Introduce Repository Layer (Incremental)

## Problem

Services directly use Prisma, breaking architecture boundaries.

## Requirements

1. Create repositories (if missing), e.g.:

* user.repository.ts
* shopflow.repository.ts

2. Move Prisma queries into repositories

3. Refactor services to use repositories instead of Prisma

## Priority

* users domain
* shopflow sales/config

## Expected outcome

* Clear separation: service (business) vs repository (data access)

---
## Status (re-audit)
Partially implemented (repository layer exists; service-to-repository migration is incomplete)

## Re-audit evidence (2026-03-19)
* `packages/api/src/services/users.service.ts`: imports `prisma` directly and performs persistence operations without going through repository abstractions.
* `packages/api/src/services/shopflow.service.ts`: imports `prisma` directly across multiple bounded contexts.
* Repositories exist under `packages/api/src/repositories/*`, but the service layer still frequently bypasses them.

---

# TASK 4 — Centralize Authorization Policies

## Problem

Authorization logic is duplicated across services.

## Requirements

Create reusable policy helpers:

```ts
canManageUsers(user, company)
canAccessStore(user, store)
```

Use them across services instead of inline checks.

## Expected outcome

* Single source of truth for authorization rules

---
## Status (re-audit)
Partially implemented (policy primitives exist; domain-level checks still repeat)

## Re-audit evidence (2026-03-19)
* Request-level guards:
  * `packages/api/src/core/auth-context.ts` defines `requireRole()` and depends on resolved `request.companyId` + `request.membershipRole`.
* Domain/service-level duplication:
  * `packages/api/src/services/users.service.ts` embeds authorization rules via `assertCompanyAccess()` / `ensureUserInCompanyOrThrow()`.
  * `packages/api/src/services/shopflow.service.ts` contains additional authorization helpers such as `canAccessUserPreferences()` that re-check access.

---

# TASK 5 — Standardize Frontend API Usage

## Problem

Some apps use direct fetch or duplicate API wrappers.

## Requirements

1. All API calls must go through `@multisystem/shared` ApiClient
2. Remove duplicate wrappers
3. Replace direct fetch usage

## Optional

Add lint rule to prevent direct fetch usage

---
## Status (re-audit)
Active (partial adoption + direct `fetch()` bypasses shared conventions)

## Re-audit evidence (2026-03-19)
* `apps/shopflow/src/lib/services/printing.ts`: uses direct `fetch()` for network printing (local API URL/header construction).
* `apps/shopflow/src/lib/utils/export/excel.ts`: uses direct `fetch()` for Excel export.
* `apps/shopflow/src/hooks/useTicketConfig.ts`: uses direct `fetch()` for ticket config reads/writes.
* `apps/workify/src/components/features/employees/EmployeeImportModal.tsx`: uploads import files via direct `fetch()`.

---

# TASK 6 — Normalize Environment Variables

## Problem

Mixed env conventions across apps.

## Requirements

* Vite apps → use `VITE_*`
* Next apps → use `NEXT_PUBLIC_*`
* Remove mixed usage

Ensure all apps use consistent API base URL configuration.

---
## Status (re-audit)
Active (env contract drift still present)

## Re-audit evidence (2026-03-19)
* `packages/api/src/plugins/core/env.plugin.ts` validates `CORS_ORIGIN` (singular).
* `apps/hub/.env.example` now uses normalized keys (`CORS_ORIGIN` where documented at API layer and Vite-oriented `VITE_*` for frontend routing/API base URL).

---
## Full System Re-Audit Findings (2026-03-19)

### Cross-App Consistency

The system has a shared HTTP transport primitive for browser apps: `@multisystem/shared` exports `ApiClient`, which always sends `credentials: 'include'` and expects the API to set CORS correctly for credentialed requests.

Evidence:
* `packages/shared/src/api-client.ts`: `fetch(..., { credentials: 'include', ... })` and a consistent JSON error parsing path.
* `packages/api/src/plugins/core/cors.plugin.ts`: `credentials: true` with configured origins.
* `packages/api/src/server.ts`: registers the shared domain plugins (auth, users, tenant, shopflow, workify, techservices) in one Fastify instance.

However, code paths still diverge per app/feature, which makes end-to-end consistency dependent on developers remembering which wrapper to use and how to attach required headers (especially for credentialed requests and module/store scoping).

### Architecture Integrity

The backend request lifecycle largely matches the intended layering:
* controllers validate/shape input and delegate to services
* preHandlers resolve auth + tenant context
* services orchestrate persistence operations

Evidence:
* `packages/api/src/core/auth.ts`: `requireAuth()` attaches `request.user` after JWT verification from either `Authorization: Bearer ...` or the session cookie.
* `packages/api/src/core/auth-context.ts`: `requireCompanyContext()` resolves `request.companyId` + `request.membershipRole`; `requireShopflowContext()` further validates `X-Store-Id` against `prisma.store` and `prisma.userStore`.
* `packages/api/src/plugins/core/versioning.plugin.ts` and `packages/api/src/common/versioned-routes.ts`: route version normalization.

System-level coupling risk remains: because `packages/api/src/server.ts` registers all domain plugins in a single runtime process, release cadence and blast radius remain coupled across otherwise independent business modules.

### Clean Architecture Compliance

The repository layer exists, but enforcement of “services must call repositories, not Prisma” is inconsistent across the system.

Evidence:
* `packages/api/src/repositories/*`: repository modules exist (example: `packages/api/src/repositories/product.repository.ts`, `store.repository.ts`, etc.).
* `packages/api/src/services/users.service.ts` and `packages/api/src/services/shopflow.service.ts`: both import and use `prisma` directly, bypassing repository abstractions.

In addition, some service methods return data structures that are shaped around transport conventions (`success/data` envelope patterns or HTTP-ish error paths), which increases coupling between domain code and HTTP response conventions.

### SOLID Principles (Global)

SRP pressure is visible in oversized domain services, especially in Shopflow where a single service file orchestrates multiple bounded contexts (products/stores/inventory/loyalty/reports/notifications/inventory transfers).

Evidence:
* `packages/api/src/services/shopflow.service.ts`: large multi-context orchestration with direct `prisma` usage.

DIP is also affected because many domain services depend on the concrete Prisma client instead of depending on repository interfaces.

OCP pressure appears where authorization/tenant checks are repeated across services and helpers instead of being expressed as reusable policy primitives with a single canonical enforcement strategy.

Evidence:
* `packages/api/src/core/auth-context.ts`: central guard factories exist (`requireRole`, `requireCompanyContext`, `requireShopflowContext`).
* `packages/api/src/services/shopflow.service.ts`: additional helpers re-check access (example: `canAccessUserPreferences()` pattern).

### Developer Experience (DX)

DX is impacted by:
1. Multiple frontend wrapper patterns (shared `ApiClient`, app-local API modules, and direct `fetch()` usage in some features).
2. Multiple auth/session expectations across apps (some relying on cookie-credentialed requests, others expecting extra request headers).
3. Env/config drift risk across apps, where names and base URL responsibilities are not fully unified.

This makes onboarding harder because a developer must learn “the correct convention” per app and per feature to avoid subtle runtime failures.

### Observability

Baseline observability exists (Fastify logging + global error mapping), but there is no first-class production telemetry pipeline for request correlation, metrics, and tracing.

Evidence:
* `packages/api/src/common/errors/error-handler.ts`: unexpected errors log via `request.log.error(error)`; response includes `success: false` and a controlled error message but no correlation id is injected.
* `packages/api/src/server.ts`: `const fastify = Fastify({ logger: true })` with no request-id generation/tracing instrumentation found in the runtime.
* `packages/api/src/plugins/health/health.plugin.ts` + `packages/api/src/controllers/health.controller.ts`: `/health` returns `{ status: 'ok' }` with no dependency readiness checks (DB/Redis).

### Systemic Risks

Systemic risks that become significant at scale:
1. Deploy coupling: single API runtime process registers all domain plugins, tying independent modules to the same release/rollback blast radius.
2. Shared bottlenecks: one DB schema and one API service drive all modules, so schema/API changes require broad coordination.
3. Documentation/config drift risk: frontend apps and API runtime both rely on environment variables for CORS and base URL behavior; mismatched names can produce “it works in dev, fails in staging” behavior.

---
## Cross-System Issues (prioritized)

| Priority | Severity | Issue | Affected areas | System impact | Recommended fix path |
|---|---|---|---|---|---|
| 1 | Critical | Shopflow tenant-scope gaps (loyalty/customer/points/global config paths) | `packages/api` Shopflow services | Potential cross-company data exposure and cross-tenant config mutation | Enforce `companyId` scoping invariants in all relevant reads/writes; add regression tests |
| 2 | High | Repository boundary drift (services bypass repository layer) | `packages/api` services (users/shopflow) | Weaker clean-architecture compliance and duplicated enforcement logic | Incrementally migrate high-risk service persistence to repositories |
| 3 | High | Policy duplication drift (authz checks repeated at service level) | `packages/api` services | Authorization inconsistencies over time as rules evolve | Centralize policy primitives and adopt them across services |
| 4 | Medium | Observability baseline missing correlation/metrics/tracing | `packages/api` runtime | Slower incident triage; harder root-cause analysis under load | Add request-id/correlation, metrics endpoint, and tracing hooks |
| 5 | Medium | Frontend wrapper/auth convention inconsistency (app-local + shared + bypasses) | `apps/*` | Increased support overhead and feature regressions | Enforce convention via lint/testing and move remaining bypasses into shared clients |
| 6 | Medium | Monolithic API deploy coupling | CI/CD + `packages/api/src/server.ts` | Release/rollback tied across domains | Introduce domain ownership boundaries and consider deploy splitting later |

---
### Newly Observed System-Level Findings (2026-03-19)

1. Workify auth helper depends on `x-user-*` request headers that are not established by the Workify code alone.
Evidence: `apps/workify/src/lib/auth.ts` reads `x-user-id`, `x-user-email`, and `x-company-id` via `next/headers` in `getCurrentUser()`.

2. Shopflow has feature-level direct `fetch()` bypasses that fragment API behavior across request envelope/error parsing and base URL usage.
Evidence:
* `apps/shopflow/src/lib/services/printing.ts`: direct `fetch()` to `/api/shopflow/printers/network-print` after constructing an API URL and headers locally.
* `apps/shopflow/src/lib/utils/export/excel.ts`: direct `fetch('/api/export/excel', ...)` (relative path) which behaves differently than shared `ApiClient` usage and can diverge under routing/proxy changes.

3. Environment variable naming contract drift increases misconfiguration risk.
Evidence:
* `packages/api/src/plugins/core/env.plugin.ts`: validates `CORS_ORIGIN`.
* `apps/hub/.env.example`: contract normalized for Vite usage.

## Update Technical Debt

### Critical
* Shopflow tenant-scope isolation defects remain active: `updateLoyaltyConfig()` writes a null/global `companyId` path and `getCustomerPoints()` loads `customer` without a `companyId` constraint.
Evidence: `packages/api/src/services/shopflow.service.ts`.

### High
* Repository boundary drift: core services still call Prisma directly instead of flowing persistence through repository abstractions.
Evidence: `packages/api/src/services/users.service.ts`, `packages/api/src/services/shopflow.service.ts`, and repository modules under `packages/api/src/repositories/*`.
* Authorization policy drift risk: domain services repeat authorization rules even though request-level guards exist, increasing future inconsistency risk.
Evidence: `packages/api/src/core/auth-context.ts` plus service-level checks in `packages/api/src/services/users.service.ts` and `packages/api/src/services/shopflow.service.ts`.

### Medium
* Frontend wrapper/auth convention inconsistency increases feature regression risk.
Evidence: `apps/shopflow/src/lib/services/printing.ts`, `apps/shopflow/src/lib/utils/export/excel.ts`, `apps/workify/src/lib/auth.ts`, and app-local API client files.
* Observability baseline is insufficient for production triage (no request correlation injection, no metrics/tracing hooks; `/health` is liveness-only).
Evidence: `packages/api/src/common/errors/error-handler.ts`, `packages/api/src/server.ts`, and `packages/api/src/controllers/health.controller.ts`.
* Env contract drift (variable naming and base URL responsibilities) can cause “works in dev, breaks in staging”.
Evidence: `packages/api/src/plugins/core/env.plugin.ts` and `apps/hub/.env.example`.

## Update Scores (0–10)

| Dimension | Score | Delta | Re-audit delta rationale (evidence-based) |
|---|---:|---:|---|
| Architecture | 7.9 | +0.1 | `users` route protection is now confirmed via `usersGuard = [requireAuth, requireCompanyContext, requireRole(['owner','admin'])]` and service membership enforcement exists. Architecture boundaries still cap the score due to service/repository drift. |
| Code Quality | 7.1 | -0.1 | Frontend conventions remain fragmented by direct `fetch()` bypasses and app-local wrapper differences, increasing maintenance load per feature. |
| Security | 7.6 | +0.3 | The previously stated “users management is auth-only” risk is reclassified as resolved at the routing layer; however, Shopflow tenant-scope defects remain active. |
| Performance | 7.1 | 0.0 | No confirmed new systemic performance bottlenecks from this re-audit; earlier pagination/cache considerations still dominate risk. |
| Scalability | 7.1 | 0.0 | Stateless API + shared DB/Redis design remains similar; monolithic deploy coupling remains the primary scaling-risk driver rather than algorithmic performance. |
| Maintainability | 7.1 | -0.3 | DX friction increases due to inconsistent auth/session expectations and env naming drift across apps (Workify header dependency + env contract drift). |

## Update Refactor Plan

This refactor plan is prioritized for long-term maintainability and production safety.

Immediate (highest-risk containment)
1. Fix Shopflow tenant-scope defects by enforcing `companyId` scoping invariants in all loyalty/customer/points/config paths, and remove any null/global `companyId` fallback patterns.
2. Add regression tests that attempt cross-tenant access patterns for Shopflow loyalty points/config reads/writes and customer lookups.

Near-term (architecture consistency)
3. Migrate the highest-risk service paths (users + Shopflow sales/config/report primitives) behind repository abstractions so persistence access becomes centralized and auditable.
4. Centralize policy enforcement by adopting reusable policy helpers across services and removing duplicated re-checks where request-level guards already establish invariants.

Consistency + DX (reduce future drift)
5. Eliminate/contain frontend direct `fetch()` bypasses by requiring feature requests to go through the shared `ApiClient`/prefixed clients, and add lint/testing enforcement.
6. Normalize env contracts across apps and API runtime (variable naming and base URL responsibilities), and ensure docs match runtime behavior.

Production hardening (observability + readiness)
7. Add production observability baseline: request correlation id injection, structured logs per request, a metrics export path, and tracing hooks; extend `/health` to include dependency readiness checks (DB/Redis).

Platform consideration
8. Consider domain deploy splitting later to reduce release/rollback blast radius, while keeping plugin boundaries intact.

# IMPLEMENTATION STRATEGY

For each task:

1. Locate affected files
2. Explain briefly what you will change
3. Apply changes incrementally
4. Show diff or updated code
5. Move to next task

---

# OUTPUT FORMAT

For each task:

* Summary of changes
* Files modified
* Code snippets (before/after if needed)

---

# FINAL GOAL

* Secure multi-tenant system
* Consistent architecture
* Reduced duplication
* Production-ready codebase

---

Start with TASK 1.
