# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do not read this registry or individual `SKILL.md` files unless the orchestrator falls back to the registry path.

See `C:\Users\Andre\.cursor\skills\_shared\skill-resolver.md` (if present) for the full resolution protocol.

## User Skills

Scanned: `D:\Projects\multisystem\.cursor\skills\` (project) and `C:\Users\Andre\.cursor\skills\` (user). Project-level skills override duplicates. `sdd-*`, `_shared`, and `skill-registry` are omitted from this table; SDD skills are documented below.

| Trigger | Skill | Path |
|---------|-------|------|
| creating or modifying REST endpoints, controllers, services, validation, or database access patterns | api-architecture | `D:\Projects\multisystem\.cursor\skills\api-architecture\SKILL.md` |
| changing request handling, logging, error mapping, health/readiness checks, or runtime diagnostics in the API | api-observability-baseline | `D:\Projects\multisystem\.cursor\skills\api-observability-baseline\SKILL.md` |
| implementing login/register, protecting routes, JWT payloads, roles and permissions, or validating resource access in a tenant-scoped API | auth-jwt-roles | `D:\Projects\multisystem\.cursor\skills\auth-jwt-roles\SKILL.md` |
| user asks to start or finish a plan, create plan branches, run commit/push after plan completion, or request merges to Test/master | git-plan-workflow | `D:\Projects\multisystem\.cursor\skills\git-plan-workflow\SKILL.md` |
| creating, editing, or locating skills for multisystem, or when the user asks where to save a local skill | local-skills-location | `D:\Projects\multisystem\.cursor\skills\local-skills-location\SKILL.md` |
| writing queries, company-scoped APIs, authz, schemas, or any code that could leak data across tenants | multi-tenant-architecture | `D:\Projects\multisystem\.cursor\skills\multi-tenant-architecture\SKILL.md` |
| editing Prisma schema, designing relationships, writing Prisma queries, or reviewing DB performance | prisma-database-expert | `D:\Projects\multisystem\.cursor\skills\prisma-database-expert\SKILL.md` |
| creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | `C:\Users\Andre\.cursor\skills\issue-creation\SKILL.md` |
| creating a pull request, opening a PR, or preparing changes for review | branch-pr | `C:\Users\Andre\.cursor\skills\branch-pr\SKILL.md` |
| user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | `C:\Users\Andre\.cursor\skills\skill-creator\SKILL.md` |
| writing Go tests, using teatest, or adding test coverage | go-testing | `C:\Users\Andre\.cursor\skills\go-testing\SKILL.md` |
| judgment day, judgment-day, review adversarial, dual review, doble review, juzgar, que lo juzguen | judgment-day | `C:\Users\Andre\.cursor\skills\judgment-day\SKILL.md` |

## SDD workflow skills (not in main table)

Spec-Driven Development phase skills from Gentle AI live under **`C:\Users\Andre\.cursor\skills\`**: `sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `sdd-onboard`. Shared phase text: **`C:\Users\Andre\.cursor\skills\_shared\`**. Repository artifacts: `openspec/` (see `openspec/config.yaml`).

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### api-architecture
- Layer as Controller (HTTP/DTO) → Policy/Authorization → Service (business rules, no transport envelopes) → Repository (DB only; tenant filters on tenant-owned data).
- Policy: authn/authz and scope; deny by default; no DB writes or response shaping in policy.
- Success/error envelope: `success`, `data`, `message`, optional `code`; map HTTP status codes; never leak stacks/SQL/internal errors.
- No nullable/global tenant fallbacks for tenant-owned resources.
- Source: `.cursor/rules/api-architecture.mdc`; precedence: `.cursor/rules/architecture-governance.mdc`.

### api-observability-baseline
- Every request: `requestId` (or equivalent); propagate correlation IDs; include request ID in structured errors/logs.
- Structured logs: key-value fields; include route/module, status/result, duration; never log secrets/tokens/passwords/sensitive PII.
- Health + readiness; readiness checks real dependencies (e.g. DB), not only process up.
- Preserve machine-readable error codes; triage-friendly server-side context only.
- Source: `.cursor/rules/api-observability-baseline.mdc`.

### auth-jwt-roles
- JWT signed with env secret; payload: stable user id, tenant/company scope, roles; expiration/refresh as designed; never secrets/passwords/full PII in JWT.
- RBAC at policy/guard (preferred) or service for sensitive ops; validate role + tenant scope before business logic; `/api/users*` needs strong policy, not auth-only.
- Passwords: hash (bcrypt/Argon2); never store plaintext.
- Multi-tenant: membership + matching company/tenant on resource; never access another tenant by ID alone.
- Errors: 401 unauthenticated, 403 authenticated but forbidden.

### git-plan-workflow
- Canonical plans only in `docs/plans/` as `PLAN-<n>-<slug>.md`; not `.cursor/plans/` scratch as source of truth.
- New plan work: branch `plan/<slug>-run-<YYYYMMDD-HHmmss>` from `Test` (fetch/pull first); never implement on `Test`; never reuse an old plan branch.
- Commit/push/merge only after explicit user confirmation; no destructive git ops; do not change git config.
- On close: checklist complete, rename plan to `[completed] ...` in `docs/plans/` when done.

### local-skills-location
- Project skills: `.cursor/skills/<name>/SKILL.md` at repo root; personal: `%USERPROFILE%\.cursor\skills\`.
- Do not author skills under `%USERPROFILE%\.cursor\skills-cursor\` (Cursor internal).

### multi-tenant-architecture
- Scope all tenant-owned data by tenant key (here: `companyId`) in models, queries, and mutations; no cross-tenant access by ID alone.
- Resolve tenant context before reads/writes; validate user belongs to tenant and resource belongs to tenant.
- Enforce at policy and repository/query boundaries; high-risk domains need cross-boundary regression tests.
- Indexes on tenant key + common filters; ask if boundaries unclear.
- Source: `.cursor/rules/multi-tenant-architecture.mdc`.

### prisma-database-expert
- Normalize; explicit relations and M2M join tables; minimize nulls; indexes on scope + FKs + filter/sort columns.
- Queries: intentional `select`/`include`; avoid N+1; paginate lists; tenant/company filters on tenant-owned data; prefer repositories for high-risk domains.
- Migrations: review SQL; `prisma validate`; test risky changes outside prod first.
- Schema root: `packages/database/prisma/`; see `packages/database/prisma/PRISMA_SCHEMA_SPLIT.md` when splitting files.
- Source: `.cursor/rules/prisma-database-expert.mdc`.

### issue-creation
- Follow Agent Teams Lite issue-first workflow: clear title, repro steps for bugs, acceptance criteria for features; link to enforcement system conventions in the skill when applicable.

### branch-pr
- Follow Agent Teams Lite PR workflow: associate with issue where required; describe changes, testing, and risk; use templates/checklists from the skill when present.

### skill-creator
- New skills: Agent Skills spec layout (`SKILL.md` frontmatter); triggers in description; focused instructions; avoid bloated examples.

### go-testing
- Go tests and Bubbletea/teatest patterns for Gentleman.Dots; not the primary stack for multisystem (TypeScript/Vitest here) unless editing Go code.

### judgment-day
- Dual blind review protocol: two judges, synthesize, fix, re-judge; max two iterations then escalate; use only when user invokes the trigger phrases.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | `D:\Projects\multisystem\AGENTS.md` | Index — where rules, SDD, skills, and plans live |
| Cursor rules (auto-loaded) | `D:\Projects\multisystem\.cursor\rules\*.mdc` | Versioned; includes architecture, auth, multi-tenant, Prisma, API, SDD, git plan workflow, etc. |
| Frontend / UI rule (example) | `D:\Projects\multisystem\.cursor\rules\frontend-design-system.mdc` | Referenced from AGENTS.md for UI/Tailwind/`@multisystem/ui` |
| SDD rule | `D:\Projects\multisystem\.cursor\rules\spec-driven-development-sdd.mdc` | SDD flow; pairs with `openspec/` |
| OpenSpec | `D:\Projects\multisystem\openspec\` | SDD artifacts and `config.yaml` |
| OpenSpec config | `D:\Projects\multisystem\openspec\config.yaml` | strict_tdd, testing cache, phase rules |
| Project skills | `D:\Projects\multisystem\.cursor\skills\` | Repo-local agent skills |
| Plans | `D:\Projects\multisystem\docs\plans\` | Canonical `PLAN-*` markdown and checklists |
| Plans sync | `D:\Projects\multisystem\docs\plans\SYNC.md` | Conventions and numbering |

Read the convention files above for full detail. Scratch plans under `.cursor/plans/` are not canonical per AGENTS.md.
