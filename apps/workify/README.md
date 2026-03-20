# Workify (`@multisystem/workify`)

Módulo **RRHH y asistencia** del monorepo Multisystem: empleados, cargos, turnos, fichajes, reportes, usuarios/roles de empresa y ajustes (festivos, etc.). Los datos salen de la API central **`/api/workify/*`** (Fastify); **no** usa Prisma ni API Routes propias para el dominio de negocio.

## Stack

- **Next.js 16** (App Router, **Turbopack** en `dev`), **React 19**, **Tailwind 4**
- **TanStack Query**, **Zustand**, **react-hook-form** + **Zod**
- **@multisystem/ui** (`transpilePackages`), **@multisystem/shared**, **@multisystem/contracts**
- **Recharts**, **ExcelJS**, **jsPDF**, **react-to-print**, **Vitest**

Cliente HTTP: **`src/lib/api/client.ts`** — `workifyApi` (`/api/workify`), `authApi` (`/api/auth`), `companiesApi` (miembros `/api/companies/:id/members`). Cookie **`token`** (JWT), alineada con Hub / Shopflow.

## Puerto y scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | `next dev -p **3003** --turbo` |
| `pnpm build` / `pnpm start` | Producción |
| `pnpm lint` / `pnpm typecheck` | Calidad |
| `pnpm test` / `pnpm test:run` | Vitest |

```bash
pnpm --filter @multisystem/workify dev
```

Añadir **`http://localhost:3003`** a **`CORS_ORIGIN`** en la API. En el Hub: **`VITE_WORKIFY_URL=http://localhost:3003`**.

## Variables de entorno

Crear **`apps/workify/.env.local`** (ver `.env.example`):

| Variable | Descripción |
|----------|-------------|
| **`NEXT_PUBLIC_API_URL`** | Base de la API (p. ej. `http://localhost:3000`). |

## Rutas (resumen)

Autenticación: `/login`, `/register`. Tras login, áreas bajo layout con sidebar: `/dashboard`, `/employees` (altas, edición, asistencia, horario, asignaciones especiales), `/time-entries`, `/work-shifts`, `/positions`, `/users`, `/roles`, `/reports`, `/settings` (incl. festivos).

Detalle en `src/lib/constants/routes.ts`.

## Monorepo

`next.config.ts` define **`turbopack.root`** en la raíz del repo para resolver workspaces. La BD y migraciones están en **`@multisystem/database`**; la API en **`@multisystem/api`**.

## Enlaces

- [README raíz](../../README.md)
- [API — workify](../../packages/api/README.md)

---

*Documentación histórica que hablaba de Next 14 + Prisma dentro de Workify quedó obsoleta; este archivo describe el estado actual en `apps/workify`.*
