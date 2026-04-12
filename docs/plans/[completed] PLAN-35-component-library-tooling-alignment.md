# PLAN-35 — `@multisystem/ui`: alineación de tooling y bundler (opcional)

**Estado:** completado (2026-04-09).

## Resultado de auditoría (devDependencies / peers vs PLAN-32)

| Área                                                           | Hallazgo                                                                                                                                                                                                               |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript`, `vite`, `vitest`, `@vitejs/plugin-react`, `sass` | Declarados como `catalog:` en `packages/component-library/package.json`; versiones canónicas en `pnpm-workspace.yaml` (`typescript` 6.0.2, `vite` 8.0.8, `vitest` 4.1.4, `@vitejs/plugin-react` 6.0.1, `sass` 1.99.0). |
| `@types/node`, `@types/react`, `@types/react-dom`              | `catalog:` — alineados con apps.                                                                                                                                                                                       |
| `react` / `react-dom`                                          | `peerDependencies` vía `catalog:` — misma línea que hub, shopflow, workify, techservices.                                                                                                                              |
| Radix / `clsx` / `lucide-react`                                | `dependencies` con `catalog:`.                                                                                                                                                                                         |

**Conclusión:** No se requirieron bumps manuales de versión en este plan; el paquete ya cumple el objetivo A respecto al catálogo compartido.

## Spike opcional: Vite vs tsup (sin migración)

|         | Vite (actual)                                                                                              | tsup (alternativa típica)                                                                      |
| ------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Pros    | Ya integrado; Sass + `@vitejs/plugin-react`; plugin post-build para CSS en el entry; equipo familiarizado. | Config mínima para ESM/CJS; a veces menos superficie que Vite full.                            |
| Contras | Más dependencias que un solo binario tsup.                                                                 | Replicar extracción CSS + `import` inyectado en JS requiere diseño explícito (o post-proceso). |

**Decisión:** mantener **Vite**; no se añadió `tsup` al árbol de dependencias en esta ejecución.

## Seguimiento opcional (fuera de PLAN-35)

Trabajo **no incluido** en el cierre de este plan; puede abordarse en un plan o tarea futura si el equipo prioriza otra herramienta de empaquetado:

- Implementar el build de `@multisystem/ui` con **tsup**, **Rollup** u otro bundler, conservando `package.json` `exports` y el contrato de CSS (incl. consumo en Next con `transpilePackages`).
- Validar en al menos una app **Next** del monorepo (p. ej. hub o shopflow).

## Contexto

`packages/component-library` (`@multisystem/ui`) hoy usa **Vite** como build de librería (`dist/`). [PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) indica que **sincronizar versiones** de tooling (TypeScript, Vitest, Vite, Sass, tipos) con el resto del monorepo **no es opcional**, mientras que **cambiar el bundler** (p. ej. Vite → tsup/rollup) es **opcional**.

Este plan cubre ambas facetas de forma explícita.

## Objetivo A (obligatorio en espíritu de PLAN-31)

Alinear **devDependencies** y peers relevantes de `packages/component-library` con la línea canónica del monorepo (tras o en paralelo con [PLAN-32](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md)): `typescript`, `vitest`, `vite`, `@vitejs/plugin-react`, `sass`, `@types/`*, alineación de `react` / `react-dom` como peers con las apps.

## Objetivo B (opcional)

Evaluar y, si conviene, migrar el build de la librería a **tsup** u otro bundler mínimo, manteniendo exports actuales (`package.json` `exports` / consumo desde Next con `transpilePackages`). La evaluación quedó documentada arriba; la implementación queda en **Seguimiento opcional**.

## Criterios de éxito

- `pnpm --filter=@multisystem/ui run build` (o scripts equivalentes tras cambio) sin errores.
- Apps que consumen `@multisystem/ui` (**hub, shopflow, workify, techservices**) compilan sin regresión.
- Si se cambia bundler: documentar en `packages/component-library/README.md` el nuevo flujo.

## Checklist (cierre)

- [x] Auditoría de `devDependencies` / `peerDependencies` vs PLAN-32.
- [x] Ajustes de versiones y CI/build verdes (sin cambios de pin necesarios; `pnpm --filter=@multisystem/ui run build` y `pnpm exec turbo run build` sobre ui + hub, shopflow, workify, techservices OK).
- [x] (Opcional) Spike tsup/rollup: pros/contras documentados en este plan o ADR corto.

## Referencias

- Paquete: [packages/component-library](../../packages/component-library/)
