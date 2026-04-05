# PLAN-27 — AuthLayout brand + identidad Hub (login/register)

**Estado:** completado (verificación de build).

## Objetivo

- Unificar login y registro con `AuthLayout` de `@multisystem/ui`, variante **`brand`**: misma estética que el landing del Hub (`#0a0a0f`, rejilla y glows índigo, panel derecho coherente).
- Aplicar en Hub, Shopflow, Workify y Techservices; extender el layout con `contentClassName` y `variant`.

## Checklist

- [x] `AuthLayout`: `variant` (`default` | `brand`), `contentClassName`, fondo brand alineado a Hero.
- [x] Hub `LoginPage` / `RegisterPage`: `variant="brand"`, cards glass y tipografía acorde al landing.
- [x] Shopflow `LoginPage` / `RegisterPage`: `AuthLayout` brand + paneles por app.
- [x] Workify: renombrar `(auth)/layout.tsx`; `LoginForm` / `RegisterForm` con `AuthLayout` brand en todas las ramas.
- [x] Techservices `login/page.tsx`: `AuthLayout` brand; Tailwind `content` incluye paquete UI.
- [x] Build / typecheck apps y paquete `component-library` (incl. Workify `Sidebar` con `navigation={{ Link, usePathname }}`).

## Referencias

- Landing Hub: `apps/hub/src/pages/LandingPage.tsx`, `apps/hub/src/components/Hero.tsx`
- Layout: `packages/component-library/src/components/auth-layout.tsx`
