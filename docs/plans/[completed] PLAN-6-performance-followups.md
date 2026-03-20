# Plan 6 — Performance follow-ups

**Audit refs:** [ENGINEERING_AUDIT_REPORT.md](../ENGINEERING_AUDIT_REPORT.md) §12 Performance.


| Field              | Detail                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| **Objective**      | Reduce tail latency and oversized responses as usage grows.                  |
| **Risk addressed** | Large lists without virtualization; uncapped pagination; heavy JSON exports. |
| **Cadence**        | Ongoing / per-sprint spot checks.                                            |


## Tasks

- [x] Audit list/report endpoints for **pagination caps** and default page sizes.
  - [x] Enforce shared pagination clamp via `parsePagination` (default 20, max 100) on key list endpoints:
    - [x] `GET /api/shopflow/sales` (limit capped)
    - [x] `GET /api/shopflow/notifications` (limit capped)
    - [x] `GET /api/shopflow/inventory-transfers` (limit capped)
    - [x] `GET /api/techservices/work-orders` (limit capped)
    - [x] `GET /api/workify/employees` (limit capped; default 10)
    - [x] `GET /api/shopflow/reports/top-products` (limit capped; max 50)
  - [x] Add pagination to previously unbounded endpoints:
    - [x] `GET /api/shopflow/customers`
    - [x] `GET /api/techservices/assets`
- [ ] POS/report UIs: add **virtualization** where lists are large (spot-check per screen).
- [ ] Heavy exports: implement **async jobs + download link** (preferred) or streaming.

## Definition of done

- No unbounded list endpoints without explicit “admin/export” justification.
- Largest UIs reviewed; biggest export paths have a documented scaling path.

