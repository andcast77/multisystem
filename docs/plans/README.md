# Implementation plans

Working copies of engineering implementation plans. Source context: [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §17–19.

| Order | Plan | File |
|-------|------|------|
| 1 (first) | B — CORS & environment | [PLAN-B-cors-environment.md](./PLAN-B-cors-environment.md) |
| 2 | A — Security & auth | [PLAN-A-security-auth-hardening.md](./PLAN-A-security-auth-hardening.md) |
| 3 (parallel) | C — Unify ApiClient | [PLAN-C-unify-apiclient.md](./PLAN-C-unify-apiclient.md) |
| 3 (parallel) | D — Tooling & dead code | [PLAN-D-tooling-dead-code.md](./PLAN-D-tooling-dead-code.md) |
| ongoing | F — Performance | [PLAN-F-performance-followups.md](./PLAN-F-performance-followups.md) |
| done | E — API modularization | [PLAN-E-api-modularization.md](./PLAN-E-api-modularization.md) |

## Execution status (reality)

- Recommended historical order remains: `B -> A -> (C + D) -> F`, with `E` optional/done.
- Actual execution completed: `A -> B` (both completed, no regressions after CORS alignment).
- Effective remaining focus: `C` (optional docs path) + `D` (done) in parallel context, `F` ongoing.

## Syncing checklists

**Always keep plan files aligned with reality:** when work completes a task, check the box in the matching `PLAN-*.md` in the **same PR/commit** as the code change.

Full rules (single source of truth, multi-plan updates, AI workflow): **[SYNC.md](./SYNC.md)**.
