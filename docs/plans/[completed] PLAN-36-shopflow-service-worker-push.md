# PLAN-36 — Shopflow: verificación y documentación del Service Worker (push)

**Estado:** completado.

## Contexto

[PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) § Otros detalles pide **verificar** `public/sw.js` o **documentar** el comportamiento respecto a notificaciones push y registro del SW. Tras la migración a Next, el contrato sigue siendo relevante (`usePushNotifications.ts`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).

## Objetivo

1. **Inspeccionar** [apps/shopflow/public/sw.js](../../apps/shopflow/public/sw.js) (si existe) o el origen real del SW.
2. Validar coherencia con:
   - registro en cliente (`usePushNotifications` u otros hooks),
   - **CSP** en `apps/shopflow/next.config.ts` (`connect-src`, alcance del SW),
   - variables `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y endpoints de la API.
3. **Documentar** en [apps/shopflow/README.md](../../apps/shopflow/README.md) (o subsección): cuándo se registra el SW, limitaciones en dev/prod, y pasos de prueba mínimos.

## Alcance

- **Shopflow:** SW, README, CSP/cliente.
- **API (ampliación explícita):** alinear **jobs programados + Web Push** con despliegue **100% Vercel serverless** (Cron HTTP + `CRON_SECRET`), sin depender de `node-cron` en el proceso serverless.

## Checklist

- [x] Confirmar ruta y contenido del SW (`/sw.js` vs otro).
- [x] Prueba en navegador (o checklist reproducible): permiso, suscripción, error esperado sin VAPID.
- [x] Revisar CSP vs necesidades de push/SW.
- [x] README Shopflow actualizado con “cómo probar” y “qué no está soportado”.
- [x] Bug corregido: faltaba `apps/shopflow/public/sw.js` pese a que `usePushNotifications` registraba `/sw.js` — añadido SW mínimo alineado con `push-sender.service.ts`.
- [x] **Vercel serverless:** rutas `GET /v1/internal/cron/*` (Bearer `CRON_SECRET`), `vercel.json` `crons` en UTC (paridad con `runner.ts`), rate-limit excluye cron, README API + `.env.example`, fila en README Shopflow.
- [x] `server.ts` documenta que en `VERCEL` no corre `node-cron`; jobs por Cron HTTP.

## Referencias

- [PLAN-16](./%5Bcompleted%5D%20PLAN-16-shopflow-serverless-api-alignment.md) (contexto histórico push/VAPID si aplica).
