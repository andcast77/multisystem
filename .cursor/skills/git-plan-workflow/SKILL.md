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
- User says the plan is finished.
- User asks for `git commit` and `git push`.
- User asks to merge into `Test`, `master`, or another target branch.

## Core Rules

- Always ask for explicit confirmation before running any git command with side effects.
- Create the plan branch at plan execution start.
- Create plan branches from `Test`.
- Use branch naming format: `plan/<plan-slug>`.
- At plan completion, ask confirmation before running commit/push.
- At plan completion, rename the plan file to include `[completed]` prefix.
- Run merge only when the user explicitly requests it.
- Do not run destructive git operations.
- Do not modify git configuration.

## Workflow

### 1) Start Plan Branch

When a plan moves from planning to execution, run this step first.

1. Extract the plan name from user message or plan title.
2. Normalize to slug:
   - lowercase
   - spaces/underscores to `-`
   - remove unsupported characters
   - collapse repeated `-`
3. Ask explicit confirmation before creating/updating branch context.
4. Create branch from `Test`:
   - `git fetch --all --prune`
   - `git checkout Test`
   - `git pull origin Test`
   - `git checkout -b plan/<slug>`

If the branch already exists, ask whether to reuse it or create a new slug.

### 2) Close Plan (Commit + Push with Confirmation)

When user indicates completion (examples: "finish", "finished", "completed"), follow:

1. Ensure the plan document filename is prefixed with `[completed]` (for example: `[completed] PLAN-3-unify-apiclient.md`).
2. Review changes:
   - `git status`
   - `git diff` (and staged diff if needed)
3. Propose concise commit message aligned with repository style.
4. Ask explicit confirmation before executing:
   - `git add` relevant files
   - `git commit`
   - `git push -u origin HEAD` (if upstream missing) or `git push`
5. After execution, report key results (branch, commit hash, push target).

Never auto-commit/auto-push without user confirmation.

### 3) Merge Only by Explicit User Command

When user explicitly says merge (examples: "merge a Test", "merge a master"):

1. Confirm source branch (current `plan/<slug>` unless user says another).
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
