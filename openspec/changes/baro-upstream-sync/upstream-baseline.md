# Upstream baseline — baro-upstream-sync

| Field | Value |
|-------|-------|
| Remote | `https://github.com/andcast77/baro.git` |
| Branch | `main` |
| SHA | `13ee779563650dea4821fc7757d0925cdb31d1ae` |
| Message | Webadas |
| Monorepo baseline | `v2` @ check-structure integration |
| Sync date | 2026-06-06 |

## Inventory summary

| Class | Count (approx) | Action |
|-------|----------------|--------|
| UI / components / locales | ~100+ | Ported from upstream |
| Tests | ~15 | Ported; denylisted `datos-generales.test.ts`; removed incompatible PDF engine test |
| Server actions | 3 | Preserved monorepo API wrappers |
| Deny (prisma/auth) | ~30 | Excluded |
| Integration pages/routes | ~15 | Restored from `v2` (API-backed) |
| Schema delta | 0 | `esPropietario` already in `BaroExpedienteOrdenante` |

## Protected paths (never overwritten)

- `apps/baro/lib/api/**`
- `apps/baro/lib/auth/session.ts`
- `apps/baro/lib/expediente/actions/{update-all,nueva,delete}.ts`
- `apps/baro/lib/expediente/docx/fetch-render-row.ts`
- `apps/baro/package.json`, `Dockerfile`, `docker-entrypoint.sh`
