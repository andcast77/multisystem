# Implementation plans

Working copies of engineering implementation plans. Source context: [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §17–19.

| Order | Plan | File |
|-------|------|------|
| 1 (first) | [completed] 2 — CORS & environment | [\[completed\] PLAN-2-cors-environment.md](./[completed]%20PLAN-2-cors-environment.md) |
| 2 | [completed] 1 — Security & auth | [\[completed\] PLAN-1-security-auth-hardening.md](./[completed]%20PLAN-1-security-auth-hardening.md) |
| 3 (parallel) | 3 — Unify ApiClient | [PLAN-3-unify-apiclient.md](./PLAN-3-unify-apiclient.md) |
| 3 (parallel) | [completed] 4 — Tooling & dead code | [\[completed\] PLAN-4-tooling-dead-code.md](./[completed]%20PLAN-4-tooling-dead-code.md) |
| ongoing | 6 — Performance | [PLAN-6-performance-followups.md](./PLAN-6-performance-followups.md) |
| done | [completed] 5 — API modularization | [\[completed\] PLAN-5-api-modularization.md](./[completed]%20PLAN-5-api-modularization.md) |
| ongoing | 7 — Re-audit Task 1: Users Authorization | [PLAN-7-reaudit-task-1-users-authorization.md](./PLAN-7-reaudit-task-1-users-authorization.md) |
| ongoing | 8 — Re-audit Task 2: Shopflow Tenant Isolation | [PLAN-8-reaudit-task-2-shopflow-tenant-isolation.md](./PLAN-8-reaudit-task-2-shopflow-tenant-isolation.md) |
| ongoing | 9 — Re-audit Task 3: Repository Layer Adoption | [PLAN-9-reaudit-task-3-repository-layer-adoption.md](./PLAN-9-reaudit-task-3-repository-layer-adoption.md) |
| ongoing | 10 — Re-audit Task 4: Authorization Policy Centralization | [PLAN-10-reaudit-task-4-authorization-policy-centralization.md](./PLAN-10-reaudit-task-4-authorization-policy-centralization.md) |
| ongoing | 11 — Re-audit Task 5: Standardize Frontend API Usage | [PLAN-11-reaudit-task-5-frontend-api-usage.md](./PLAN-11-reaudit-task-5-frontend-api-usage.md) |
| ongoing | 12 — Re-audit Task 6: Env Configuration | [PLAN-12-reaudit-task-6-env-configuration.md](./PLAN-12-reaudit-task-6-env-configuration.md) |

## Execution status (reality)

- Recommended historical order remains: `2 -> 1 -> (3 + 4) -> 6`, with `5` optional/done.
- Actual execution completed: `1 -> 2` (both completed, no regressions after CORS alignment).
- Effective remaining focus: `3` (optional docs path) + `4` (done) in parallel context, `6` ongoing.

## Syncing checklists

**Always keep plan files aligned with reality:** when work completes a task, check the box in the matching `PLAN-*.md` in the **same PR/commit** as the code change.

Full rules (single source of truth, multi-plan updates, AI workflow): **[SYNC.md](./SYNC.md)**.
