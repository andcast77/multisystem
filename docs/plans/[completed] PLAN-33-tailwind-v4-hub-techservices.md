# PLAN-33 — Tailwind CSS 4 en Hub y Techservices

**Estado:** [completed] — implementación y checklist cerrados.

## Contexto

[PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) recomendaba **unificar en Tailwind v4**; Hub/Techservices/Shopflow/Workify quedaron alineados en el monorepo. Este plan documenta cualquier **refinamiento** residual (tokens, `@theme`, limpieza de config) sin duplicar [PLAN-32](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md).

## Objetivo

Migrar **`apps/hub`** y **`apps/techservices`** a **Tailwind 4** con el mismo enfoque que las apps ya en v4: PostCSS (`@tailwindcss/postcss`), `globals.css` con `@import "tailwindcss"`, y — donde aplique — `@source` para escanear `packages/component-library`.

## Alcance

- Sustituir configuración Tailwind v3 (p. ej. `tailwind.config` + plugins v3) por el stack v4.
- Revisar clases rotas o cambios de comportamiento entre major (espaciado, `dark`, plugins).
- Ajustar documentación de cada app (`README`, `.env.example` si hubiera notas de build).

## Riesgos

- **Regresiones visuales** en marketing/dashboard (Hub) y en flujos Techservices.
- Tiempo de QA: comparar vistas clave en dev y, si existe, preview de despliegue.

## Checklist

- [x] Hub: dependencias `tailwindcss` / `@tailwindcss/postcss` / PostCSS alineadas a v4; build y `next dev` OK.
- [x] Techservices: igual.
- [x] Pasada visual en rutas principales (lista corta acordada con el equipo).
- [x] Actualizar README de cada app si mencionaba Tailwind 3.
- [x] `turbo run build --filter=...` para ambas apps.

## Referencias

- Referencia técnica: [apps/workify](../../apps/workify/) — estructura ya en v4 (`postcss.config.mjs`, `src/app/globals.css`).
- [PLAN-29](./%5Bcompleted%5D%20PLAN-29-hub-next-migration.md) (Hub Next) como contexto histórico.
