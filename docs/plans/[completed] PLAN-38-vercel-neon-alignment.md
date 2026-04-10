# PLAN-38 — Alineación 100% Vercel + BD Neon

**Objetivo:** Una sola historia de despliegue para **producción/preview**: **API + frontends en Vercel**, **PostgreSQL en Neon**; desarrollo local sigue con Docker Postgres y Prisma con adaptador `pg` cuando `DATABASE_URL` apunta a localhost (sin cambiar el modelo híbrido de `@multisystem/database`).

**CI:** GitHub Actions usa Postgres en contenedor para tests — no es hosting de prod; no debe confundirse con Neon.

---

## Checklist operativo (equipo / DevOps)

- [ ] **Vercel — API** (`packages/api`): Root Directory `packages/api`; activar **Include source files outside of the Root Directory** para que el build desde la raíz incluya `packages/database`. Build: `pnpm run api:bundle` (definido en [`vercel.json`](../../packages/api/vercel.json)).
- [ ] **Vercel — apps Next** (`apps/hub`, `apps/shopflow`, `apps/workify`, `apps/techservices`): cada una con su `vercel.json`; build vía Turborepo desde la raíz como ya está en cada archivo.
- [ ] **Neon:** `DATABASE_URL` con URL **pooled** (runtime serverless); misma base para API y migraciones según flujo en [`packages/database/README.md`](../../packages/database/README.md).
- [ ] **Variables críticas en Vercel (Production + Preview):** `DATABASE_URL`, `JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, `CORS_ORIGIN`; en frontends, `NEXT_PUBLIC_*` alineadas entre apps (URLs públicas del ecosistema). Ver [`packages/api/README.md`](../../packages/api/README.md).
- [ ] **Migraciones contra Neon:** `pnpm migrate:deploy` desde la raíz (comandos sin `:dev`), con `DATABASE_URL` de prod apuntando a Neon.

---

## Implementación en repo (este plan)

- [x] **README raíz:** Hub y apps documentados como Next.js; variables `NEXT_PUBLIC_*`; stack y enlaces coherentes.
- [x] **`docs/ENGINEERING_AUDIT_REPORT.md`:** §2–3 y diagrama actualizados; nota de supersedencia respecto a descripciones antiguas (Vite para Hub/Shopflow).
- [x] **`packages/api/README.md`:** Vercel + Neon como camino oficial; Render / `.env.render.example` como legado.
- [x] **Script de build:** `api:bundle` en [`package.json`](../../package.json) (cuerpo del pipeline); `vercel:build` queda como alias de `api:bundle`; [`packages/api/vercel.json`](../../packages/api/vercel.json) usa `api:bundle`.

---

## Criterios de hecho

- La documentación de entrada ([`README.md`](../../README.md), informe de ingeniería, README de API) describe **Vercel + Neon** como prod y no contradice el código (Next en las cuatro apps).
- El deploy de API en Vercel invoca el pipeline **`pnpm run api:bundle`** sin depender del nombre histórico `vercel:build` en la configuración (el alias se mantiene por compatibilidad).

---

## Referencias

- [`packages/database/src/client.ts`](../../packages/database/src/client.ts) — `PrismaNeon` fuera de localhost.
- [`docs/plans/[cancelled] PLAN-30-api-railway.md`](./%5Bcancelled%5D%20PLAN-30-api-railway.md) — alternativas PaaS no objetivo.
