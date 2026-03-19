# Shopflow (`@multisystem/shopflow`)

Módulo **POS e inventario** del ecosistema Multisystem: ventas, productos, categorías, clientes, proveedores, inventario, reportes y administración (usuarios del módulo, fidelidad, backup, ajustes de tienda/ticket).

## Stack

- **Vite 7** + **React 19** + **React Router 7**
- **TanStack Query**, **Zustand**, **react-hook-form** + **Zod**
- **Tailwind CSS 4**, **@multisystem/ui**, **@multisystem/shared**, **@multisystem/contracts**
- **Recharts**, **ExcelJS**, **jsPDF**, **react-to-print** (tickets/recibos)
- **Vitest** (tests en validaciones y similares)
- **next-intl** (i18n; convive con el stack Vite)

La API es **`@multisystem/api`**, rutas bajo **`/api/shopflow/*`** (cliente en `src/lib/api/client.ts` vía `shopflowApi` = prefijo `/api/shopflow`).

## Puerto y desarrollo

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Vite en **http://localhost:3002** |
| `pnpm build` / `pnpm preview` | Build y preview estático |
| `pnpm lint` / `pnpm typecheck` | Calidad |
| `pnpm test` / `pnpm test:run` | Vitest |

```bash
pnpm --filter @multisystem/shopflow dev
```

Incluir **`http://localhost:3002`** en **`CORS_ORIGIN`** de la API. El **Hub** puede enlazar aquí con **`VITE_SHOPFLOW_URL=http://localhost:3002`**.

## Variables de entorno

Crear **`apps/shopflow/.env`** (ver `.env.example`).

| Variable | Uso |
|----------|-----|
| **`NEXT_PUBLIC_API_URL`** | Base URL de la API en **`src/lib/api/client.ts`** (y varios servicios). En Vite, si no se inyecta, el código cae en **`http://localhost:3000`**. Para builds que no expongan `NEXT_PUBLIC_*`, valorar `envPrefix` en Vite o alinear con `VITE_*`. |
| **`VITE_API_URL`** | Usado en **`src/lib/api-client.ts`** (auth auxiliar). |
| **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** | Opcional — notificaciones push Web Push. |

Proxy de desarrollo en `vite.config`: peticiones a **`/api`** se reenvían al host de la API (revisar que coincida con cómo los servicios construyen la URL; el cliente principal suele ir directo a `API_URL`).

## Estructura (`src/`)

```
src/
├── app/                    # Páginas estilo App Router (rutas bajo (auth), (dashboard), …)
├── components/             # POS, reportes, backup, settings, …
├── hooks/
├── lib/
│   ├── api/client.ts       # ApiClient + shopflowApi → /api/shopflow
│   ├── services/           # Ventas, productos, reportes, backup, impresión, …
│   ├── validations/        # Zod (+ tests Vitest)
│   └── permissions.ts
├── providers/
└── types/
```

> **Nota:** coexisten ficheros con APIs de **Next.js** (`next/navigation`, `next/image`) bajo `app/`; el entry actual es **Vite** (`main.tsx` → `App.tsx`). Comprueba que el enrutado que uses en local coincida con el entry activo.

## Enlaces

- [README raíz](../../README.md)
- [API — área shopflow](../../packages/api/README.md)
