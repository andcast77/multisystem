# PLAN-35 — `@multisystem/ui`: alineación de tooling y bundler (opcional)

**Estado:** pendiente.

## Contexto

`packages/component-library` (`@multisystem/ui`) hoy usa **Vite** como build de librería (`dist/`). [PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) indica que **sincronizar versiones** de tooling (TypeScript, Vitest, Vite, Sass, tipos) con el resto del monorepo **no es opcional**, mientras que **cambiar el bundler** (p. ej. Vite → tsup/rollup) es **opcional**.

Este plan cubre ambas facetas de forma explícita.

## Objetivo A (obligatorio en espíritu de PLAN-31)

Alinear **devDependencies** y peers relevantes de `packages/component-library` con la línea canónica del monorepo (tras o en paralelo con [PLAN-32](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md)): `typescript`, `vitest`, `vite`, `@vitejs/plugin-react`, `sass`, `@types/*`, alineación de `react` / `react-dom` como peers con las apps.

## Objetivo B (opcional)

Evaluar y, si conviene, migrar el build de la librería a **tsup** u otro bundler mínimo, manteniendo exports actuales (`package.json` `exports` / consumo desde Next con `transpilePackages`).

## Criterios de éxito

- `pnpm --filter=@multisystem/ui run build` (o scripts equivalentes tras cambio) sin errores.
- Apps que consumen `@multisystem/ui` (**hub, shopflow, workify, techservices**) compilan sin regresión.
- Si se cambia bundler: documentar en `packages/component-library/README.md` el nuevo flujo.

## Checklist

- [ ] Auditoría de `devDependencies` / `peerDependencies` vs PLAN-32.
- [ ] Ajustes de versiones y CI/build verdes.
- [ ] (Opcional) Spike tsup/rollup: pros/contras documentados en este plan o ADR corto.
- [ ] (Opcional) Implementación del bundler alternativo + validación en una app Next.

## Referencias

- Paquete: [packages/component-library](../../packages/component-library/)
