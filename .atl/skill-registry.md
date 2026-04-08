# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol (if present in your tooling).

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| creating GitHub issue, bug, feature | issue-creation | `C:\Users\Andre\.cursor\skills\issue-creation\SKILL.md` |
| creating PR, opening PR, preparing for review | branch-pr | `C:\Users\Andre\.cursor\skills\branch-pr\SKILL.md` |
| create new skill, add agent instructions | skill-creator | `C:\Users\Andre\.cursor\skills\skill-creator\SKILL.md` |
| Go tests, teatest, Bubbletea | go-testing | `C:\Users\Andre\.cursor\skills\go-testing\SKILL.md` |
| judgment day, dual review, juzgar | judgment-day | `C:\Users\Andre\.cursor\skills\judgment-day\SKILL.md` |
| REST endpoints, controllers, services | api-architecture | `D:\Projects\multisystem\.cursor\skills\api-architecture\SKILL.md` |
| logging, health, readiness, request tracing | api-observability-baseline | `D:\Projects\multisystem\.cursor\skills\api-observability-baseline\SKILL.md` |
| JWT, RBAC, tenant access | auth-jwt-roles | `D:\Projects\multisystem\.cursor\skills\auth-jwt-roles\SKILL.md` |
| tenant isolation, companyId scoping | multi-tenant-architecture | `D:\Projects\multisystem\.cursor\skills\multi-tenant-architecture\SKILL.md` |
| Prisma schema, queries, migrations | prisma-database-expert | `D:\Projects\multisystem\.cursor\skills\prisma-database-expert\SKILL.md` |
| plan branches, commit, merge Test/master | git-plan-workflow | `D:\Projects\multisystem\.cursor\skills\git-plan-workflow\SKILL.md` |
| where to save project skills | local-skills-location | `D:\Projects\multisystem\.cursor\skills\local-skills-location\SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### issue-creation
- Use a repo issue template; blank issues disabled where enforced by upstream workflow
- Link duplicates search before filing
- Questions belong in Discussions, not issues, when the upstream project uses that split

### branch-pr
- PRs should link an approved issue when the target repo enforces issue-first workflow
- Branch naming: `type/description` with types like feat, fix, chore (lowercase, no spaces)
- PR body must include linked issue line and one type label when required by template

### skill-creator
- Put `SKILL.md` with YAML frontmatter (`name`, `description` + Trigger) at skill root
- Prefer `assets/` for templates/schemas; `references/` for pointers to existing docs
- Naming: `technology`, `project-component`, or `action-target` patterns

### go-testing
- Prefer table-driven tests with `t.Run` per case
- For Bubbletea: test `Model.Update` transitions; use teatest for interactive flows
- Golden files: update with intent; fail on unexpected drift

### judgment-day
- Resolve skills from this registry first; inject identical `Project Standards` into both judges
- Run two blind judges in parallel; synthesize Confirmed / Suspect / Contradiction
- Classify warnings as real vs theoretical; fix CRITICALs and real WARNINGs before re-judge

### api-architecture
- Controller: validate DTOs, call services/policy only, no business logic
- Service: business rules only; no HTTP envelopes (`success`/`data` transport shape)
- Repository: DB only; tenant filters on all tenant-owned queries
- Responses: `{ success, data, message, code? }`; map errors to HTTP without leaking internals

### api-observability-baseline
- Every request gets `requestId`; propagate to logs and error context
- Structured logs: `requestId`, route/module, status, duration; never secrets or full PII
- Readiness checks must validate DB (and other critical deps), not only process up

### auth-jwt-roles
- JWT from env secret; payload includes user id, company scope, roles; no passwords in token
- Enforce authz at policy/guard before service logic; pair role checks with company scope
- 401 unauthenticated; 403 authenticated but forbidden; hash passwords (bcrypt/Argon2)

### multi-tenant-architecture
- Every tenant-owned query includes company/tenant key in `WHERE`
- Prove membership before acting; never rely on resource id alone
- No null/global tenant fallback paths for tenant-owned data

### prisma-database-expert
- Normalize; explicit relations and join tables for M2M; index tenant + FK + filter columns
- Use `select`/`include` deliberately; paginate lists; avoid N+1
- Review migration SQL; `prisma validate` before risky deploys

### git-plan-workflow
- New plan work: branch `plan/<slug>-run-<YYYYMMDD-HHmmss>` from `Test`, unique per run
- Confirm before `git commit`, `git push`, merge
- Plan close: checkboxes in `docs/plans/`, `[completed]` rename when required, then commit with confirmation

### local-skills-location
- Project skills: `.cursor/skills/<name>/SKILL.md` in repo root
- Personal skills: `%USERPROFILE%\.cursor\skills\`; do not edit `.cursor\skills-cursor\` internals

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | `D:\Projects\multisystem\AGENTS.md` | Present (empty); optional agent instructions |
| Cursor rules | `.cursor/rules/*.mdc` | Workspace rules (may be gitignored locally) |

Read the convention files listed above for project-specific patterns and rules.
