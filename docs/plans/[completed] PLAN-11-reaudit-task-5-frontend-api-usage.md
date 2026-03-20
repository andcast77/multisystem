# Plan 11 — Re-audit Task 5: Standardize Frontend API Usage

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 5`

| Field | Detail |
|---|---|
| **Objective** | Ensure frontend apps consistently use `@multisystem/shared` `ApiClient` conventions for credentialed REST calls. |
| **Current re-audit status** | Active (direct `fetch()` bypasses remain in feature code). |
| **Risk if it persists** | Inconsistent credential usage and fragmented error-envelope handling. |

## Tasks

- [x] Replace direct `fetch()` in Shopflow feature paths with shared/prefixed clients where applicable.
  - Evidence: `apps/shopflow/src/lib/services/printing.ts`, `apps/shopflow/src/lib/utils/export/excel.ts`, `apps/shopflow/src/hooks/useTicketConfig.ts`
- [x] Standardize upload/import flows in Workify to match shared envelope/credential behavior.
  - Evidence: `apps/workify/src/components/features/employees/EmployeeImportModal.tsx`
- [x] Add enforcement:
  - prefer shared client usage in app layers where session-cookie credentials are required
- [x] Verify critical flows:
  - credentialed requests succeed across browser origins (`credentials: 'include'` via shared client)
  - error shapes match expected client-side handling

## Definition of done

- Critical flows (printing/export/ticket config/import) use shared client conventions.
- Remaining direct `fetch()` bypasses are isolated behind documented wrappers or removed.

## Implementation notes

- `printing.ts` network print flow now uses `shopflowApi.post(...)` with shared client behavior.
- `useTicketConfig.ts` now routes through `ticketConfigService` (`shopflowApi` + `ApiResult`) instead of direct `fetch`.
- `excel.ts` keeps a direct `fetch` wrapper for blob download semantics, but is now standardized with external `API_URL` + `credentials: 'include'`.
- `EmployeeImportModal.tsx` keeps direct multipart `fetch` for `FormData` upload, but is standardized with `credentials: 'include'` and envelope-tolerant response parsing (`data.imported/errors` or legacy top-level fields).

