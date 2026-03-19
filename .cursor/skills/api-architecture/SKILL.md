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
  - **Service** → business logic
  - **Repository** → database access

- Never mix responsibilities.

- **Controllers** must:
  - Validate input (DTO/schema)
  - Call services only
  - Not contain business logic

- **Services** must:
  - Contain all business rules
  - Be reusable
  - Be independent of HTTP

- **Repositories** must:
  - Contain ONLY DB queries
  - Never include business logic

- Use consistent response format:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

- Map errors to appropriate HTTP status codes; keep error payloads consistent with the same envelope when possible (e.g. `success: false`, `message`, optional `code`).
