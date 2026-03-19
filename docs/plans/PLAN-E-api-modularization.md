# Plan E — API modularization (optional)

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §13 Scalability, §14 Medium debt, §18 ideal architecture.

| Field | Detail |
|-------|--------|
| **Objective** | Logical split of Fastify routes before any physical microservices. |
| **Risk addressed** | Single deployable blast radius; growing controller/service surface. |
| **When** | After API churn justifies structure investment; not required for MVP behavior. |

## Tasks

- [ ] Sketch Fastify **plugins** per domain: `auth`, `shopflow`, `workify`, `techservices`, shared `core/`.
- [ ] Move routes incrementally; keep **one** deployable entry.
- [ ] Document path to separate deployables / gateway (audit §18 diagram) if needed later.

## Definition of done

- Clear module boundaries in `packages/api` folder structure.
- No required behavior change for consumers; registration order documented.
