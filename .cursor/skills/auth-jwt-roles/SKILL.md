---
name: auth-jwt-roles
description: >-
  Guides JWT auth, password handling, RBAC, and multi-tenant access checks. Use
  when implementing login/register, protecting routes, JWT payloads, roles and
  permissions, or validating resource access in a tenant-scoped API.
---

# Auth JWT Roles Skill

Ensures secure authentication, authorization, and role-based access control in a multi-tenant system.

## When to Use

- Implementing login/register endpoints
- Protecting routes (middleware/guards / preHandlers)
- Working with JWT
- Handling user roles and permissions
- Validating access to resources

## Instructions

### Authentication

- Use JWT for authentication.
- Sign tokens with a strong secret from **environment variables** (never hardcode).
- Payload should include what authorization needs, typically:
  - stable **user id**
  - **tenant/company scope** when the session is bound to one org
  - **role(s)** or flags needed for RBAC

- Set **expiration**; refresh strategy if sessions are long-lived.

- **Never** put secrets, full PII, or passwords in the JWT.

### Authorization (RBAC)

- Implement role-based (and optionally permission-based) access control.

- Example domain roles (ajustar al módulo/producto): `admin`, `cobrador`, `cliente` — mapear siempre a comprobaciones explícitas en código.

- Enforce at:
  - **Policy/guard level** (preferred)
  - **Service level** for sensitive or cross-cutting operations

- Validate role (and tenant scope) **before** business logic.
- `/api/users*` management operations must enforce strong policy checks (not authentication-only).
- Pair role checks with company/tenant scope checks for read/write/delete operations.

### Multi-tenant security

- Must validate that the authenticated user may act in the target tenant (ej. membership + matching company/tenant id en token vs recurso).

- Never serve or mutate another tenant’s data by ID alone.
- Must not use null/global tenant fallback paths for tenant-owned resources.

- Combine **role checks** + **tenant/company checks**.

### Middleware / guards (patrón)

- Reusable pieces:
  - **Auth** → valida JWT, adjunta usuario al request
  - **Role** → comprueba rol/permiso
  - **Tenant** → asegura contexto de compañía/tenant coherente con el recurso

- Tras decodificar JWT, el contexto del usuario debe quedar disponible para handlers (ej. `request.user`).

### Password security

- Hash con **bcrypt** (o Argon2); nunca texto plano.

- Reglas mínimas de contraseña según producto.

### Error handling

- **401** → no autenticado o token inválido
- **403** → autenticado pero sin permiso

- No filtrar detalles internos (stack, mensajes de DB) al cliente.

### Best practices

- Centralizar lógica de auth (emisión/verificación de token, helpers de acceso).

- No duplicar la misma regla de autorización en muchos sitios sin abstraer.
- Priorizar módulos/policies de autorización para reducir drift entre servicios.

- Validar input (login/register) con esquema (ej. Zod).

### Critical rule

- Si falta autenticación o autorización en un flujo sensible: **STOP** y añadirla antes de seguir.

- Si el modelo de seguridad no está claro: **preguntar** antes de implementar.

## Source of truth

- Rule: `.cursor/rules/auth-jwt-roles.mdc`
- Related: `.cursor/rules/multi-tenant-architecture.mdc`
- Precedence/conflicts: `.cursor/rules/architecture-governance.mdc`

---

## Multisystem (este repo)

- **JWT**: `packages/api/src/core/auth.ts` — `TokenPayload`: `id`, `email`, `role`, opcional `companyId`, `isSuperuser`, `membershipRole`. Verificación con `verifyToken`; rutas protegidas con preHandler **`requireAuth`** (Fastify).
- **Tenant**: validar acceso a compañía con **`companyId`** en token/params y helpers tipo **`canAccessCompany`** / membresía; no usar solo `tenantId` como nombre salvo que el código ya lo exponga así.
- **Roles en DB**: `UserRole` (USER, ADMIN, SUPERADMIN) y **`MembershipRole`** por empresa (OWNER, ADMIN, USER); permisos granulares vía modelos Role/Permission donde aplique. Los roles `cobrador` / `cliente` solo si el módulo los define — alinear con schema y servicios existentes.
