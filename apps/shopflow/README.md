# Shopflow (`@multisystem/shopflow`)

Módulo **POS e inventario** del ecosistema Multisystem: ventas, productos, categorías, clientes, proveedores, inventario, reportes y administración (usuarios del módulo, fidelidad, backup, ajustes de tienda/ticket).

## Stack

- **Vite 7** + **React 19** + **React Router 7**
- **TanStack Query**, **Zustand**, **react-hook-form** + **Zod**
- **Tailwind CSS 4**, **@multisystem/ui**, **@multisystem/shared**, **@multisystem/contracts**
- **Recharts**, **ExcelJS**, **jsPDF**, **react-to-print** (tickets/recibos)
- **Vitest** (tests en validaciones y similares)

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
| **`VITE_API_URL`** | Base URL principal de la API en **`src/lib/api/client.ts`**. Fallback por defecto: **`http://localhost:3000`**. |
| **`VITE_VAPID_PUBLIC_KEY`** | Opcional — notificaciones push Web Push. |

Proxy de desarrollo en `vite.config`: peticiones a **`/api`** se reenvían al host de la API (revisar que coincida con cómo los servicios construyen la URL; el cliente principal suele ir directo a `API_URL`).

## Estructura (`src/`)

```
src/
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

> **Nota:** el frontend activo está aislado para Vite (`main.tsx` → `App.tsx`) y no depende de `next/*`.

## Enlaces

- [README raíz](../../README.md)
- [API — área shopflow](../../packages/api/README.md)
