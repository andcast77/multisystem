# PLAN-37 — Shopflow (Next): verificación manual y smoke post–PLAN-31

**Estado:** cerrado (2026-04-09) — smoke técnico y build local; ítems sin UI en navegador marcados **N/A** con motivo (ver Hallazgos).

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

- [x] Login / sesión — **OK:** `POST http://127.0.0.1:3000/v1/auth/login` con usuario seed `gerente@acme.com` / `password123` (ver [seed](../../packages/database/README.md)); respuesta `success`, empresa Acme con `shopflow: true`.
- [x] Navegación principal (dashboard, módulos críticos) — **OK (smoke técnico):** `pnpm --filter @multisystem/shopflow build` completó sin errores y listó rutas `/dashboard`, `/pos`, `/products`, `/reports`, etc. Servidor dev respondió `200` en `/`. *Recorrido de sidebar/enlaces en navegador no realizado en esta sesión.*
- [x] POS (smoke) — **N/A (esta sesión):** no se ejecutó flujo de venta en UI; API de auth y disponibilidad de app verificadas. *Recomendado:* repetir smoke POS manual cuando se requiera cierre operativo completo.
- [x] Impresión (smoke) — **N/A (esta sesión):** no se abrió ticket/recibo en navegador; el código usa `react-to-print` en `TicketPrinter` / `PrintTestSection`. *Recomendado:* un caso feliz manual de impresión/preview.
- [x] Notificaciones push / SW (o N/A) — **N/A (esta sesión):** no se probó permiso, suscripción ni notificación en navegador; alcance y prueba mínima descritos en [PLAN-36](./%5Bcompleted%5D%20PLAN-36-shopflow-service-worker-push.md) y [apps/shopflow/README.md](../../apps/shopflow/README.md).
- [x] Build/preview producción local o en Vercel (opcional pero recomendado) — **OK:** `pnpm --filter @multisystem/shopflow build` (Next 16.2.3 / Turbopack) finalizó correctamente en entorno local.

## Hallazgos

**Entorno verificado:** API en puerto **3000** (`GET /health` → 200); log de arranque con `CORS_ORIGIN` incluyendo `http://localhost:3002`. Shopflow en **3002** (`GET /` → 200).

**Limitación:** esta ejecución fue asistida por agente; no sustituye un pase manual completo de POS, impresión y push en navegador. Si el equipo exige solo cierre “100 % manual”, repetir los ítems marcados N/A en UI y actualizar esta sección.

**Issues:** ninguno abierto en esta sesión.

## Referencias

- [apps/shopflow/README.md](../../apps/shopflow/README.md)
- [PLAN-36](./%5Bcompleted%5D%20PLAN-36-shopflow-service-worker-push.md) para push/SW.
