# PLAN-31 — Convención `pnpm build` (Vercel y apps)

**Estado:** pendiente de aplicar en código (plan mode bloqueó ediciones a `package.json`).

## Intención

- **Cada app/paquete** expone su artefacto con el script estándar **`build`** en su `package.json`.
- **Vercel** (y Railway para la API) no usan nombres tipo `vercel:build`; desde la raíz del monorepo se usa **`pnpm --filter @multisystem/<pkg> build`**, que ejecuta ese `build`.
- La raíz del monorepo sigue teniendo **`pnpm build`** = `turbo run build` (compilar **todo** el workspace).

## Cambios a aplicar

### `packages/api/package.json`

- Reemplazar `"build": "tsc"` por el pipeline completo (install + turbo database + verificación prisma client + turbo api + copia de `packages/database` bajo `packages/api/node_modules/@multisystem/`), con prefijo **`cd ../.. &&`** para que funcione cuando pnpm ejecuta el script con cwd `packages/api`.

### `packages/api/vercel.json`

- `"buildCommand": "cd ../.. && pnpm --filter @multisystem/api build"`

### Raíz `package.json`

- `"vercel:build": "pnpm --filter @multisystem/api build"` (alias retrocompatible; ya no contiene el pipeline largo).

### Apps Next/Vite (hub, shopflow, workify, techservices)

En cada `apps/<app>/package.json`:

- `"build": "cd ../.. && pnpm exec turbo run build --filter=@multisystem/<nombre>"`

En cada `apps/<app>/vercel.json`:

- `"buildCommand": "cd ../.. && pnpm --filter @multisystem/<nombre> build"`

### Docs

- [\[cancelled\] PLAN-30-api-railway.md](./%5Bcancelled%5D%20PLAN-30-api-railway.md): contexto histórico Railway; build API = `pnpm --filter @multisystem/api build` desde la raíz.
- [README.md](../../README.md) / [packages/api/README.md](../../packages/api/README.md): mencionar que el build de deploy de la API es `pnpm --filter @multisystem/api build` desde la raíz.

## Nota

`pnpm build` en la **raíz** sigue siendo el build global del monorepo; el “build de una app” es **`pnpm --filter @multisystem/<app> build`**, que es el estándar pnpm para el script `build` de ese paquete.
