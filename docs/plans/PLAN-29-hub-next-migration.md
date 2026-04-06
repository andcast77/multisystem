# PLAN-29 — Migrar Hub de Vite SPA a Next.js 16 (App Router)

**Estado:** en ejecución.

## Objetivo

Sustituir **Vite + React Router** en `apps/hub` por **Next.js 16 (App Router)** desplegable en Vercel, **sin** nueva API: el Hub sigue consumiendo **`@multisystem/api`** (Fastify) por HTTP.

## Beneficios esperados

- Respuestas HTTP coherentes por ruta (sin depender de rewrites SPA).
- `middleware` para proteger `/dashboard/*` por cookie JWT.
- Metadata por ruta; mejor encaje con el stack recomendado por Vercel para SSR/SSG híbrido.

## Contexto previo

- Hub era Vite: `src/App.tsx` con rutas públicas y bloque protegido con `ProtectedRoute` + `useUser()`.
- Auth: cookies vía `@multisystem/shared/auth`.
- Referencia de configuración en monorepo: `apps/workify/next.config.ts` (turbopack root, `transpilePackages`, headers).

## Decisiones

1. **Framework:** Next.js 16, App Router (alineado a Workify).
2. **API:** una sola API compartida; variables `NEXT_PUBLIC_*` para URLs públicas en cliente.
3. **Protección:** sesión en API (httpOnly); el dashboard usa `DashboardLayout` + `useUser()` como antes. `proxy.ts` solo hace `NextResponse.next()` (placeholder; las cookies de sesión no están en el origen del Hub).
4. **Vercel:** preset Next, salida `.next`; sin `rewrites` catch-all a `index.html`.

## Enfoque técnico (resumen)

| Área | Acción |
|------|--------|
| Rutas | Segmentos `app/` equivalentes a las rutas anteriores; layout dashboard compartido. |
| Navegación | `next/link`, `next/navigation`; eliminar `BrowserRouter`. |
| Env | `VITE_*` → `NEXT_PUBLIC_*` donde aplique. |
| Limpieza | Quitar Vite, `main.tsx`, `App.tsx`, `index.html`. |

## Checklist

- [x] Scaffold Next 16 en `apps/hub` y build.
- [x] Layout raíz + `middleware` para `/dashboard/*`.
- [x] Migrar páginas y layouts; paridad de rutas con el árbol anterior.
- [x] Ajustar `api-client` / `api-origin` para `NEXT_PUBLIC_*`.
- [x] Quitar artefactos Vite; lint y build del paquete Hub.
- [ ] Prueba manual: login, `next`, dashboard, miembros, permisos dinámicos, settings, preview Vercel.

## Riesgos

- **Cookies:** nombres y dominio alineados con la API y `@multisystem/shared/auth`.
- **Rutas:** validar dinámicas y query (`verify-email`, `reset-password`).
- **CI/Vercel:** proyecto Hub debe usar output Next (`.next`), no `dist`.

## Git

Implementación en rama `plan/plan-29-hub-next-migration-run-*` desde `Test`, no directamente en `Test`.

## Referencias

- `apps/workify/next.config.ts`
- `apps/hub/README.md` (actualizado con stack Next)
