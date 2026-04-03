# PLAN-18 - RBAC Unificado (Roles Granulares por Módulo)

## Objetivo
Hacer cumplir el claim "Roles granulares y permisos precisos por módulo": los tres niveles de control ya existen en el schema pero ninguno está completamente aplicado en las rutas de la API.

## Estado actual del schema
El schema tiene las tablas necesarias y están bien modeladas:

- **Nivel 1 — Membresía**: `CompanyMember.membershipRole` (`OWNER / ADMIN / USER`) — este nivel sí se aplica en rutas.
- **Nivel 2 — Módulo por usuario**: `CompanyMemberModule` (`enabled: Boolean`) — `memberHasModule()` existe en `packages/api/src/core/modules.ts` (línea 170) pero **nunca se llama** en rutas; `requireModuleAccess` solo verifica a nivel empresa.
- **Nivel 3 — Permisos finos**: `Role`, `Permission`, `RolePermission`, `UserPermission`, `UserRoleAssignment` — tablas vacías, sin seed, sin enforcement en API.

## Arquitectura objetivo

```
Request HTTP
    │
    ▼
Nivel 1: requireAuth + MembershipRole check (OWNER/ADMIN/USER)
    │
    ▼
Nivel 2: memberHasModule (¿el usuario puede acceder al módulo?)
    │
    ▼
Nivel 3: requirePermission (¿tiene permiso específico para esta acción?)
    │
    ▼
Route Handler
```

## Fases

### Fase 1 — Activar Nivel 2: módulo por usuario en rutas
- Extender `requireModuleAccess` para que, cuando exista un `companyMemberId` en el contexto, llame a `memberHasModule()` en vez de solo `getCompanyModules()`.
- Archivo clave: `packages/api/src/core/modules.ts` — función `requireModuleAccess` línea 137.
- Sin cambios de schema ni migración necesaria (tabla ya existe).

### Fase 2 — Definir catálogo de permisos (seed)
- Definir el catálogo canónico de `Permission` por módulo: `shopflow:sales:read`, `shopflow:sales:create`, `shopflow:inventory:write`, `workify:employees:manage`, `techservices:visits:close`, etc.
- Crear seed de permissions y roles base (`Gerente`, `Cajero`, `Supervisor`) con sus `RolePermission`.
- Archivo: `packages/database/prisma/seed.ts`

### Fase 3 — Enforcement de Nivel 3 en API
- Crear middleware `requirePermission(resource, action)` que consulte `UserPermission` y `UserRoleAssignment → RolePermission` del usuario.
- Aplicar en rutas de alto impacto: mutaciones de ventas, movimientos de inventario, gestión de usuarios, cambios de config.
- Archivo nuevo: `packages/api/src/core/permissions.ts`

### Fase 4 — UI de administración en Hub
- Pantalla `/company/members/:memberId/permissions` (solo `OWNER` y `ADMIN`):
  - Toggle de módulos habilitados por usuario (Nivel 2).
  - Asignación de roles predefinidos (Nivel 3).
  - Override de permisos individuales (avanzado).
- Endpoints API necesarios: `GET/PUT /company/members/:id/modules`, `GET/PUT /company/members/:id/roles`.

### Fase 5 — Hardening y tests de regresión
- Tests de cross-tenant: que user de empresa A no pueda acceder a recursos de empresa B mediante manipulación de roles.
- Tests de escalada de privilegios: que USER no pueda asignarse a sí mismo OWNER.
- Validar que `requirePermission` falle cerrado (deny by default) si no hay permisos definidos.

## Exit criteria
- [x] `memberHasModule()` se llama en todas las rutas protegidas por módulo.
- [x] Catálogo de permisos seedeado y documentado.
- [x] Al menos ventas e inventario de Shopflow están protegidos por Nivel 3.
- [x] UI en Hub permite al Owner gestionar módulos y roles de cada miembro.
- [x] Sin regresiones en multi-tenant (companyId siempre scoped).
