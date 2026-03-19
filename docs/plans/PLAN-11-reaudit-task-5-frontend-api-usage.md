# Plan 11 — Re-audit Task 5: Standardize Frontend API Usage

**Audit refs:** [RE-AUDIT.MD](../RE-AUDIT.MD) `TASK 5`

| Field | Detail |
|---|---|
| **Objective** | Ensure frontend apps consistently use `@multisystem/shared` `ApiClient` conventions for credentialed REST calls. |
| **Current re-audit status** | Active (direct `fetch()` bypasses remain in feature code). |
| **Risk if it persists** | Inconsistent credential usage and fragmented error-envelope handling. |

## Tasks

- [ ] Replace direct `fetch()` in Shopflow feature paths with shared/prefixed clients where applicable.
  - Evidence: `apps/shopflow/src/lib/services/printing.ts`, `apps/shopflow/src/lib/utils/export/excel.ts`, `apps/shopflow/src/hooks/useTicketConfig.ts`
- [ ] Standardize upload/import flows in Workify to match shared envelope/credential behavior.
  - Evidence: `apps/workify/src/components/features/employees/EmployeeImportModal.tsx`
- [ ] Add enforcement:
  - prefer shared client usage in app layers where session-cookie credentials are required
- [ ] Verify critical flows:
  - credentialed requests succeed across browser origins (`credentials: 'include'` via shared client)
  - error shapes match expected client-side handling

## Definition of done

- Critical flows (printing/export/ticket config/import) use shared client conventions.
- Remaining direct `fetch()` bypasses are isolated behind documented wrappers or removed.

