# [completed] Plan 2 — CORS & environment alignment

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §11 CORS.

| Field | Detail |
|-------|--------|
| **Objective** | Single source of truth for allowed browser origins (all app ports). |
| **Risk addressed** | Default origins missing hub (`3001`); misconfig blocks users or invites overly permissive fixes. |
| **Priority** | **First** — quick win for local and staged multi-app setups. |

> Validation note: although this plan is marked as "First", in this cycle it was completed after Plan 1 (`1 -> 2`). Post-alignment verification confirmed stable cross-origin auth/session flows (`HttpOnly` session cookie + allowed origins `3001-3004`).

## Tasks

- [x] List all dev origins (hub, shopflow, workify, techservices) in **root README** and each app’s **`env.example`**.
- [x] Align Fastify CORS config with that list; add comment in API env pointing to README.
- [x] Add checklist item for **new app port** → update CORS + docs (README template or CONTRIBUTING).

## Cambios implementados

- Normalizado el set de orígenes de desarrollo a `http://localhost:3001`–`http://localhost:3004` (incluyendo `3002` para Shopflow) y eliminado el uso de `3005`.
- Alineación de defaults en la API:
  - `packages/api/src/core/config.ts`: fallback de `CORS_ORIGIN` actualizado.
  - `packages/api/src/server.ts`: default del schema de `CORS_ORIGIN` actualizado.
  - `packages/api/.env.example`: ejemplo de `CORS_ORIGIN` actualizado con 3001–3004.
  - `packages/api/README.md`: ejemplo y descripción de `CORS_ORIGIN` actualizados.
- Fuente de verdad en docs:
  - `README.md` (raíz): añadida sección **“CORS (desarrollo)”** y checklist **“Al añadir una nueva app (frontend)”**.
- `env.example` por app:
  - `apps/hub/env.example`: lista CORS ajustada y puertos canónicos corregidos en el ejemplo.
  - `apps/shopflow/.env.example` y `apps/techservices/.env.example`: comentarios de alineación añadidos.
  - `apps/workify/.env.example`: creado con `NEXT_PUBLIC_API_URL` y comentarios CORS (alineado con 3001–3004).
- Coherencia UI:
  - `apps/hub/src/pages/LandingPage.tsx`: enlace “Tech Services” corregido a `http://localhost:3004`.

## Definition of done

- New developer can start all apps without CORS surprises.
- Docs and code defaults match; onboarding mentions where to change origins.
