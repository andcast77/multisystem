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

Currently endpoints only use `requireAuth`, which allows any authenticated user to access management operations.

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

# TASK 6 — Normalize Environment Variables

## Problem

Mixed env conventions across apps.

## Requirements

* Vite apps → use `VITE_*`
* Next apps → use `NEXT_PUBLIC_*`
* Remove mixed usage

Ensure all apps use consistent API base URL configuration.

---

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
