# Multisystem

Plataforma modular multi-empresa para gestión de órdenes de trabajo, ventas y servicios técnicos.

## Estructura del monorepo

Este proyecto usa **pnpm** + **Turborepo** para gestionar múltiples apps y paquetes compartidos.

```
multisystem/
├── apps/
│   ├── hub/              # @multisystem/hub — portal Vite (login, dashboard, módulos)
│   ├── shopflow/         # @multisystem/shopflow — POS, inventario, reportes (Vite)
│   ├── workify/          # @multisystem/workify — RRHH, fichajes, reportes (Next.js)
│   └── techservices/     # @multisystem/techservices — órdenes, activos, agenda (Next.js)
├── packages/
│   ├── api/                  # API REST Fastify compartida
│   ├── component-library/    # @multisystem/ui — componentes React compartidos
│   ├── contracts/            # Tipos y contratos compartidos
│   ├── database/           # @multisystem/database — Prisma, migraciones, cliente
│   └── shared/               # @multisystem/shared — auth cookie + ApiClient (frontends)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### Apps

| App | Puerto | Descripción |
|-----|--------|-------------|
| **hub** | 3001 | Portal multi-empresa: auth, dashboard, enlaces a workify/shopflow/techservices (`Vite`) |
| **shopflow** | 3002 | POS, inventario, reportes, admin del módulo (`Vite`) |
| **workify** | 3003 | Empleados, turnos, fichajes, roles; API `/api/workify` (`Next.js` + Turbo) |
| **techservices** | 3004 | Órdenes de trabajo, activos, visitas; API `/api/techservices` (`Next.js`) |

### Paquetes

| Paquete | Descripción |
|---------|-------------|
| **@multisystem/api** | API Fastify: JWT, CORS, rate limit, Swagger (`/api/docs`); rutas por dominio (auth, usuarios, empresas, miembros, **shopflow**, **workify**, **techservices**); versión URL `/api/v1/*` → misma API que `/api/*` |
| **@multisystem/contracts** | Tipos TS compartidos: respuestas auth (`LoginResponse`, `MeResponse`, …), `CompanyRow` / `CompanyModules`, envoltorio **`ApiResponse<T>`**; API + apps frontend |
| **@multisystem/ui** | (`packages/component-library`) Componentes React (Radix), estilos SCSS → CSS; consumo en **hub**, **shopflow**, **workify**, **techservices** vía `workspace:*` |
| **@multisystem/database** | Schema Prisma (workify, shopflow, techservices, hub), migraciones, `prisma` exportado; adaptador **pg** en local, **Neon** en cloud |
| **@multisystem/shared** | (`packages/shared`) Cookie JWT + `ApiClient` / `createPrefixedApi` para **hub**, **shopflow**, **workify**, **techservices** (TS fuente, sin build) |

### Módulos de negocio

Las empresas pueden activar estos módulos:

- **workify** — RRHH, empleados, fichajes y reportes (app `apps/workify`)
- **shopflow** — Ventas, productos, clientes, proveedores, reportes
- **techservices** — Servicios técnicos y mantenimiento

---

## Requisitos

- Node.js 20+
- pnpm 10+
- Base de datos PostgreSQL (local con Docker o Neon)

---

## Base de datos local (desarrollo)

Con **Docker** instalado:

```bash
# Levantar PostgreSQL en el puerto 5432
docker compose up -d postgres

# Configurar .env en packages/api/ con:
DATABASE_URL=postgresql://multisystem:multisystem@localhost:5432/multisystem

# Aplicar migraciones
pnpm --filter @multisystem/database migrate:deploy

# Opcional: cargar datos iniciales
pnpm --filter @multisystem/database db:seed
```

Credenciales por defecto: usuario `multisystem`, contraseña `multisystem`, base `multisystem`.

> **Nota:** Asegúrate de que `DATABASE_URL` esté en `packages/api/.env`. Si las migraciones no encuentran la variable, crea también `packages/database/.env` con el mismo `DATABASE_URL`.

Para usar **Neon** (cloud) en lugar de local: cambia `DATABASE_URL` por tu connection string de Neon.

---

## Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Crear .env en packages/api/ (o raíz) con:
# DATABASE_URL, PORT, CORS_ORIGIN, JWT_SECRET
```

---

## Desarrollo

```bash
# Iniciar todos los servicios (API + apps + @multisystem/ui en watch) en paralelo
pnpm dev
```

`turbo run dev` ejecuta el script `dev` de cada paquete que lo define; **`@multisystem/ui`** usa `vite build --watch` para recompilar `dist/` al cambiar `packages/component-library/src`.

- **API:** http://localhost:3000  
- **Swagger:** http://localhost:3000/api/docs  
- **Hub:** http://localhost:3001  
- **Shopflow:** http://localhost:3002  
- **Workify:** http://localhost:3003  
- **Techservices:** http://localhost:3004  

### Levantar solo Hub + API + BD local

1. Levantar PostgreSQL: `docker compose up -d postgres`
2. Tener `.env` en `packages/api/` y opcionalmente en `packages/database/` (ver Base de datos local).
3. Migraciones: `pnpm --filter @multisystem/database migrate:deploy`
4. Levantar API y Hub (incluye `@multisystem/ui` en watch junto al Hub):
   ```bash
   pnpm run dev:hub
   ```
   En otra terminal, la API: `pnpm run dev:api` si aún no está en marcha.
   - **Hub:** http://localhost:3001  
   - **API:** http://localhost:3000  
   - **Swagger:** http://localhost:3000/api/docs  

Si el puerto 3000 está en uso, cierra el proceso que lo use o ejecuta en otra terminal solo la API cuando esté libre.  

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia API y apps en modo desarrollo |
| `pnpm build` | Compila todos los paquetes |
| `pnpm lint` | Ejecuta lint en todo el monorepo |
| `pnpm typecheck` | Ejecuta typecheck (continúa si hay errores) |

### Scripts por paquete

```bash
# API
pnpm --filter @multisystem/api dev      # Solo API
pnpm --filter @multisystem/api test     # Tests

# UI compartida (antes de hub si hace falta dist fresco)
pnpm --filter @multisystem/ui build

# Base de datos (generar cliente tras cambios de schema)
pnpm --filter @multisystem/database build

# Hub (puerto 3001; API en 3000)
pnpm --filter @multisystem/hub dev

# Shopflow (puerto 3002)
pnpm --filter @multisystem/shopflow dev

# Workify (puerto 3003)
pnpm --filter @multisystem/workify dev

# Techservices
pnpm --filter @multisystem/techservices dev
```

---

## Variables de entorno

Crear `.env` en `packages/api/` o en la raíz:

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto del servidor API | 3000 |
| `DATABASE_URL` | URL de conexión PostgreSQL | (requerido) |
| `CORS_ORIGIN` | Orígenes CORS separados por coma | hub **3001**, shopflow **3002**, workify **3003**, techservices **3004** |
| `JWT_SECRET` | Clave para firmar tokens | (requerido en prod) |
| `JWT_EXPIRES_IN` | Expiración del token | 7d |
| `NODE_ENV` | Entorno | development |

#### CORS (desarrollo)

Fuente de verdad para orígenes de desarrollo (para que los frontends puedan hacer requests autenticados con cookie):
- `http://localhost:3001` (hub)
- `http://localhost:3002` (shopflow)
- `http://localhost:3003` (workify)
- `http://localhost:3004` (techservices)

Asegúrate de que `packages/api/.env` tenga `CORS_ORIGIN` con esa lista (en el ejemplo y en el fallback del código).

#### Al añadir una nueva app (frontend)

- Añadir la app a la tabla de “Apps” con su puerto.
- Incluir `http://localhost:<puerto>` en la lista de “CORS (desarrollo)” y en `CORS_ORIGIN` de `packages/api/.env`.
- Añadir/actualizar el `env.example` de la app con base URL de API según stack:
  - Vite: `VITE_API_URL`
  - Next.js: `NEXT_PUBLIC_API_URL`
- Verificar si el módulo requiere headers adicionales (ejemplo: `X-Store-Id` en rutas de Shopflow).

Para **techservices** / **workify** (Next): `NEXT_PUBLIC_API_URL` en `.env.local` de cada app si la API no está en `http://localhost:3000`.

**Shopflow** (Vite): `VITE_API_URL` como variable principal en `lib/api/client.ts`, con fallback temporal a `NEXT_PUBLIC_API_URL` para compatibilidad; ver [Shopflow README](./apps/shopflow/README.md).

**Hub** (Vite): `VITE_API_URL`; `VITE_SHOPFLOW_URL` (p. ej. `http://localhost:3002`), `VITE_WORKIFY_URL`, `VITE_TECHSERVICES_URL`.

---

## Stack tecnológico

- **Monorepo:** pnpm workspaces, Turborepo
- **API:** Fastify 5, Zod, JWT, Swagger
- **Frontend:** **Shopflow** y **Hub** con Vite + React Router; **workify** / **techservices** con Next.js; Tailwind; **@multisystem/ui**
- **BD:** Prisma (vía `@multisystem/database`)
- **Contratos:** `@multisystem/contracts` (tipos API ↔ frontend)
- **Front compartido:** `@multisystem/shared` (fetch + cookie token)
- **Lenguaje:** TypeScript (strict)

---

## Documentación adicional

- [API - README](./packages/api/README.md) — Estructura del paquete, Swagger, variables de entorno (incl. Redis opcional para caché de módulos), despliegue
- [Component library - README](./packages/component-library/README.md) — `@multisystem/ui`: imports, estilos, build, lista de componentes
- [Contracts - README](./packages/contracts/README.md) — `@multisystem/contracts`: tipos auth/empresa/API, build `tsc`
- [Database - README](./packages/database/README.md) — Prisma, migraciones, seed, variables `DATABASE_URL` / `DIRECT_URL`, cliente
- [Prisma schema split (plan)](./packages/database/prisma/PRISMA_SCHEMA_SPLIT.md) — notas para dividir el schema por dominio
- [Shared - README](./packages/shared/README.md) — `@multisystem/shared`: auth por cookie, cliente API
- [Hub - README](./apps/hub/README.md) — `@multisystem/hub`: dashboard, variables `VITE_*`, proxy `/api`
- [Shopflow - README](./apps/shopflow/README.md) — POS, API `/api/shopflow`, puerto 3002, env API
- [Workify - README](./apps/workify/README.md) — RRHH, `/api/workify`, puerto 3003
- [Techservices - README](./apps/techservices/README.md) — Next.js, `/api/techservices`, puerto 3004
