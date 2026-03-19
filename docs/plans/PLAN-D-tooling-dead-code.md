# Plan D — Tooling & dead-code hygiene

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §9 Knip, shopflow trees.

| Field | Detail |
|-------|--------|
| **Objective** | Trust Knip output; clarify shopflow entry tree. |
| **Risk addressed** | ~200 false-positive “unused” files without per-app Knip config; legacy `app/` vs `src/`. |
| **Parallel with** | Plan C. |

## Tasks

- [x] Add **per-app Knip config** (`knip.jsonc`) with correct entry discovery and scoped project boundaries.
  - `apps/hub/knip.jsonc`
  - `apps/shopflow/knip.jsonc`
  - `apps/techservices/knip.jsonc`
  - `apps/workify/knip.jsonc`
- [x] Re-run Knip and triage remaining unused files.
  - Root scripts added for convenience (unused files only): `pnpm run knip:hub|knip:shopflow|knip:techservices|knip:workify|knip:all`
  - Runs with `--production --include files` to focus on unused-file signal and avoid dependency-noise during dead-code hygiene.
- [x] **Shopflow:** declare canonical root and archive dead branch.
  - Archived `apps/shopflow/src/app/**` → `apps/shopflow/src/app-dead/**`
  - Updated `apps/shopflow/src/main.tsx` to import `./app-dead/globals.css`
  - Excluded `src/app-dead/**` from unused-file detection in `apps/shopflow/knip.jsonc`

## Definition of done

- [x] Knip runs with meaningful signal for unused files (`--production --include files`); suppressions (if any) documented in `knip.jsonc`.
- [x] One canonical shopflow entry tree; no ambiguous duplicate roots (`src/app-dead/**` is explicitly archived/excluded).
