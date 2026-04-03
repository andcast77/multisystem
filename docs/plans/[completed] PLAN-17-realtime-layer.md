# PLAN-17 - Capa Real-time (SSE + WebSocket)

## Objetivo
Cumplir el claim "Datos en tiempo real" y "Colaboración total": métricas de dashboard que se actualizan sin polling manual, y eventos de presencia/sincronización entre usuarios del mismo tenant.

## Estado actual
- Dashboards usan React Query con `staleTime: 2-5 min` — no hay streaming.
- No hay Socket.IO, EventSource ni SSE en el API.
- El paquete `ws` ya está instalado en `packages/api` (no se usa aún para colaboración).
- Archivos clave: `apps/hub/src/hooks/useCompanyStats.ts`, `apps/shopflow/src/hooks/useReports.ts`, `packages/api/src/server.ts`

## Decisión de arquitectura
- **Fase 1 → SSE** (server-sent events): unidireccional servidor→cliente, suficiente para push de métricas. Fastify soporta SSE nativo con `reply.raw`.
- **Fase 2 → WebSocket** (`@fastify/websocket`): bidireccional, para presencia y eventos colaborativos entre usuarios del mismo tenant.

## Fases

### Fase 1 — SSE para dashboards (scope: API + Shopflow/Hub)
- Agregar endpoint SSE en API: `GET /events/metrics/:companyId` con autenticación JWT y scope de tenant.
- Emitir eventos cuando cambien métricas críticas: nueva venta, cambio de stock, nueva visita técnica.
- Reemplazar `staleTime` fijo en hooks de React Query por suscripción SSE con invalidación selectiva de queries.
- Guardrail: SSE solo emite datos del tenant del usuario autenticado (aislación multi-tenant).

### Fase 2 — WebSocket para colaboración (scope: API + Hub)
- Agregar plugin `@fastify/websocket` al servidor Fastify (se complementa con `ws` ya instalado).
- Definir salas de tenant: cada compañía tiene su propio canal de eventos.
- Eventos iniciales: `user:joined`, `user:left`, `document:updated` (ej. configuración de ticket, inventario editado).
- Frontend Hub: indicador de presencia en DashboardPage (quién está conectado ahora).

### Fase 3 — Hardening y graceful degradation
- Fallback a polling con intervalo largo si SSE/WS no está disponible (compatibilidad).
- Rate limiting en endpoints SSE/WS por tenant.
- Pruebas de reconexión y manejo de desconexiones.

## Exit criteria
- [x] Dashboards Hub y Shopflow reflejan cambios sin necesidad de recargar la página.
- [x] Al menos un evento de presencia visible en UI cuando dos usuarios del mismo tenant están activos.
- [x] Sin cross-tenant data leak en eventos SSE/WS (verificado con tests de aislamiento).
