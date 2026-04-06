# Multisystem Hub (`@multisystem/hub`)

App **Vite + React 19** en **`apps/hub`**: portal multi-empresa — landing pública, autenticación contra la API compartida y **dashboard** para ver empresa, módulos contratados y enlaces a **Workify**, **Shopflow** y **Techservices**.

Forma parte del **monorepo** (`pnpm` workspaces); no es un repo aislado.

## Funcionalidad

| Área | Rutas / notas |
|------|----------------|
| Pública | `/` landing, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` |
| Protegidas (JWT en cookie `token`) | `/dashboard` — resumen, tarjetas de módulos habilitados, stats; `/dashboard/members` — miembros; `/dashboard/settings` — empresa y módulos (según rol) |

La API es **`@multisystem/api`** (Fastify). En desarrollo, Vite hace **proxy** de `/v1` → la API (por defecto `http://localhost:3000`), incluyendo **WebSocket** (`ws: true`). Si `VITE_API_URL` está vacío, el cliente usa la misma origen (`/v1/...`) y evita CORS.

## Stack

- **React Router 7**, **TanStack Query**, **react-hook-form** + **Zod**
- **@multisystem/ui**, **@multisystem/contracts**, **@multisystem/shared** (reexport cookie auth en `src/lib/auth.ts`)

## Scripts (desde `apps/hub` o con filter)

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Vite, puerto **3001** |
| `pnpm build` | Build estático → `dist/` |
| `pnpm preview` | Preview del build |
| `pnpm lint` | ESLint |

```bash
pnpm --filter @multisystem/hub dev
```

En la raíz del monorepo: **`pnpm run dev:hub`** (construye `@multisystem/ui` y levanta API + Hub).

## Variables de entorno

Crear **`.env`** en `apps/hub/` usando **`.env.example`** como plantilla:

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Base URL absoluta de la API si no usas el proxy. En **dev**, vacío o `http://localhost:3000` = mismo origen + proxy `/v1` (el código trata el localhost explícito como proxy). En **build** sin valor, cae a `http://localhost:3000`. |
| `VITE_SHOPFLOW_URL` | Shopflow (p. ej. **`http://localhost:3002`**). |
| `VITE_WORKIFY_URL` | Workify (**`http://localhost:3003`**). |
| `VITE_TECHSERVICES_URL` | Techservices (p. ej. `http://localhost:3004`). |

Asegurar que **`CORS_ORIGIN`** en la API incluya `http://localhost:3001`.

## Estructura (src)

```
src/
├── App.tsx                 # Rutas React Router
├── main.tsx
├── pages/                  # Landing, Login, Dashboard, Members, Settings, …
├── components/             # Layout dashboard, ModuleCard, ProtectedRoute, …
├── hooks/                  # useUser, useCompany, useCompanyMembers, …
├── lib/                    # api-client (tipos @multisystem/contracts), auth
├── providers/QueryProvider.tsx
└── app/                    # Rutas/layout Next-style (conviven con Pages; el enrutado principal es App.tsx)
```

## Despliegue

- **`vercel.json`**: ejemplo con `turbo build` / `dist` — ajustar al pipeline real del monorepo (root directory, variables `VITE_*` en build).

## Enlaces

- [README raíz](../../README.md) — monorepo, BD, `dev:hub`
- [API](../../packages/api/README.md)
- [Shared](../../packages/shared/README.md) — cookie + cliente
