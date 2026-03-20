---
name: multi-tenant-architecture
description: >-
  Enforces strict tenant isolation in DB queries, APIs, and business logic (filter
  by tenant scope, validate membership). Use when writing queries, company-scoped
  APIs, authz, schemas, or any code that could leak data across tenants.
---

# Multi-Tenant Architecture Skill

Prevents data leaks between tenants and enforces isolation.

## When to Use

- Writing database queries
- Creating APIs with user/company context
- Handling authentication or authorization
- Designing schemas for multi-tenant systems

## Instructions

- Must scope data by tenant in:
  - Database models (tenant column / composite keys)
  - Queries and filters (`WHERE` incluye el identificador de tenant)

- Must not read or mutate tenant-owned rows without that filter.

- Every request **MUST** assume a resolved tenant context (from JWT, session, or explicit param validado).
- Must not use null/global tenant fallback paths for tenant-owned data access.

- **Validate**:
  - The authenticated user belongs to that tenant
  - The resource belongs to that tenant (IDs no bastan sin comprobar pertenencia)

- Enforce isolation in **controllers, services, and repositories** (no confiar solo en una capa).
  - Mandatory at repository/query boundaries (tenant filters)
  - Mandatory at policy/authorization boundaries (membership/access checks)

- If a query is missing tenant filtering: **STOP** and fix it before continuing.

- Suggest **indexes** on tenant key + fields used together in `WHERE` (ej. `(tenantId, ...)`, según el esquema).

- **Never** allow cross-tenant access by ID guessing or omitted filters.
- High-risk services (`users`, `shopflow`) should include regression tests for cross-company and cross-store boundaries.

- If tenant boundaries or naming are unclear: **ask** before proceeding.

## Multisystem (este repo)

Aquí el “tenant” operativo es la **compañía**: usar **`companyId`** (y comprobaciones de membresía / `canAccessCompany`, contexto en JWT) en servicios y repositorios. Misma regla mental que `tenantId`, distinto nombre en el código.

## Source of truth

- Rule: `.cursor/rules/multi-tenant-architecture.mdc`
- Related: `.cursor/rules/auth-jwt-roles.mdc`
- Precedence/conflicts: `.cursor/rules/architecture-governance.mdc`
