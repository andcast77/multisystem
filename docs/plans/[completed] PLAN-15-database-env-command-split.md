# PLAN-15 - Database Env Command Split

## Goal
Implement a strict command contract in `packages/database`:
- Standard command (no suffix) => production (Neon)
- `:dev` command => local Docker

This applies to migrations and all database operational commands (seed/reset/erase-like operations, push, studio, etc.).

## Implementation Approach

### 1) Define explicit env vars for both targets
- Update `packages/database/.env.example` and README docs to establish canonical variables:
  - `DATABASE_URL_LOCAL` (Docker/local)
  - `DIRECT_URL_LOCAL` (optional local direct)
  - `DATABASE_URL_PROD` (Neon pooled)
  - `DIRECT_URL_PROD` (Neon direct)

### 2) Centralize target resolution in Prisma config
- Refactor `packages/database/prisma.config.ts` to resolve URL from a single command target variable:
  - `DB_TARGET=dev` => local URLs only
  - `DB_TARGET=prod` (default for standard commands) => prod URLs only
- Hard rules:
  - `dev` never falls back to prod vars
  - `prod` never falls back to local vars
  - fail fast with clear error if selected target vars are missing

### 3) Rework npm scripts with consistent naming
- In `packages/database/package.json`, provide paired command surface:
  - Standard/prod: `migrate`, `migrate:deploy`, `db:push`, `db:seed`, `studio`, `db:reset`, `db:erase`
  - Dev/local: `migrate:dev`, `migrate:deploy:dev`, `db:push:dev`, `db:seed:dev`, `studio:dev`, `db:reset:dev`, `db:erase:dev`
- Each script sets `DB_TARGET` explicitly via `cross-env`.

### 4) Route seed/reset/erase behavior through target vars
- Adjust runtime scripts (starting with `packages/database/prisma/seed.ts`) to use URL resolution by `DB_TARGET` instead of raw `DATABASE_URL`.

### 5) Documentation and usage contract
- Update `packages/database/README.md`:
  - command -> environment -> required vars mapping
  - warnings for destructive prod commands
  - local dev vs production examples

## Validation
- Verify script-level mapping by dry-running env resolution where possible.
- Confirm:
  - `db:seed:dev` routes to local
  - `db:seed` routes to production
- Confirm explicit failure when required target vars are missing.

## Checklist
- [x] Audit all current database scripts and classify them by target.
- [x] Implement strict `DB_TARGET` URL resolution in Prisma config.
- [x] Update package scripts with deterministic prod/default and `:dev` local behavior.
- [x] Align seed/reset/erase flows with `DB_TARGET`.
- [x] Update `.env.example` and README with the new contract.
- [x] Validate routing behavior and missing-variable failure cases.
