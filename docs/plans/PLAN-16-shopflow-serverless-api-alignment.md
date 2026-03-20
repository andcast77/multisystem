# PLAN-16 - Shopflow Serverless + API Alignment

## Objective

Leave `apps/shopflow` as a serverless-friendly frontend, remove active Next.js dependencies, and align API usage with the new unified client structure.

## Scope

- Shopflow frontend (`apps/shopflow`) only.
- No backend API implementation changes in this plan.
- Includes code cleanup, guardrails, and validation commands.

## Implementation checklist

- [x] Remove client-side Node/Web Push runtime usage and private VAPID exposure.
  - `src/lib/services/pushNotificationService.ts`
  - `src/lib/services/notificationService.ts`
  - Removed `src/types/web-push.d.ts`
- [x] Remove legacy Next tree and residual references.
  - Deleted `src/app-dead/**`
  - Deleted `public/next.svg`
  - Moved CSS import from `src/app-dead/globals.css` to `src/styles.css` and updated `src/main.tsx`
  - Cleaned `tsconfig.json`, `.gitignore`, and `knip.jsonc` legacy exclusions/comments
- [x] Add guardrail to prevent new Next imports in active source.
  - `eslint.config.mjs` with restricted imports for `next` and `next/*`
- [x] Unify API client usage.
  - Removed legacy `src/lib/api-client.ts`
  - Updated `src/hooks/useUser.ts` to consume `@/lib/api/client`
  - Extended `authApi` and normalized `ApiResult` shape in `src/lib/api/client.ts`
- [x] Align error/response helpers with envelope semantics.
  - `src/lib/utils/errors.ts`
  - `src/lib/utils/api.ts`
- [x] Reduce sensitive business logic in frontend services.
  - `src/lib/services/saleService.ts` (backend as source of truth)
  - `src/lib/services/inventoryTransferService.ts` (backend validates stock/ownership)
- [x] Fix validation blockers introduced by environment/tooling drift.
  - Type fixes in `src/components/layout/ShopflowModuleGuard.tsx` and `src/components/layout/Sidebar.tsx`
  - Lint compatibility updates and parser wiring in `eslint.config.mjs`
  - Installed missing dev dependencies for lint runtime (`@eslint/eslintrc`, `@eslint/js`, `@typescript-eslint/parser`)

## Validation gates

- [x] `pnpm lint` (in `apps/shopflow`)
- [x] `pnpm typecheck` (in `apps/shopflow`)
- [x] `pnpm build` (in `apps/shopflow`)
- [x] Search confirms no active `next/*` imports in `apps/shopflow/src/**`
- [x] Search confirms no `web-push` and no `VITE_VAPID_PRIVATE_KEY` usage in active source

## Notes / Risks

- Push delivery is now backend-driven from frontend perspective; endpoint availability and payload contract must remain stable.
- Existing unrelated workspace changes remain outside this plan’s scope and were not reverted.

## Exit criteria

- Shopflow builds and typechecks cleanly.
- Active source is free of Next runtime imports.
- Frontend no longer embeds server-side push logic or private VAPID usage.
- Unified API client is the only active client path.
