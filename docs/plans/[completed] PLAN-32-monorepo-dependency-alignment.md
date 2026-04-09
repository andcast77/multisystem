# PLAN-32 — Alineación sistemática de dependencias del monorepo

**Estado:** completado (2026-04-09).

## Contexto

Complementa el **objetivo 2** de [PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md): una pasada explícita (`pnpm outdated`, auditoría de duplicados) y **una sola línea de versiones** por dependencia compartida entre `apps/*` y `packages/*`, sin dejar el trabajo solo en API + Shopflow.

## Objetivo

1. Inventariar dependencias repetidas o con versiones divergentes (`typescript`, `react`, `react-dom`, `next`, `zod`, `vitest`, `@types/*`, `eslint`, `prettier`, `tailwindcss`, `@prisma/client`, `prisma`, `tsx`, `@tanstack/react-query`, `lucide-react`, etc.).
2. Definir la **versión canónica** por familia (documentada en este plan o en tabla en README del monorepo si el equipo lo prefiere).
3. Alinear `package.json` de **todos** los workspaces afectados y validar con **`pnpm install`**, **`turbo run build`** y **`turbo run test`** en los paquetes que ejecuten tests.

## Alcance

- `apps/hub`, `apps/workify`, `apps/techservices`, `apps/shopflow`
- `packages/api`, `packages/database`, `packages/contracts`, `packages/shared`, `packages/component-library`, y cualquier otro `packages/*` con `package.json`

## Fuera de alcance (planes dedicados)

- **Tailwind 3 → 4** en Hub/Techservices → [PLAN-33](./%5Bcompleted%5D%20PLAN-33-tailwind-v4-hub-techservices.md)
- **Catálogo pnpm** → [PLAN-34](./PLAN-34-pnpm-catalog.md)
- **Tooling de `@multisystem/ui`** (bundler) → [PLAN-35](./PLAN-35-component-library-tooling-alignment.md)

## Mecánica sugerida

1. `pnpm outdated` (y opcionalmente `pnpm why <pkg>` para conflictos).
2. Matriz breve: paquete × workspaces × versión actual → versión objetivo.
3. Cambios por PR acotados (p. ej. solo `typescript` + rebuild) si reduce riesgo.
4. Documentar cualquier **excepción** (p. ej. paquete pinneado por bug conocido).

## Matriz de alineación (ejecución)

Inventario `pnpm outdated -r` (2026-04-09):

| Paquete | Nota |
|--------|------|
| `eslint` | Latest 10.x; **no** adoptado: `eslint-config-next` 16.x requiere peer `eslint ^9` (ver comentario en `pnpm-workspace.yaml`). Objetivo: mantener **9.39.4** en catálogo. |
| `@types/bcryptjs` | Latest 3.0.0 marcado como deprecated; se mantiene **2.4.6** en catálogo. |

Cambios realizados:

- Ampliado el bloque `catalog:` en la raíz ([`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)): stack **Fastify**, tipos asociados, **Radix UI** (`@multisystem/ui`), `nodemailer`, `@upstash/redis`, etc.
- [`packages/api/package.json`](../../packages/api/package.json), [`packages/database/package.json`](../../packages/database/package.json) y [`packages/component-library/package.json`](../../packages/component-library/package.json): dependencias que usaban `^` pasan a **`catalog:`** donde existe entrada en el catálogo.
- **Convención:** versión canónica = entrada en `pnpm-workspace.yaml` → `"nombre": "catalog:"` en cada workspace; excepciones documentadas arriba (`eslint`, `@types/bcryptjs`).
- **Workify:** script `test` ajustado a `vitest run --passWithNoTests` porque aún no hay archivos `*.test.*` (evita fallo de `turbo run test`).

**Rama:** `plan/PLAN-32-monorepo-dependency-alignment-run-20260409-120000` desde `Test`.

## Checklist

- [x] Inventario de duplicados y decisiones de versión objetivo.
- [x] Alinear `package.json` en todos los workspaces del alcance.
- [x] `pnpm install` limpio; lockfile coherente.
- [x] `turbo run build` en apps/paquetes afectados sin errores.
- [x] `turbo run test` donde exista suite (API, shopflow, etc.).
- [x] Nota breve en [README.md](../../README.md) o en este plan sobre convención de versiones (si aplica).

## Referencias

- Política descrita en [PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) § Política de versiones.
- Rama de trabajo: nueva rama `plan/...` desde `Test` según [git-plan-workflow-start](../../.cursor/rules/git-plan-workflow-start.mdc).
