# Plan F — Performance follow-ups

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §12 Performance.


| Field              | Detail                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| **Objective**      | Reduce tail latency and oversized responses as usage grows.                  |
| **Risk addressed** | Large lists without virtualization; uncapped pagination; heavy JSON exports. |
| **Cadence**        | Ongoing / per-sprint spot checks.                                            |


## Tasks

- Audit list/report endpoints for **pagination caps** and default page sizes.
- POS/report UIs: add **virtualization** where lists are large (spot-check per screen).
- Heavy exports: consider **async jobs + download link** or streaming.

## Definition of done

- No unbounded list endpoints without explicit “admin/export” justification.
- Largest UIs reviewed; biggest export paths have a documented scaling path.

