# Shopflow (`@multisystem/shopflow`)

Módulo **POS e inventario** del ecosistema Multisystem: ventas, productos, categorías, clientes, proveedores, inventario, reportes y administración (usuarios del módulo, fidelidad, backup, ajustes de tienda/ticket).

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TanStack Query**, **Zustand**, **react-hook-form** + **Zod**
- **Tailwind CSS 4**, **@multisystem/ui**, **@multisystem/shared**, **@multisystem/contracts**
- **Recharts**, **ExcelJS**, **jsPDF**, **react-to-print** (tickets/recibos)
- **Vitest** (tests en validaciones y similares)

La API es **`@multisystem/api`**, consumida por HTTP (cliente en `src/lib/api/client.ts`).

## Puerto y desarrollo

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Next en **http://localhost:3002** (Turbopack) |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` / `pnpm typecheck` | Calidad |
| `pnpm test` / `pnpm test:run` | Vitest |

```bash
pnpm --filter @multisystem/shopflow dev
```

Incluir **`http://localhost:3002`** en **`CORS_ORIGIN`** de la API. El **Hub** puede enlazar aquí con **`NEXT_PUBLIC_SHOPFLOW_URL=http://localhost:3002`**.

## Variables de entorno

Crear **`apps/shopflow/.env.local`** (ver `.env.example`).

| Variable | Uso |
|----------|-----|
| **`NEXT_PUBLIC_API_URL`** | Base URL principal de la API en **`src/lib/api/client.ts`**. Fallback por defecto: **`http://localhost:3000`**. |
| **`NEXT_PUBLIC_HUB_URL`** | Enlaces al Hub cuando aplica. |
| **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** | Opcional — notificaciones push Web Push. |
| **`NEXT_PUBLIC_SHOPFLOW_URL`**, **`NEXT_PUBLIC_WORKIFY_URL`**, **`NEXT_PUBLIC_TECHSERVICES_URL`** | URLs públicas del ecosistema (landing). |

En desarrollo, **`next.config.ts`** reescribe **`/v1/*`** al API en `http://127.0.0.1:3000` (mismo criterio que Hub).

## Estructura (`src/`)

```
src/
├── app/                    # App Router (rutas y layouts)
├── components/             # POS, reportes, backup, settings, …
├── hooks/
├── lib/
│   ├── api/client.ts       # ApiClient + rutas shopflow
│   ├── services/           # Ventas, productos, reportes, backup, impresión, …
│   ├── validations/        # Zod (+ tests Vitest)
│   └── permissions.ts
├── providers/
├── views/                  # Páginas compuestas reutilizadas por app/
└── types/
```

## Enlaces

- [README raíz](../../README.md)
- [API — área shopflow](../../packages/api/README.md)
