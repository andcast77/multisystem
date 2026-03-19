---
name: git-plan-workflow
description: >-
  Standardizes git workflow per plan in this repository. Use when the user asks
  to start or finish a plan, create plan branches, run commit/push after plan
  completion, or request merges to Test/master.
---

# Git Plan Workflow

Applies a strict workflow for plan-based work in this repository.

## When to Use
- User starts a new plan and needs a branch.
- User runs/builds a plan and needs a branch.
- User says the plan is finished.
- User asks for `git commit` and `git push`.
- User asks to merge into `Test`, `master`, or another target branch.

## Core Rules

- Always ask for explicit confirmation before running `git commit`, `git push`, or `merge`.
  - Plan branch creation/switching (fetch/checkout/branch create) is treated as required infrastructure for every plan build/run, so it proceeds automatically.
- Create the plan branch at plan execution start (including when running a plan build/run).
- Always start implementation on a NEW plan branch created from `Test`.
  - Never implement directly on `Test`.
  - Never reuse an old plan branch.
- Create plan branches from `Test`.
- Use branch naming format: `plan/<plan-slug>-run-<YYYYMMDD-HHmmss>`.
- At plan completion, ask confirmation before running commit/push.
- Before marking plan as completed, ensure the plan checklist is fully checked (`- [x]`).
- At plan completion, rename the repository plan document under `docs/plans/` to include `[completed]` prefix.
- Run merge only when the user explicitly requests it.
- Do not run destructive git operations.
- Do not modify git configuration.

## Workflow

### 1) Start Plan Branch

When a plan moves from planning to execution, including when running a plan build/run, run this step first.

1. Extract the plan name from user message or plan title.
   - Prefer the plan filename when available.
   - Handle both:
     - `*.plan.md` (use basename without `.plan.md`)
     - `docs/plans/PLAN-*.md` (use basename without `.md`, stripping optional leading `[completed] `)
2. Normalize to slug:
   - lowercase
   - spaces/underscores to `-`
   - remove unsupported characters
   - collapse repeated `-`
3. Create a unique plan branch name for this specific build/run:
   - Base: `plan/<slug>`
   - Recommended suffix: `-run-<YYYYMMDD-HHmmss>` (derived from local time)
   - Final example: `plan/<slug>-run-20260319-142530`
4. Create branch from `Test`:
   - `git fetch --all --prune`
   - `git checkout Test`
   - `git pull origin Test`
   - `git checkout -b <branchName>`

5. Never reuse an existing base `plan/<slug>` branch for builds:
   - Always generate a new suffix for each build/run.
   - If the generated branch name already exists (rare collision), regenerate using a new timestamp suffix.

### 2) Close Plan (Commit + Push with Confirmation)

When user indicates completion (examples: "finish", "finished", "completed"), follow:

1. Ensure checklist progress in the repository plan markdown (`docs/plans/...`) is complete:
   - Mark completed tasks as `- [x]`.
   - If any task remains unfinished, ask the user before checking it.
2. Ensure the plan document filename is prefixed with `[completed]` (for example: `[completed] PLAN-3-unify-apiclient.md`).
   - This rename is applied to the repository plan markdown under `docs/plans/` (not the local Cursor plan file under `.cursor/plans/`).
3. Review changes:
   - `git status`
   - `git diff` (and staged diff if needed)
4. Propose concise commit message aligned with repository style.
5. Ask explicit confirmation before executing:
   - `git add` relevant files
   - `git commit`
   - `git push -u origin HEAD` (if upstream missing) or `git push`
6. After execution, report key results (branch, commit hash, push target).

Never auto-commit/auto-push without user confirmation.

### 3) Merge Only by Explicit User Command

When user explicitly says merge (examples: "merge a Test", "merge a master"):

1. Confirm source branch (current plan branch created for this run, e.g. `plan/<slug>-run-...`, unless user says another).
2. Confirm destination branch requested by user (`Test`, `master`, or custom).
3. Ask explicit confirmation before executing the merge command.
4. Validate clean state and sync:
   - `git status`
   - update target branch from remote
5. Run merge command appropriate to request.
6. Report merge result and next step.

If there is ambiguity about source/target branch, ask before merging.

## Safety Guardrails

- Always consult the user before any side-effect git action (branch create/switch, commit, push, merge).
- Never merge, commit, or push implicitly.
- Never use force push unless user explicitly requests it.
- Never run destructive commands (`reset --hard`, branch deletion) unless explicitly requested.
- If conflicts or hook failures occur, stop and present options.

## Trigger Examples

- "Create branch for the token storage plan."
- "I finished the plan, commit and push."
- "done." (treat as plan-close signal, still ask confirmation before commit/push)
- "Merge to Test."
- "Merge to master."
