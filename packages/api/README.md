# Multisystem API

API compartida **Fastify 5** para Multisystem: JWT, multi-empresa (contexto de compañía/miembro) y rutas agrupadas por módulo (**shopflow**, **workify**, **techservices**). Acceso a datos con **@multisystem/database** (Prisma).

## 📄 Swagger / OpenAPI

- **No producción:** **`/api/docs`**.
- **Producción:** UI **off** salvo **`ENABLE_API_DOCS=true`** (usar solo en entornos controlados).

- [Swagger UI](https://swagger.io/tools/swagger-ui/) · [OpenAPI Specification](https://swagger.io/specification/)

## 🔑 Sesión y auth

- Tras **login / register / POST /api/auth/context**, la API envía cookie **`ms_session`** (**httpOnly**, **Secure**, **SameSite=None**) en el host de la API. Los frontends deben usar **`credentials: 'include'`** y tener su origen en **`CORS_ORIGIN`**.
- **`Authorization: Bearer`** sigue soportado (tests, scripts).
- **`JWT_SECRET`:** obligatorio en **Vercel**, **`NODE_ENV=production`**, **`staging`** y cualquier despliegue; en desarrollo local se avisa si falta. Ver [ADR-auth-token-storage.md](../../docs/ADR-auth-token-storage.md).

## ⏱ Rate limiting

- **Global:** 100 req/min por IP en el resto de rutas.
- **`POST /api/auth/login`**, **`register`**, **`verify`:** excluidas del bucket global; bucket dedicado **20 req/min** (`ms-auth-public`).

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- pnpm (gestor de paquetes)
- Base de datos Neon PostgreSQL (o PostgreSQL local)

### Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones
```

### Desarrollo Local

```bash
# Iniciar servidor en modo desarrollo
pnpm dev

# El servidor estará disponible en http://localhost:3000
```

### Build y Producción

```bash
# Compilar TypeScript
pnpm build

# Iniciar servidor de producción
pnpm start
```

## 📁 Estructura del paquete

```
packages/api/
├── api/index.ts              # Handler serverless (Vercel)
├── src/
│   ├── server.ts             # Fastify: env, CORS, rate limit, registro de controllers
│   ├── swagger.ts
│   ├── db/                   # Acceso Prisma
│   ├── controllers/          # Rutas (health, auth, users, companies, company-members, shopflow/*, workify, techservices)
│   ├── services/
│   ├── repositories/
│   ├── dto/
│   ├── core/                 # auth, config, permisos, módulos por empresa (`modules.ts`)
│   ├── common/               # errores, caché (Redis opcional), helpers DB
│   ├── helpers/
│   ├── modules/              # (legacy) re-exports por dominio
│   ├── plugins/              # Fastify plugins por dominio (core/auth/tenant/shopflow/workify/techservices)
│   └── __tests__/            # Vitest (unit + integration)
├── vercel.json
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧩 Arquitectura por plugins (Fastify)

La API sigue siendo **un solo deployable** (`src/server.ts`), pero las rutas se registran mediante plugins por dominio para reducir el “blast radius” y mantener límites claros.

### Orden de registro (importante)

1. **Core**: `env` → `cors` → `rate-limit` (incluye scope público de auth) → `schema-sanitizer` → `errors` → `versioning` → `swagger`
2. **Dominios**: `health` → `auth-protected` → `users` → `tenant` → `shopflow` → `workify` → `techservices`

Mantener este orden ayuda a asegurar que CORS, rate limiting, manejo de errores, versionado y Swagger se apliquen de forma consistente antes de registrar las rutas de dominio.

### Versión en URL

Peticiones a **`/api/v1/...`** se reescriben a **`/api/...`** (mismos handlers). Así los clientes pueden anclar versión sin duplicar código de rutas.

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia servidor en modo desarrollo con hot-reload |
| `pnpm build` | Compila TypeScript a JavaScript |
| `pnpm start` | Inicia servidor de producción |
| `pnpm test` | Ejecuta todos los tests |
| `pnpm test:unit` | Ejecuta solo tests unitarios |
| `pnpm test:integration` | Ejecuta solo tests de integración |

## 🔐 Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Puerto del servidor
PORT=3000

# Orígenes CORS permitidos (separados por coma)
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004

# URL de conexión a Neon PostgreSQL
# Formato: postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Entorno de ejecución
NODE_ENV=development

# JWT (obligatorio en producción)
JWT_SECRET=tu-secreto
JWT_EXPIRES_IN=7d

# Opcional: caché (Upstash Redis), p. ej. módulos por empresa. Sin Redis, no hay caché (siempre BD).
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

### Variables para Render

Ver **`.env.render.example`** en este paquete para un ejemplo orientado a Render.

## 🌐 Áreas de endpoints (detalle en Swagger)

| Prefijo / área | Contenido (resumen) |
|----------------|---------------------|
| `GET /health` | Health check |
| `/api/auth/*` | Registro, login, logout, sesión, empresas del usuario |
| `/api/users` | Usuarios (protegido) |
| `/api/companies`, miembros | Empresas y membresías |
| `/api/shopflow/*` | Ventas, productos, clientes, tiendas, reportes, export, notificaciones, etc. |
| Rutas **workify** | Órdenes de trabajo (módulo habilitado por empresa) |
| Rutas **techservices** | Servicios técnicos / mantenimiento (módulo habilitado) |

Muchas rutas exigen **sesión (cookie) o Bearer JWT** y contexto de compañía. Listado y esquemas: **`/api/docs`** (si está habilitado).

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests unitarios
pnpm test:unit

# Tests de integración
pnpm test:integration

# Modo watch
pnpm test:watch

# Con cobertura
pnpm test:coverage
```

## 🚀 Despliegue

### Vercel (monorepo, Root Directory = `packages/api`)

1. **Root Directory**: deja **Root Directory** = `packages/api` en el proyecto de Vercel.
2. **Incluir el paquete database**: en el proyecto Vercel → **Settings** → **General** → **Root Directory** → activa **"Include source files outside of the Root Directory"**. Así el build que se ejecuta desde la raíz del repo (`cd ../.. && pnpm run build:api`) puede incluir `packages/database` en el despliegue y se evita el error `Cannot find module '.../packages/database/dist/generated/prisma/client'`.
3. El `vercel.json` de `packages/api` ya define la función `api/index.ts`, el build y los rewrites.
4. Variables de entorno en Vercel: `DATABASE_URL`, `JWT_SECRET` (producción) y opcionalmente `CORS_ORIGIN`.

### Render.com

Desde la raíz del monorepo suele hacer falta instalar y compilar con el workspace (p. ej. `pnpm install` y build del paquete API). **Health check:** `GET /health`. Variables: `DATABASE_URL`, `JWT_SECRET`, etc. (ver `.env.render.example`).

## 📝 Notas

- **Fastify 5**, TypeScript, **Zod** donde aplica.
- **Prisma** vía `@multisystem/database`; adaptadores Neon/pg según entorno.
- **Rate limit:** ver sección arriba.
- CORS desde `CORS_ORIGIN` (lista separada por comas).

## 🔗 Enlaces útiles

- [Fastify](https://www.fastify.io/)
- [Neon PostgreSQL](https://neon.tech/)
