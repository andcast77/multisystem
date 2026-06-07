# Design: Turborepo Conventions Realignment

## Technical Approach

Realign multisystem to official Turborepo patterns in **three apply slices** (chained PRs if diff >400 lines). Slice A fixes workspace/task/CI contracts; B fixes layout (`apps/api`, `packages/ui`); C replaces broken Docker/Vercel deploy with **`turbo prune --docker` + Next standalone**. Implements `turborepo-workspace-conventions` (new) and `containerized-deployment` (delta).

Refs: [structuring](https://turbo.build/repo/docs/crafting-your-repository/structuring-a-repository), [docker](https://turbo.build/repo/docs/guides/tools/docker).

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|----------------------|-----------|
| Docker build | `turbo prune` + pnpm install on `out/json` + `out/full` | Manual COPY `node_modules`; per-app Dockerfiles | Official Turborepo + pnpm model; fixes `next: not found` |
| Next runtime | `output: 'standalone'` + `node apps/{app}/server.js` | `next start` on workspace symlinks | Next file tracing; no pnpm `.bin` dependency |
| API location | `git mv packages/api → apps/api` | Keep in `packages/` | Turborepo deployable = `apps/` |
| UI folder | `git mv packages/component-library → packages/ui` | Rename package only | Folder matches `@multisystem/ui` |
| Shared lib | `tsc` → `dist/`, update `exports` | Keep raw TS exports | Internal package contract + Turbo cache |
| Vercel API | `turbo build --filter=@multisystem/api...` | `api:bundle` cp hack | Turbo dependency graph |
| CI | `turbo run … --affected`, `fetch-depth: 0` | Full monorepo every PR | Official affected runs |
| Baro | Remove `turbo.json` overrides + nested `packageManager` only | Full catalog realignment now | Out of scope; structural debt only |

## Data Flow

### Dev / CI build

```
pnpm install (root)
    → turbo run build --filter=@multisystem/hub...
        → ^build: shared, contracts, ui, database
        → hub: next build (standalone artifact in .next/)
```

### Docker (Next app)

```
COPY repo → turbo prune @multisystem/hub --docker
    → out/json → pnpm install --frozen-lockfile
    → out/full → turbo run build --filter=@multisystem/hub...
    → runner: .next/standalone + static + public
    → CMD node apps/hub/server.js
```

### Docker (API)

```
turbo prune @multisystem/api --docker → install → build
    → entrypoint: pnpm --filter @multisystem/database migrate:deploy
    → CMD node apps/api/dist/server.js
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/api/` | Move → `apps/api/` | Deployable API |
| `packages/component-library/` | Move → `packages/ui/` | Folder/name alignment |
| `packages/shared/package.json`, `tsconfig.build.json` | Modify/Create | `build` → `dist/`, exports |
| `package.json` (root) | Modify | `--filter=…...`; remove `api:bundle` |
| `turbo.json` | Modify | Uniform tasks; build `env` for `NEXT_PUBLIC_*`; drop baro overrides |
| `.github/workflows/ci.yml` | Modify | `--affected`; `v2` branch; `fetch-depth: 0` |
| `docker/Dockerfile.nextjs` | Rewrite | prune + standalone runner |
| `docker/Dockerfile.api` | Rewrite | prune; `apps/api/dist/server.js` |
| `docker-compose.yml` | Modify | `docker/Dockerfile.nextjs` + build-args per service |
| `apps/{hub,shopflow,workify,techservices,baro}/next.config.ts` | Modify | `standalone` + `outputFileTracingRoot` |
| `apps/*/vercel.json`, `apps/api/vercel.json` | Modify | root install + `turbo build --filter=…...` |
| `apps/*/Dockerfile` (6 files) | Delete | Replaced by generic Dockerfile |
| `apps/baro/docker-entrypoint.sh` | Delete | No-op; standalone CMD only |
| Tailwind `@source`, `tailwind.config.js`, `.cursor/rules/*.mdc` | Modify | `packages/ui`, `apps/api` paths |
| `scripts/vercel-api-skip-if-unchanged.sh` | Modify | `apps/api` path |
| `.env.example` | Modify | Document Docker build-time `NEXT_PUBLIC_*` |

## Interfaces / Contracts

**Docker build args (Next):**

```dockerfile
ARG PACKAGE=@multisystem/hub
ARG APP_DIR=hub
ARG PORT=3001
ARG NEXT_PUBLIC_API_URL
# … other NEXT_PUBLIC_* per turbo.json globalEnv
```

**Compose service build (example hub):**

```yaml
build:
  context: .
  dockerfile: docker/Dockerfile.nextjs
  args:
    PACKAGE: "@multisystem/hub"
    APP_DIR: hub
    PORT: 3001
    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3000}
```

**`@multisystem/shared` exports (target):**

```json
"main": "./dist/index.js",
"exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Unaffected | Existing package tests via `--affected` |
| Integration | API after move | `pnpm --filter @multisystem/api test` |
| Build | Hub closure | `pnpm turbo run build --filter=@multisystem/hub...` |
| Docker | Hub + API images | `docker build` + `node apps/hub/server.js` smoke; API health |
| CI | Affected graph | PR touching `apps/hub` only runs hub + deps |

Balance app **excluded** from verify until product SDD.

## Migration / Rollout

**Slice order:** A → B → C (each mergeable; B before C so Docker paths reference `apps/api`).

No DB migration. Rollback: revert slice commits; reverse `git mv` for B.

**PR budget:** target ≤400 lines/slice; chain on `v2` if exceeded.

## Open Questions

- [ ] None blocking — Balance out of scope per user.
