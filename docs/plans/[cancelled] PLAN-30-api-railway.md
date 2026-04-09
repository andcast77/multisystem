# [cancelled] PLAN-30 — Desplegar la API (`@multisystem/api`) en Railway

**Estado:** cancelado (referencia histórica). El trabajo de transporte realtime del repo está en [\[completed\] PLAN-30-ws-to-sse.md](./%5Bcompleted%5D%20PLAN-30-ws-to-sse.md) (migración WebSocket → SSE en Vercel).

## Objetivo

Tener un despliegue **no serverless** de **`packages/api`** (Fastify + proceso Node **largo**) en **[Railway](https://railway.app/)**, priorizando **dev/staging**, de forma que funcionen **WebSockets** y **SSE** (no fiables en el patrón serverless actual de Vercel).

## Cómo lo subís a Railway (pasos concretos)

No hay “subir carpeta”: **GitHub + comandos**.

1. Entrá a [railway.app](https://railway.app), creá cuenta/proyecto.
2. **New project** → **Deploy from GitHub** → autorizá el org/repo → elegí **`multisystem`**.
3. **Root directory del servicio:** dejá la **raíz del repo** (donde está el `package.json` principal y `pnpm-lock.yaml`). **No** pongas solo `packages/api`.
4. En **Settings** del servicio (nombres pueden variar un poco en la UI):
   - **Install** (si lo separan): `pnpm install`  
   - **Build command:** el script de **build de la API en monorepo** en la raíz. Hoy en [package.json](../../package.json) se llama por error histórico `vercel:build`, pero **no construye “con Vercel”**: es solo `pnpm` + `turbo` + copia de `packages/database` al layout que espera la API. **No tenés que usar la plataforma Vercel** para Railway. En la implementación del plan conviene añadir un alias neutro, p. ej. `pnpm run railway:build`, que ejecute **el mismo** comando que `vercel:build`, y usar ese nombre en Railway para no confundir.
   - **Start command:**  
     `pnpm migrate:deploy && pnpm --filter @multisystem/api start`  
     (`migrate:deploy` aplica migraciones Prisma; si escalás varias instancias, conviene migraciones en un paso aparte y arrancar solo la API.)
5. **Variables** (pestaña Variables / Environment): como mínimo las mismas que en producción de la API, p. ej. `DATABASE_URL`, `JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, `CORS_ORIGIN` (orígenes del Hub), `NODE_ENV=staging` o `production`. Railway inyecta **`PORT`**; Fastify ya lo usa.
6. **Generar dominio** público en Railway (Settings → Networking / Generate domain) y probá: `https://TU-URL/health`.

Cada **push** a la rama conectada redeploya. No hace falta `nixpacks.toml` en el repo si configurás Build/Start en el dashboard.

## Monorepo (por qué la raíz)

`@multisystem/api` depende de **`@multisystem/database`** y del **workspace pnpm**. El install y el build tienen que correr desde la **raíz** del monorepo. Railway clona **todo el repo**; igual solo arrancás **un proceso** (la API).

## Servidor Linux propio (self-hosted)

Es una opción **válida y muy usada** para Fastify + WebSockets: un **proceso Node largo** detrás de **Nginx/Caddy** (o solo el puerto expuesto con firewall). No necesitás Railway ni PaaS.

**Ventajas:** coste recurrente bajo (solo VPS o electricidad), control total, sin “sleep” de free tiers, ideal para realtime.

**Tu responsabilidad:** actualizaciones del SO, firewall, certificados TLS, backups, y cómo subís código (git pull, script, o CI que haga SSH).

**Flujo típico:**

1. **Servidor:** Ubuntu/Debian, usuario sin root para correr la app, `git` instalado.
2. **Clonar** el repo en `/srv/multisystem` (o similar), **raíz del monorepo**.
3. **Node 20+** y **pnpm** (p. ej. `corepack enable`).
4. **Variables:** archivo `.env` en `packages/api/` (o `Environment=` en systemd) con `DATABASE_URL`, `JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, `CORS_ORIGIN`, `NODE_ENV`, `PORT` (o el que use el reverse proxy).
5. **Build:** desde la raíz, el mismo pipeline que en la nube (p. ej. `pnpm run vercel:build` hasta renombrar, o el script `build` del paquete API cuando exista).
6. **Migraciones:** `pnpm migrate:deploy` antes o en el script de despliegue.
7. **Proceso:** `pnpm --filter @multisystem/api start` bajo **systemd** (reinicio al boot, logs con `journalctl`).
8. **HTTPS y dominio:** **Caddy** o **Nginx** como reverse proxy a `127.0.0.1:PUERTO` con Let’s Encrypt; o **Cloudflare Tunnel** si no querés abrir puertos en el router.
9. **WebSockets:** el proxy debe permitir **Upgrade** (Nginx/Caddy lo soportan con config estándar).

**Hub en Vercel + API en tu servidor:** en el Hub, `NEXT_PUBLIC_API_URL=https://api.tudominio.com` y `CORS_ORIGIN` debe incluir el origen del Hub (como con cualquier API pública).

### Base de datos con la API en tu Linux

La API solo usa **`DATABASE_URL`** (PostgreSQL). El servidor de la API **no debe** estar en el mismo sitio que la base si no querés.

| Opción | Idea |
|--------|------|
| **Postgres en la nube (Neon, Supabase, etc.)** | Dejás la DB donde ya está o creás una instancia. En el servidor Linux solo pones en `.env` la misma `DATABASE_URL` (host externo, SSL). Migraciones: `pnpm migrate:deploy` desde el servidor. **No instalás Postgres en tu máquina.** |
| **Postgres en el mismo servidor** | `apt install` o **Docker** (`postgres:16`), usuario/clave, BD, `DATABASE_URL=postgresql://...@127.0.0.1:5432/...`. Vos hacés **backups** (pg_dump, cron) y actualizaciones. |
| **Postgres en otro VPS** | Misma idea: `DATABASE_URL` apunta al otro host; firewall solo para IP del servidor de la API. |

**Migraciones:** siempre con el mismo repo: `pnpm migrate:deploy` (requiere `DATABASE_URL` y `packages/database` en el entorno). **No** mezclar datos de prod con una `DATABASE_URL` de dev.

## Alcance (resumen)

| In | Out |
|----|-----|
| Build + start con **pnpm** en la raíz, documentados y reproducibles; **alias de script neutro** (`railway:build` u otro) que no obligue a mencionar Vercel. | Cambiar producto realtime (PLAN-17) más allá del transporte. |
| Variables de entorno y migraciones documentadas. | Forzar DB en Railway. |
| Health + prueba manual WS/SSE. | SLA enterprise. |

## Checklist

- [ ] Proyecto Railway + repo conectado; root = monorepo.
- [ ] Build: `pnpm run railway:build` (o el mismo pipeline bajo el nombre actual `vercel:build` hasta renombrar).
- [ ] Start: `migrate:deploy` + `pnpm --filter @multisystem/api start` (o estrategia documentada).
- [ ] Variables cargadas; `GET /health` OK en la URL pública.
- [ ] Hub: `NEXT_PUBLIC_API_URL` = URL Railway.
- [ ] Documentar en `packages/api/README.md` o `docs/deploy/`.

## Git

Rama `plan/plan-30-api-railway-run-<YYYYMMDD-HHmmss>` desde **`Test`**, según [Git workflow for plans](./SYNC.md#git-workflow-for-plans).

## Alternativas si no querés pagar (Railway / PaaS de pago)

Un proceso **Node largo** + **WebSockets** **no** encaja en el free tier serverless de Vercel/Netlify. En la nube “gratis” casi siempre hay truco: **sleep**, **límites**, o **tarjeta** para verificar.

| Opción | Coste | Realidad |
|--------|-------|----------|
| **Auto-hospedaje** (PC vieja, Raspberry, mini PC) + **Cloudflare Tunnel** (HTTPS gratis) o VPN | $0 mensual | Lo más honesto para **$0** y **siempre encendido** si ya tenés hardware y electricidad. Mismo `pnpm build` / `pnpm start` que en cualquier servidor. |
| **Oracle Cloud “Always Free”** (VM ARM) | $0 si calificás | Máquina virtual real; más laburo de setup y a veces piden tarjeta solo para verificar identidad. |
| **Render** (Web Service free) | $0 | Suele **apagar** el servicio por inactividad y **despertar** en ~1 min: **malo** para WS/SSE que necesiten conexión estable 24/7. |
| **Fly.io** / otros | Variable | Revisar **precios y créditos** vigentes; muchas veces no es “gratis para siempre” sin límite. |

**Conclusión:** si la regla es **no gastar nada**, lo sostenible suele ser **correr la API en un servidor propio** (aunque sea chico) con túnel HTTPS, o aceptar **limitaciones** en PaaS gratis (sleep = realtime roto). Railway y similares cobran porque mantienen el proceso **siempre vivo** y el tráfico.

## Referencias

- [package.json](../../package.json) — pipeline de build monorepo API (hoy `vercel:build`; plan: alias `railway:build`), `migrate:deploy`
- [packages/api/package.json](../../packages/api/package.json) — `start` → `node dist/server.js`
