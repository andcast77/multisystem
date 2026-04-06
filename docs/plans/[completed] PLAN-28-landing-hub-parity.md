# PLAN-28 — Landing pages alineadas al Hub

**Estado:** completado.

## Objetivo

Alinear las páginas públicas de inicio de Shopflow, Workify y Techservices con la composición visual y tokens del landing del Hub (`#0a0a0f`, Hero con rejilla, secciones de módulos/características/CTA/footer), copiando la estructura por app (sin nuevo paquete). En Workify y Techservices, `/` deja de redirigir y muestra siempre ese landing; el dashboard sigue en `/dashboard`.

## Decisiones

- **`/` siempre landing** (no redirigir por sesión en la raíz).
- **Reutilización:** misma estructura y clases por app (**copia controlada**), sin `@multisystem/ui` ni paquete nuevo en esta fase.
- **Narrativa por módulo:** cada landing describe **primero** el producto del módulo (ShopFlow POS, Workify, Tech Services): hero, características y CTA centrados en ese dominio. **Multisystem** aparece como **ecosistema** (sección de otras apps + línea en footer), no como mensaje principal del hero.
- **Marca por app (obligatorio):** el nombre del **sitio actual** (header, título de pestaña/metadata, hero principal) debe coincidir con el módulo que se está sirviendo. En **Workify** eso es **Workify**, no “ShopFlow POS”. Los demás productos (p. ej. ShopFlow POS) solo aparecen como **otra app** en la sección de ecosistema / enlaces del footer, no como identidad principal.

## Contexto

- **Referencia:** `apps/hub/src/pages/LandingPage.tsx` y `apps/hub/src/components/` (`Hero`, `ModuleCard`, `FeaturesSection`, `Footer`).
- **Histórico:** antes de este plan, Workify y Techservices redirigían `/` → `/dashboard`; el landing unificado reemplaza ese comportamiento.

## Enfoque técnico

1. Mismo esqueleto que Hub: header sticky, Hero + módulos (`#modulos`) + características + CTA + footer.
2. **Vite (Hub/Shopflow):** `react-router` `Link` / `to`.
3. **Next (Workify/Techservices):** `next/link` / `href`; CTAs a `/login` y `/register` según rutas existentes.
4. **URLs entre apps:** variables de entorno públicas (`NEXT_PUBLIC_*` / `VITE_*`) para tarjetas y footer; documentar en `.env.example`; defaults de desarrollo alineados a puertos del monorepo.
5. **Copy por producto:** mismo layout; badge/subtítulo pueden enfatizar el módulo actual.
6. **Componentes locales** por app (p. ej. `components/landing/Hero.tsx`) si evita un `page.tsx` gigante.

## Checklist

- [x] Variables de URL por app documentadas en `.env.example` (Shopflow, Workify, Techservices; Hub ya tenía URLs de módulos).
- [x] Shopflow: `LandingPage` al estilo Hub (`src/components/landing/*`, `src/lib/landingUrls.ts`).
- [x] Workify: `app/page.tsx` — `LandingHome` en lugar de redirect.
- [x] Techservices: `app/page.tsx` — `LandingHome`; registro vía `NEXT_PUBLIC_HUB_URL` + `/register` (sin `/register` local).
- [x] Build: Shopflow, Workify, Techservices verificados con `pnpm run build:*`.
- [x] Revisión manual: `/` coherente visualmente; enlaces entre apps correctos; en **Workify** (`:3003`) comprobar que la marca visible sea **Workify** (no ShopFlow POS salvo tarjeta “otro módulo” en ecosistema); evitar confundir puerto con Shopflow (`:3002`).

## Referencias

- Hub landing: `apps/hub/src/pages/LandingPage.tsx`
- Hub README (puertos): `apps/hub/README.md`
- Workify landing: `apps/workify/src/components/landing/LandingHome.tsx`, `apps/workify/src/app/page.tsx`
- Techservices landing: `apps/techservices/src/components/landing/LandingHome.tsx`, `apps/techservices/src/app/page.tsx`
- Shopflow landing: `apps/shopflow/src/views/LandingPage.tsx`, piezas en `apps/shopflow/src/components/landing/`
