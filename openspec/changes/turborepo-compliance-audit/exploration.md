# Exploration: Turborepo monorepo + Docker strict compliance audit

**Change**: `turborepo-compliance-audit`  
**Date**: 2026-06-07  
**Refs**: [Structuring](https://turbo.build/repo/docs/crafting-your-repository/structuring-a-repository), [Internal packages](https://turbo.build/repo/docs/crafting-your-repository/creating-an-internal-package), [Docker](https://turbo.build/repo/docs/guides/tools/docker), [prune](https://turbo.build/repo/docs/reference/prune), [run --affected](https://turbo.build/repo/docs/reference/run#--affected)

**Note:** The request mentions *Turbopack* (Next.js bundler). This audit focuses on **Turborepo** monorepo structure and **Docker** deploy patterns from official Turborepo docs. Turbopack usage in `next.config.ts` (`turbopack.root`) is noted where relevant; it is separate from Turborepo workspace rules.

---

## Exploration: Turborepo + Docker strict compliance

### Current State

The repo recently completed change `turborepo-conventions` (archived 2026-06-07). Canonical specs exist at `openspec/specs/turborepo-workspace-conventions/spec.md` and `openspec/specs/containerized-deployment/spec.md`.

**Workspace layout (Turborepo “structuring”)**

| Check | Status | Evidence |
|-------|--------|----------|
| Deployables under `apps/` | ✅ | `apps/{api,hub,shopflow,workify,techservices,baro,balance}` |
| Libraries under `packages/` | ✅ | `packages/{contracts,database,shared,ui}` |
| API at `apps/api/` | ✅ | `git mv` done in Slice B |
| UI folder `packages/ui/` | ✅ | Renamed from `component-library` |
| Root `packageManager` only | ✅ | `package.json` `pnpm@10.28.0`; baro nested manager removed |
| Root scripts delegate to Turbo | ✅ | `build`, `dev`, `lint`, `test`, `typecheck` → `turbo run` |
| Filter closure `...` on dev/build | ✅ | e.g. `dev:hub` → `--filter=@multisystem/hub...` |
| Uniform `turbo.json` tasks | ✅ | No `@multisystem/baro#*` overrides; `dependsOn: ["^build"]` |
| CI `--affected` + full history | ✅ | `.github/workflows/ci.yml` |
| Internal libs build to `dist/` | ✅ Mostly | `shared`, `contracts`, `ui`, `database` export `dist/` |

**Docker (Turborepo Docker guide)**

| Check | Status | Evidence |
|-------|--------|----------|
| `turbo prune --docker` in Next image | ✅ | `docker/Dockerfile.nextjs` prepare stage |
| `turbo prune --docker` in API image | ✅ | `docker/Dockerfile.api` |
| Next `output: 'standalone'` | ✅ | hub, shopflow, workify, techservices, baro (+ balance WIP) |
| `outputFileTracingRoot` at monorepo root | ✅ | Same apps |
| Runner `node apps/{app}/server.js` | ✅ | Dockerfile.nextjs CMD; hub smoke HTTP 200 |
| No per-app Dockerfiles | ✅ | Deleted; compose uses `docker/Dockerfile.nextjs` |
| Compose `NEXT_PUBLIC_*` build args | ✅ | `docker-compose.yml` `x-next-build-args` |
| API CMD `apps/api/dist/server.js` | ✅ | `docker/Dockerfile.api` |

**Verdict vs “strict”:** The **implemented runtime and CI/Docker paths align with Turborepo docs** for the main product apps. Full strict compliance is **not** met due to documentation drift, uneven task graphs, WIP balance, and one prune workaround.

### Affected Areas

- `packages/shared/README.md` — still documents raw TS exports; contradicts `dist/` build contract
- `packages/ui/README.md` — still references `packages/component-library`
- `scripts/vercel-api-skip-if-unchanged.sh` — comment still mentions `api:bundle`
- `apps/baro/package.json` — `next build --webpack`, no `typecheck`, no `vercel.json`; catalog/version drift vs root (`next@16.2.4` vs catalog `16.2.3`)
- `apps/api/package.json` — no `lint` / `typecheck` scripts (CI `--affected` typecheck skips API)
- `apps/hub/package.json`, `apps/techservices/package.json` — uneven `lint`/`typecheck` (hub uses `lint: tsc --noEmit` only)
- `apps/balance/` — WIP untracked; referenced in root scripts + `docker-compose.yml` but not in committed workspace
- `docker/Dockerfile.nextjs`, `docker/Dockerfile.api` — manual `COPY tsconfig.base.json` after prune (prune omits root tsconfig)
- `package.json` — `knip:*`, `verify:plan39` bypass Turbo task graph
- `apps/*/package.json` — local `start: next start` (acceptable for dev; Docker uses standalone)

### Approaches

1. **Doc + task-graph hardening only (low risk)**
   - Pros: Fast; closes “strict” gaps without behavior change
   - Cons: Does not add CI Docker smoke or shared `typescript-config` package
   - Effort: Low

2. **Full strict alignment (docs + tasks + CI + balance decision)**
   - Pros: Matches Turborepo starter patterns (`packages/typescript-config`, uniform `lint`/`typecheck`/`build` per package, CI docker build job)
   - Cons: Baro webpack decision and balance scope need product agreement
   - Effort: Medium

3. **Status quo — specs as source of truth, accept documented exceptions**
   - Pros: No churn; current Docker/build paths verified
   - Cons: “Strict” audit always fails on README/task drift
   - Effort: None

### Recommendation

**Option 2 in two slices**, after product call on balance:

1. **Slice 1 (compliance hygiene):** Update READMEs/scripts comments; add missing `typecheck`/`lint` to `@multisystem/api`, hub, techservices; align baro catalog or document exception; remove or track `apps/balance` from compose/scripts until product SDD.
2. **Slice 2 (optional strict):** Add `packages/typescript-config` (or document why `tsconfig.base.json` at root is sufficient); CI job `docker build` hub+api; upstream issue/workaround doc for `tsconfig.base.json` in prune output.

Do **not** block on Turbopack vs Webpack for baro unless Docker/Vercel must use Turbopack — Turborepo Docker guide cares about **standalone output**, not bundler choice.

### Risks

- **Balance in compose** without tracked package → `docker compose build balance` fails on clean clone
- **`turbo prune` + root tsconfig** — fragile if more root-only config files are required (eslint, prettier shared configs)
- **Uneven typecheck** — API changes may merge without CI typecheck on affected API package
- **Baro version drift** — separate Next patch from catalog may affect prune lockfile reproducibility in Docker

### Compliance gap summary (strict audit)

| Area | Strict? | Gap |
|------|---------|-----|
| Layout `apps/` / `packages/` | ✅ | — |
| Internal package `dist/` | ⚠️ | README drift only |
| Turbo root scripts + filters | ✅ | knip/verify bypass turbo |
| Uniform task graph | ❌ | api/baro/techservices/hub task gaps |
| CI `--affected` | ✅ | — |
| Vercel via turbo `...` | ⚠️ | baro (no vercel.json); balance N/A |
| Docker prune + standalone | ✅ | tsconfig.base manual COPY |
| No per-app Dockerfiles | ✅ | — |
| Compose build-time env | ✅ | balance service risky |

### Ready for Proposal

**Yes** — if the goal is to close remaining strict-compliance gaps.

Proposed change name: `turborepo-compliance-audit` (or `turborepo-strict-followups`).

Orchestrator should ask user:
1. Balance: remove from compose/scripts until SDD, or land balance workspace in same change?
2. Baro: keep `--webpack` production build as documented exception?
3. Scope: doc/task fixes only vs add CI Docker build job?
