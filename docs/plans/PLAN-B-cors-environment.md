# Plan B — CORS & environment alignment

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §11 CORS.

| Field | Detail |
|-------|--------|
| **Objective** | Single source of truth for allowed browser origins (all app ports). |
| **Risk addressed** | Default origins missing hub (`3001`); misconfig blocks users or invites overly permissive fixes. |
| **Priority** | **First** — quick win for local and staged multi-app setups. |

## Tasks

- [ ] List all dev origins (hub, shopflow, workify, techservices) in **root README** and each app’s **`env.example`**.
- [ ] Align Fastify CORS config with that list; add comment in API env pointing to README.
- [ ] Add checklist item for **new app port** → update CORS + docs (README template or CONTRIBUTING).

## Definition of done

- New developer can start all apps without CORS surprises.
- Docs and code defaults match; onboarding mentions where to change origins.
