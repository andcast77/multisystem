# PLAN-19 - Enterprise Audit Log

## Objetivo
Cumplir el claim de "Seguridad empresarial": toda acción crítica queda registrada con quién, cuándo, qué cambió y desde qué IP. El modelo `AuditLog` ya existe en el schema pero no se usa en ninguna ruta de la API.

## Estado actual
- `packages/database/prisma/schema.prisma` línea 803: modelo `AuditLog` completo con `companyId`, `userId`, `action`, `entityType`, `entityId`, `before`, `after`, `ipAddress`, `userAgent`.
- Grep de `auditLog` en `packages/api/src/` → **0 resultados**. La tabla existe pero no se escribe nunca.
- `ActionHistory` en Shopflow es un sistema paralelo y específico, no cubre el resto del sistema.

## Alcance de operaciones a registrar

| Categoría | Operaciones |
|-----------|-------------|
| Auth | login exitoso, login fallido, logout, cambio de contraseña, revocación de sesión |
| Usuarios/Miembros | crear/editar/eliminar usuario, cambio de rol, invitación a empresa |
| Shopflow Ventas | crear venta, cancelar venta, emitir devolución, eliminar transacción |
| Shopflow Inventario | ajuste de stock, transferencia, entrada/salida de productos |
| Configuración | cambio de TicketConfig, activar/desactivar módulo, cambio de permisos |

## Fases

### Fase 1 — AuditLog Service (backend)
- Crear `packages/api/src/services/audit-log.service.ts` con función `writeAuditLog({ companyId, userId, action, entityType, entityId, before, after, request })`.
- La escritura es **fire-and-forget** (no bloquear el request principal): usar `setImmediate` o `Promise` sin `await` en el path crítico.
- Extraer `ipAddress` y `userAgent` del `FastifyRequest` automáticamente.
- Convención de `action`: verbo en mayúsculas, ej. `SALE_CREATED`, `USER_ROLE_CHANGED`, `LOGIN_FAILED`.

### Fase 2 — Instrumentar rutas críticas
Orden de prioridad:

1. **Auth**: `auth.controller.ts` → login, logout, changePassword.
2. **Usuarios**: `users.controller.ts` → CRUD y cambios de rol.
3. **Shopflow ventas**: `sales.controller.ts` → create, cancel, refund.
4. **Shopflow inventario**: `inventory.controller.ts` → adjustStock, transfer.
5. **Configuración**: `settings.controller.ts`, módulos, permisos (PLAN-18).

Para `before`/`after` en mutaciones: capturar el estado antes del cambio con una query previa (solo para campos relevantes, no dumps completos).

### Fase 3 — API de consulta de audit trail
- Endpoint `GET /company/audit-logs` (solo `OWNER`/`ADMIN`):
  - Filtros: `entityType`, `action`, `userId`, `dateFrom`, `dateTo`.
  - Paginación estándar (`page`, `pageSize`).
  - Response incluye datos del usuario que realizó la acción (`userId → user.email, user.name`).

### Fase 4 — Panel de auditoría en Hub
- Ruta `/company/audit` en Hub (guard: solo `OWNER`/`ADMIN`).
- Tabla con columnas: fecha, usuario, acción, entidad, IP.
- Filtros rápidos por categoría y rango de fechas.
- Detalle expandible con diff `before`/`after` en JSON formateado.

### Fase 5 — Retención y performance
- Índice compuesto en `audit_logs`: `(companyId, createdAt DESC)` para consultas paginadas eficientes (ya existe `@@index([companyId])`; agregar índice compuesto).
- Política de retención: registros con más de 12 meses pueden archivarse (definir proceso, no implementar en este plan).

## Exit criteria
- [x] Cada operación listada en el alcance escribe una fila en `audit_logs`.
- [x] Panel de Hub muestra el historial paginado y filtrable.
- [x] La escritura de audit no agrega latencia perceptible al request principal (fire-and-forget).
- [x] Sin cross-tenant: un Admin solo ve logs de su propia empresa.
