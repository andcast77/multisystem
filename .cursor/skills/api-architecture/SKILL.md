---
name: api-architecture
description: >-
  Enforces clean REST API layering (controller, service, repository), validation,
  error handling, and consistent responses. Use when creating or modifying REST
  endpoints, controllers, services, validation, or database access patterns.
---

# API Architecture Skill

Enforces a clean, scalable REST API architecture.

## When to Use

- Creating new endpoints (CRUD)
- Refactoring backend code
- Designing API modules
- Adding business logic

## Instructions

- Always structure code into:
  - **Controller** → handles HTTP layer (req/res)
  - **Policy/Authorization** → authn/authz and resource-scope checks
  - **Service** → business logic
  - **Repository** → database access

- Never mix responsibilities.

- **Controllers** must:
  - Validate input (DTO/schema)
  - Call services only (or policy checks + services)
  - Not contain business logic

- **Services** must:
  - Contain all business rules
  - Be reusable
  - Be independent of HTTP
  - Not return transport-shaped envelopes (`success`, `data`, `error`)

- **Repositories** must:
  - Contain only DB queries/persistence operations
  - Never include business logic
  - Keep tenant-scoped filters mandatory for tenant-owned resources

- **Policy/Authorization** must:
  - Enforce authentication/role/resource-scope checks before business logic
  - Deny by default when scope cannot be proven
  - Never perform DB writes or HTTP response shaping

- Use consistent response format:

```json
{
  "success": true,
  "data": {},
  "message": "",
  "code": "OPTIONAL_MACHINE_CODE"
}
```

- Map errors to appropriate HTTP status codes; keep error payloads consistent with the same envelope (`success: false`, `message`, optional `code`/`details`).
- Never leak internal errors, SQL details, or stack traces to clients.
- Avoid nullable/global tenant fallback paths for tenant-owned resources.

## Source of truth

- Rule: `.cursor/rules/api-architecture.mdc`
- Precedence/conflicts: `.cursor/rules/architecture-governance.mdc`
