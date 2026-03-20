---
name: api-observability-baseline
description: >-
  Enforces minimum API observability and readiness standards. Use when changing
  request handling, logging, error mapping, health/readiness checks, or runtime
  diagnostics in the API.
---

# API Observability Baseline Skill

Defines the minimum observability controls required for API changes.

## When to Use

- Changing request lifecycle or middleware/hooks
- Implementing logging/error handling behavior
- Editing health/readiness endpoints
- Introducing background jobs or external dependency calls

## Instructions

### Request tracing

- Must include a request identifier for every request (`requestId` or equivalent).
- Must propagate correlation identifiers across internal calls when present.
- Must include request ID in structured error logs/events where applicable.

### Structured logging

- Must emit structured logs (key-value fields), not ad-hoc text only.
- Must include at least: `requestId`, route/module name, status/result, and duration for key operations.
- Must not log secrets, tokens, passwords, or sensitive PII.

### Metrics and readiness

- Must expose baseline health and readiness checks.
- Readiness must validate critical dependencies (for example database/cache), not only process liveness.
- Should expose baseline latency/error-rate counters or equivalent metrics hooks.

### Error observability

- Must preserve machine-readable error codes when available.
- Must capture enough context for production triage without exposing internal implementation details to clients.

## Source of truth

- Rule: `.cursor/rules/api-observability-baseline.mdc`
- Precedence/conflicts: `.cursor/rules/architecture-governance.mdc`
