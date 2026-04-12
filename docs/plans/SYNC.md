# Plan checklists — auto-update & synchronization

These rules keep **`docs/plans/PLAN-*.md`** accurate without duplicate checklists elsewhere.

## Canonical plans (`docs/plans/`)

- **All** engineering plans for this project are created under **`docs/plans/`** only.
- **Filenames are canonical** and include the plan number: **`PLAN-<number>-<short-slug>.md`** (optional leading `[completed] ` or `[cancelled] `). Same number identifies one plan; the slug describes the topic.
- IDE-only drafts (e.g. under `.cursor/plans/`) are **not** authoritative until the content exists as a `docs/plans/PLAN-*.md` file.

## Single source of truth

- Task checkboxes live **only** in `docs/plans/PLAN-*.md`.
- [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) **§17–§19** link here; they must **not** copy full task lists.

## When to check boxes (synchronized with code)

| Trigger | Action |
|---------|--------|
| A PR **implements** a plan task (fully done) | In the **same PR**, change that line to `- [x]` in the correct `PLAN-*.md`. |
| Work spans multiple PRs | Check the box only when the **last** PR completes the task; optional short note under the task (e.g. `<!-- PR #123 -->`). |
| Refactor / revert | Uncheck `- [ ]` if the codebase no longer satisfies the task. |
| New task added to a plan | Add `- [ ]` in the plan file; update audit §17 row only if themes change. |

## For humans & AI assistants (auto-update habit)

1. **Before closing a task:** Identify which plan(s) it maps to (1–6).
2. **In the same change set** as the code/docs fix: open that `PLAN-*.md` and mark completed items `[x]`.
3. If one change completes tasks in **multiple** plans (e.g. shared client touches Plan 3 and indirectly Plan 1), update **each** file’s relevant lines.
4. **Do not** leave plans stale: if the repo already satisfies a checkbox but the box is empty, mark it `[x]` in a small “sync” commit or include it in the next related PR.

## pnpm workspace catalog

The monorepo pins shared dependency versions in **`pnpm-workspace.yaml`** under `catalog:` (not duplicated in the root `package.json`). Workspaces reference them with `"packageName": "catalog:"` in their own `package.json`.

**To add a new cataloged dependency:**

1. Add `packageName: x.y.z` under `catalog:` in [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) (keep alphabetical order if the file is ordered that way).
2. In the workspace that needs it, add `"packageName": "catalog:"` under `dependencies` / `devDependencies` / `peerDependencies` as appropriate.
3. Run `pnpm install` from the repository root and commit the updated lockfile if it changes.

Version bumps across the repo follow dependency-alignment discipline (see [PLAN-32](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md)); the catalog is the single place those pinned versions live for shared packages.

## Cross-plan overlap

- **Plan 1** (auth) and **Plan 2** (CORS) are independent files—update both if one feature touches both (e.g. BFF affects cookies and origins).
- **Plan 3** + **Plan 4** often land in different PRs; sync each file separately.

## Verification (optional periodic check)

- Review open `[ ]` items against the codebase before a release.
- When **Definition of done** for a whole plan is met, consider adding a one-line status at the top of that plan file: `**Status:** Done YYYY-MM-DD` (optional).

## Git workflow for plans

Use when moving from planning to implementation (same intent as any local Cursor git-plan rules):

1. **Branch from `Test`.** Never implement directly on `Test` or reuse an old plan branch for a new run.
2. **Branch name:** `plan/<slug>-run-<YYYYMMDD-HHmmss>` (local time). The `slug` comes from the plan filename: basename without `.md`, strip an optional `[completed] ` / `[cancelled] ` prefix, lowercase, normalize to URL-safe segments (e.g. `PLAN-30-ws-to-sse.md` → `plan-30-ws-to-sse`).
3. **Commands (typical):** `git fetch --all --prune` → `git checkout Test` → `git pull origin Test` → `git checkout -b <branchName>`.

## Cursor (`.cursor/`) vs `docs/plans/`

- **Cursor loads agent rules from [`.cursor/rules/*.mdc`](../../.cursor/rules/)** — those files **are** part of the repo (only stray paths under `.cursor/` stay gitignored).
- **Plan documents and checklists** stay in **`docs/plans/PLAN-*.md`**: long-form specs, PR review, history. Do **not** duplicate full plan bodies into `.cursor/`; the rules there should **point here** for naming, sync, and git workflow.
- **Ephemeral IDE plans** (e.g. `.cursor/plans/*.plan.md`) remain local-only unless copied into `docs/plans/`.
