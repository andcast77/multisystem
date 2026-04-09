# PLAN-34 — Catálogo pnpm (`catalog:`) en la raíz del monorepo

**Estado:** pendiente.

## Contexto

[PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) menciona como **opcional** el uso de [pnpm catalogs](https://pnpm.io/catalogs) para reducir deriva futura entre workspaces. Este plan implementa esa capa de gobernanza **sin** sustituir la necesidad de alinear versiones en código ([PLAN-32](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md)).

## Objetivo

1. Definir en el `package.json` **raíz** un bloque `pnpm.catalog` (o equivalente documentado en la versión de pnpm del repo) con las dependencias más duplicadas (`typescript`, `react`, `zod`, `vitest`, etc.).
2. Migrar gradualmente los `package.json` de workspaces a sintaxis `catalog:` o `workspace:*` según aplique.
3. Documentar en [README.md](../../README.md) o [SYNC.md](./SYNC.md) cómo añadir una nueva entrada al catálogo.

## Alcance

- Solo **configuración pnpm** y referencias en manifests; los bumps de versión siguen siendo decisiones de [PLAN-32](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md).

## Criterios de éxito

- `pnpm install` en raíz sin errores.
- Al menos **N** paquetes del monorepo usando el catálogo para las deps acordadas (definir N con el equipo, p. ej. ≥5 workspaces o todas las apps).

## Checklist

- [ ] Versión de **pnpm** del repo verificada (soporte de catalogs según documentación).
- [ ] `catalog:` definido en raíz con lista inicial acordada.
- [ ] Migración de workspaces objetivo + prueba de install/build.
- [ ] Documentación breve para contribuidores.

## Referencias

- Documentación: https://pnpm.io/catalogs
