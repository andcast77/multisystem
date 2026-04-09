# PLAN-36 — Shopflow: verificación y documentación del Service Worker (push)

**Estado:** pendiente.

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

- Solo **Shopflow** y archivos relacionados (no cambiar la API salvo bug bloqueante acordado).

## Checklist

- [ ] Confirmar ruta y contenido del SW (`/sw.js` vs otro).
- [ ] Prueba en navegador (o checklist reproducible): permiso, suscripción, error esperado sin VAPID.
- [ ] Revisar CSP vs necesidades de push/SW.
- [ ] README actualizado con “cómo probar” y “qué no está soportado”.
- [ ] Si hay bug corregible en el mismo PR, enlazar aquí y marcar ítem.

## Referencias

- [PLAN-16](./%5Bcompleted%5D%20PLAN-16-shopflow-serverless-api-alignment.md) (contexto histórico push/VAPID si aplica).
