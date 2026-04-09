# PLAN-30 — Migrar WebSocket a SSE (presencia)

**Estado:** completado.

**Despliegue:** la API sigue en **Vercel** (serverless); no confundir este plan con el despliegue en Railway — ver [`[cancelled] PLAN-30-api-railway.md`](./%5Bcancelled%5D%20PLAN-30-api-railway.md).

## Nomenclatura

| Qué | Nombre |
|-----|--------|
| Este plan (transporte realtime) | **PLAN-30 — WS → SSE** · [`[completed] PLAN-30-ws-to-sse.md`](./%5Bcompleted%5D%20PLAN-30-ws-to-sse.md) |
| Plan histórico PaaS Railway | Solo en `[cancelled] PLAN-30-api-railway.md` |
| Rama git | `plan/plan-30-ws-to-sse-run-<YYYYMMDD-HHmmss>` desde `Test` |

## Objetivo

Eliminar **todo** uso de **WebSocket** en producto (API Fastify + Hub) y sustituirlo por **Server-Sent Events**, alineado con [`packages/api/src/services/sse.service.ts`](../../packages/api/src/services/sse.service.ts) y [`events.controller.ts`](../../packages/api/src/controllers/v1/events.controller.ts).

En el monorepo actual el único flujo WS era **presencia** (`/v1/ws/presence`).

## Fuera de alcance

- [`packages/database/prisma/seed.ts`](../../packages/database/prisma/seed.ts): la mención a “websocket” es el **driver Neon/Postgres**, no el realtime HTTP de la app.

## Inventario

| Área | Ubicación | Acción |
|------|-----------|--------|
| Ruta WS | *(eliminado)* `ws.controller.ts` | Sustituido por SSE en `events.controller.ts` |
| Estado | [`presence.service.ts`](../../packages/api/src/services/presence.service.ts) | Sin `WebSocket`; broadcast vía SSE |
| Plugin | *(eliminado)* `websocket.plugin.ts`; [`server.ts`](../../packages/api/src/server.ts) | Sin registro WS |
| Deps | [`packages/api/package.json`](../../packages/api/package.json) | Sin `@fastify/websocket` |
| Hub | [`usePresence.ts`](../../apps/hub/src/hooks/usePresence.ts) | `EventSource` |
| URLs | [`api-origin.ts`](../../apps/hub/src/lib/api-origin.ts) | Sin `getHubWsBaseUrl` |
| Tests | `realtime-tenant-isolation`, `presence-service` | Adaptados a SSE |
| Auth | [`auth.ts`](../../packages/api/src/core/auth.ts) comentario `?token=` | Texto SSE |

## Diseño (resumen)

- Ruta: `GET /v1/events/presence/:companyId` (mismo patrón que `GET /v1/events/metrics/:companyId`: hijack, CORS, `requireAuth`, `assertCompanyAccess`).
- Segunda instancia de manager SSE (`presenceSseManager`) para no mezclar límites con el stream de métricas.
- Eventos: `presence:sync`, `user:joined`, `user:left`.

## Checklist

- [x] Documentación: README de `docs/plans/` y enlaces en [`PLAN-31-build-convention.md`](./PLAN-31-build-convention.md) alineados (sin tratar Railway como plan activo 30).
- [x] API: stream SSE de presencia + refactor `presence.service`.
- [x] API: eliminar plugin WS, `ws.controller`, dependencia.
- [x] Hub: `usePresence` con `EventSource`; limpiar `NEXT_PUBLIC_ENABLE_PRESENCE_WS` / heurística `vercel.app` si aplica.
- [x] Tests de integración y unitarios actualizados.
- [x] Búsqueda global: sin `WebSocket` / `@fastify/websocket` / `/v1/ws` en código de app.

## Git

Rama `plan/plan-30-ws-to-sse-run-<YYYYMMDD-HHmmss>` desde **`Test`**, según [Git workflow for plans](./SYNC.md#git-workflow-for-plans).

## Referencias

- [`sse.service.ts`](../../packages/api/src/services/sse.service.ts)
- [`events.controller.ts`](../../packages/api/src/controllers/v1/events.controller.ts)
- [PLAN-17 realtime](./%5Bcompleted%5D%20PLAN-17-realtime-layer.md) (contexto histórico)
