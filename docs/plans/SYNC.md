# Plan checklists — auto-update & synchronization

These rules keep **`docs/plans/PLAN-*.md`** accurate without duplicate checklists elsewhere.

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

## Cross-plan overlap

- **Plan 1** (auth) and **Plan 2** (CORS) are independent files—update both if one feature touches both (e.g. BFF affects cookies and origins).
- **Plan 3** + **Plan 4** often land in different PRs; sync each file separately.

## Verification (optional periodic check)

- Review open `[ ]` items against the codebase before a release.
- When **Definition of done** for a whole plan is met, consider adding a one-line status at the top of that plan file: `**Status:** Done YYYY-MM-DD` (optional).
