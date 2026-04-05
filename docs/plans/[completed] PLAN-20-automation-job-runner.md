# PLAN-20 - Automatización: Job Runner

## Objetivo
Cumplir el claim "Automatiza procesos repetitivos": procesos que hoy son manuales o inexistentes se ejecutan automáticamente en base a horario o eventos de negocio.

## Estado actual y decisión de stack

El API usa **Upstash Redis** (`@upstash/redis`) en modo serverless. Esto descarta BullMQ porque requiere comandos Redis bloqueantes (`BLPOP`) incompatibles con Upstash.

El patrón de jobs existente para exports (`shopflow-export-jobs.service.ts`) usa Redis solo para **estado del job** (queued/processing/ready/error), no como scheduler. Es sólido y reutilizable.

**Decisión de stack:**
- **`node-cron`**: scheduling de jobs recurrentes — mínimo, sin dependencias de infra adicionales.
- **Redis (Upstash existente)**: estado y resultados de jobs (reutilizar patrón de exports).
- **Push notifications (existente)**: canal de entrega de alertas ya implementado en Shopflow.

> Si en el futuro se requiere retry automático con backoff, migrar a `pg-boss` (Postgres-based, compatible con Neon existente) sin cambiar de infra.

## Jobs a implementar

| Job | Trigger | Destinatario |
|-----|---------|--------------|
| Alerta de stock bajo | Evento: stock cae bajo mínimo + cron diario de verificación | Owner/Admin de empresa |
| Reporte periódico | Cron: diario 23:59 / semanal lunes 8:00 | Owner/Admin (push + descarga) |
| Recordatorio de facturas | Cron: diario, facturas con vencimiento en 3 días o vencidas | Owner/Admin |
| Backup automático | Cron: diario 2:00 AM | Sistema (silent) |
| Recordatorio TechServices | Cron: cada mañana 8:00, visitas del día / pendientes sin cerrar | Técnico asignado |

## Fases

### Fase 1 — Infraestructura del job runner
- Instalar `node-cron` en `packages/api`.
- Crear `packages/api/src/jobs/runner.ts`: inicialización de `node-cron` y registro de jobs.
- Crear `packages/api/src/jobs/job-state.ts`: helpers de estado sobre Redis (reutilizar patrón de `shopflow-export-jobs.service.ts`).
- Integrar el runner en `packages/api/src/server.ts` — arrancar al iniciar el servidor, shutdown limpio en `onClose`.

### Fase 2 — Job: Alertas de stock bajo
- **Trigger dual**: inline check al guardar movimiento de inventario + cron diario como red de seguridad.
- Consultar productos donde `currentStock <= minimumStock` por empresa.
- Emitir push notification + registrar en `IntegrationLog`.
- Archivo: `packages/api/src/jobs/inventory-alert.job.ts`

### Fase 3 — Job: Reportes periódicos
- Reutilizar lógica de `shopflow-export-jobs.service.ts` para generar el payload.
- Guardar resultado en Redis con TTL extendido (24h).
- Notificar al Owner/Admin vía push que el reporte está disponible para descarga.
- Archivo: `packages/api/src/jobs/scheduled-report.job.ts`

### Fase 4 — Job: Recordatorios de facturas
- Consultar facturas con `dueDate` en los próximos 3 días o ya vencidas.
- Agrupar por empresa para emitir **una sola notificación consolidada** por tenant (no spam por factura individual).
- Idempotencia: marcar notificación enviada para no repetir el mismo día.
- Archivo: `packages/api/src/jobs/invoice-reminder.job.ts`

### Fase 5 — Job: Backup automático
- Extender el flujo de backup manual ya existente en Shopflow para invocarlo desde el runner.
- Guardar metadata del backup (timestamp, tamaño, resultado) en Redis.
- Registrar en `IntegrationLog` con `integration: 'backup'`.
- Archivo: `packages/api/src/jobs/backup.job.ts`

### Fase 6 — Job: Recordatorios TechServices
- Consultar visitas técnicas del día con estado `SCHEDULED` o `IN_PROGRESS`.
- Consultar visitas con estado `PENDING_CLOSE` de más de 48h sin actualizar.
- Notificar al técnico asignado (`assignedUserId`) vía push.
- Archivo: `packages/api/src/jobs/techservices-reminder.job.ts`

### Fase 7 — Panel de historial de jobs en Hub (opcional)
- Endpoint `GET /company/jobs/history` para ver los últimos N jobs ejecutados por empresa.
- UI en Hub: tabla de ejecuciones con estado, hora y resultado.

## Estructura de archivos
```
packages/api/src/jobs/
  runner.ts                      ← cron scheduler y registro
  job-state.ts                   ← helpers Redis para estado
  inventory-alert.job.ts
  scheduled-report.job.ts
  invoice-reminder.job.ts
  backup.job.ts
  techservices-reminder.job.ts
```

## Exit criteria
- [x] El runner arranca con el servidor y los crons se registran sin errores.
- [x] Alerta de stock se dispara cuando un producto baja del mínimo.
- [x] Reporte diario se genera y notifica a las 23:59 para empresas activas.
- [x] Recordatorio de facturas corre diario sin enviar duplicados (idempotencia por fecha).
- [x] Backup diario completa y deja registro en `IntegrationLog`.
- [x] TechServices notifica al técnico cada mañana sobre su agenda del día.
