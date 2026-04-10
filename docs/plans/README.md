# Implementation plans

**Canonical location:** every plan document for this repo lives **here** (`docs/plans/`), not only in IDE scratch paths. **Naming:** `PLAN-<number>-<short-slug>.md` (see [`SYNC.md`](./SYNC.md)); optional `[completed] ` / `[cancelled] ` prefix when applicable.

**Cursor:** agent rules live in [`.cursor/rules/`](../.cursor/rules/) (versioned). **Plan markdown** lives **here** (`docs/plans/`); see [SYNC.md](./SYNC.md) for how the two fit together.

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

## Product capability plans (PLAN-17 → PLAN-22)

Planes orientados a cumplir los claims de producto del landing page. Origen: auditoría técnica de abril 2026.

| Plan | Claim que respalda | Dependencias |
|------|--------------------|--------------|
| [17 — Real-time Layer](./PLAN-17-realtime-layer.md) | Datos en tiempo real · Colaboración total | — |
| [18 — RBAC Unificado](./PLAN-18-rbac-unificado.md) | Colaboración total · Roles granulares por módulo | — |
| [19 — Enterprise Audit Log](./PLAN-19-enterprise-audit-log.md) | Seguridad empresarial | PLAN-18 (permisos de consulta) |
| [20 — Automation Job Runner](./PLAN-20-automation-job-runner.md) | Velocidad operativa · Automatización | — |
| [21 — Field-level Encryption](./PLAN-21-field-level-encryption.md) | Seguridad empresarial · Encriptación nivel bancario | — |
| [22 — Compliance Program](./PLAN-22-compliance-program.md) | Seguridad empresarial · Estándares internacionales | PLAN-19, PLAN-21 |
| [23 — UX: Cero Fricción](./PLAN-23-ux-zero-friction.md) | Velocidad operativa · Interfaz cero fricción | PLAN-17 (notif. SSE) |
| [24 — MFA / TOTP](./PLAN-24-mfa-totp.md) | Seguridad empresarial · Nivel bancario | PLAN-21, PLAN-19 |
| [25 — Dashboard Data Completeness](./[completed]%20PLAN-25-dashboard-data-completeness.md) | Datos en tiempo real · Información concreta | PLAN-17 |
| [26 — Auth Session Hardening](./[completed]%20PLAN-26-auth-session-hardening.md) | Seguridad empresarial · Nivel bancario | PLAN-19 |

Orden de ejecución recomendado: `(17 + 18 + 20 + 23 + 25)` en paralelo → `(19 + 21 + 24 + 26)` → `22`.

### Nota sobre PLAN-6
El archivo `[completed] PLAN-6-performance-followups.md` tiene el prefijo `[completed]` pero contiene **2 ítems sin completar**:
- Virtualización de listas grandes en POS/reportes ([ ] línea 26).
- Exports async: jobs + download link ([ ] línea 27) — parcialmente cubierto por el servicio de export jobs existente, pero no marcado como hecho.

Estos ítems deben completarse o descartarse explícitamente antes de considerar PLAN-6 cerrado.

## Execution status (reality)

- Recommended historical order remains: `2 -> 1 -> (3 + 4) -> 6`, with `5` optional/done.
- Actual execution completed: `1 -> 2` (both completed, no regressions after CORS alignment).
- Effective remaining focus: `3` (optional docs path) + `4` (done) in parallel context, `6` ongoing.
- Product capability plans (17–22): pending execution.

## Infraestructura / realtime API

| Plan | Tema | File |
|------|------|------|
| 30 | WebSocket → SSE (presencia; Vercel) | [\[completed\] PLAN-30-ws-to-sse.md](./%5Bcompleted%5D%20PLAN-30-ws-to-sse.md) |
| 31 | [completed] Shopflow → Next.js + sincronización de dependencias (monorepo) | [\[completed\] PLAN-31-shopflow-next-migration.md](./[completed]%20PLAN-31-shopflow-next-migration.md) |
| — | *(cancelado)* API en Railway | [\[cancelled\] PLAN-30-api-railway.md](./%5Bcancelled%5D%20PLAN-30-api-railway.md) |

## Seguimiento PLAN-31 (planes derivados)

Tras **[PLAN-31](./%5Bcompleted%5D%20PLAN-31-shopflow-next-migration.md) (completado)**, el seguimiento operativo sigue en:

| Plan | Tema | File |
|------|------|------|
| 32 | [completed] Alineación sistemática de dependencias (`pnpm outdated`, semver único) | [\[completed\] PLAN-32-monorepo-dependency-alignment.md](./%5Bcompleted%5D%20PLAN-32-monorepo-dependency-alignment.md) |
| 33 | [completed] Refinamiento Tailwind / tokens (post–alineación monorepo) | [\[completed\] PLAN-33-tailwind-v4-hub-techservices.md](./%5Bcompleted%5D%20PLAN-33-tailwind-v4-hub-techservices.md) |
| 34 | [completed] Catálogo pnpm (`catalog:`) | [\[completed\] PLAN-34-pnpm-catalog.md](./%5Bcompleted%5D%20PLAN-34-pnpm-catalog.md) |
| 35 | `@multisystem/ui`: tooling + bundler opcional | [PLAN-35-component-library-tooling-alignment.md](./PLAN-35-component-library-tooling-alignment.md) |
| 36 | Shopflow: service worker / push — verificar o documentar | [PLAN-36-shopflow-service-worker-push.md](./PLAN-36-shopflow-service-worker-push.md) |
| 37 | Shopflow: verificación manual y smoke | [PLAN-37-shopflow-manual-qa-smoke.md](./PLAN-37-shopflow-manual-qa-smoke.md) |

## Syncing checklists

**Always keep plan files aligned with reality:** when work completes a task, check the box in the matching `PLAN-*.md` in the **same PR/commit** as the code change.

Full rules (single source of truth, multi-plan updates, AI workflow): **[SYNC.md](./SYNC.md)**.
