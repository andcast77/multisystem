# Plan D — Tooling & dead-code hygiene

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §9 Knip, shopflow trees.

| Field | Detail |
|-------|--------|
| **Objective** | Trust Knip output; clarify shopflow entry tree. |
| **Risk addressed** | ~200 false-positive “unused” files without per-app Knip config; legacy `app/` vs `src/`. |
| **Parallel with** | Plan C. |

## Tasks

- [ ] Add **`knip.json` (or equivalent) per app** with correct Vite/Next entry + route globs.
- [ ] Re-run Knip; triage remaining unused files (delete or justify with inline comment / suppression).
- [ ] **Shopflow:** declare canonical root (`src/` vs `app/`); remove or archive dead branch.

## Definition of done

- Knip runs with meaningful signal; remaining suppressions documented.
- One canonical shopflow entry tree; no ambiguous duplicate roots.
