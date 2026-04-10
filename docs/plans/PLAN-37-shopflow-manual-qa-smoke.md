# PLAN-37 — Shopflow (Next): verificación manual y smoke post–PLAN-31

**Estado:** pendiente.

## Contexto

La migración a Next en [PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) dejó **verificación manual** fuera del cierre operativo: login, navegación, POS, impresión y notificaciones requieren un entorno real (API + DB + apps) y juicio humano. Este plan es el **contenedor canónico** de ese cierre de calidad.

## Objetivo

Ejecutar una **lista de comprobación** acordada contra Shopflow en **Next** (puerto **3002** en dev), con API en **3000** y CORS correcto, y dejar **registro** (checklist marcada, notas de issues) en este archivo o en el sistema de issues del equipo.

## Áreas mínimas sugeridas

- **Auth:** login, logout, sesión cookie, redirect `?next=`, MFA si aplica.
- **Navegación:** sidebar, rutas protegidas, 404 / enlaces rotos obvios.
- **POS:** flujo corto de venta (o el que el negocio defina como smoke).
- **Impresión:** ticket/recibo (react-to-print / plantillas) en al menos un caso feliz.
- **Notificaciones:** coherente con [PLAN-36](./%5Bcompleted%5D%20PLAN-36-shopflow-service-worker-push.md) si se prueba push; si no, marcar N/A con motivo.

## Criterios de cierre

- Todos los ítems del checklist inferior marcados **OK** o **N/A documentado**.
- Issues encontrados: creados en tracker o bullets bajo “Hallazgos” en este plan.

## Checklist (editable en el mismo PR de verificación)

- [ ] Login / sesión
- [ ] Navegación principal (dashboard, módulos críticos)
- [ ] POS (smoke)
- [ ] Impresión (smoke)
- [ ] Notificaciones push / SW (o N/A)
- [ ] Build/preview producción local o en Vercel (opcional pero recomendado)

## Hallazgos

_(Rellenar durante la verificación.)_

## Referencias

- [apps/shopflow/README.md](../../apps/shopflow/README.md)
- [PLAN-36](./%5Bcompleted%5D%20PLAN-36-shopflow-service-worker-push.md) para push/SW.
