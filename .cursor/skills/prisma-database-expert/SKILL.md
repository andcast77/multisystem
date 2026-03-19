---
name: prisma-database-expert
description: >-
  Guides Prisma schema design, relations, migrations, and query patterns for
  normalization, performance, and scale. Use when editing Prisma schema,
  designing relationships, writing Prisma queries, or reviewing DB performance.
---

# Prisma Database Expert Skill

Ensures a robust, optimized, and scalable database design using Prisma.

## When to Use

- Creating or editing Prisma schema
- Designing relationships
- Writing database queries
- Reviewing performance issues

## Instructions

- **Normalization**: avoid duplicated data; separate entities correctly; don’t denormalize without a clear read-path reason.

- **Relationships**: model one-to-many and many-to-many explicitly; use join tables for M2M; prefer explicit `@relation` fields and names.

- **Always consider**: primary keys, foreign keys, and indexes on lookup/join columns.

- **Nullability**: minimize nullable fields; use optional only when the domain truly allows absence.

- **Naming**: clear, consistent, aligned with the rest of the schema (camelCase in Prisma models per project convention).

- **Queries**:
  - Use `select` / `include` intentionally to limit payload
  - Avoid N+1 (batch with `include`, `findMany` + map, or filtered relation queries)
  - Use pagination for list endpoints (`skip`/`take` or cursor-based when appropriate)

- **Indexes**: tenant/company scope + FKs + columns used in `where` / `orderBy` / joins; document composite indexes when filters combine fields.

- **Migrations**: review generated SQL; validate with `prisma validate` / migrate in non-prod first when risky.

- **Ambiguity**: if the model boundary or cardinality is unclear, ask before implementing.

- **Prefer explicit relations** over magic implicit links.

## Multisystem (este repo)

- Schema y migraciones viven en **`packages/database/prisma/`** (CLI desde ese paquete o como indique el README del monorepo).
- Datos multi-empresa: indexar y filtrar por **`companyId`** (u otra clave de aislamiento del dominio) donde aplique.
- Split multi-archivo de schema: ver **`packages/database/prisma/PRISMA_SCHEMA_SPLIT.md`** si se trabaja en reorganización por dominio.
