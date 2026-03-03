# Multisystem

Plataforma modular multi-empresa para gestión de órdenes de trabajo, ventas y servicios técnicos.

## Estructura del monorepo

Este proyecto usa **pnpm** + **Turborepo** para gestionar múltiples apps y paquetes compartidos.

```
multisystem/
├── apps/
│   └── techservices/     # App Next.js - Órdenes de trabajo y mantenimiento
├── packages/
│   ├── api/              # API REST Fastify compartida
│   └── contracts/        # Tipos y contratos compartidos
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### Apps

| App | Puerto | Descripción |
|-----|--------|-------------|
| **techservices** | 3004 | Módulo de órdenes de trabajo, activos y visitas programadas |

### Paquetes

| Paquete | Descripción |
|---------|-------------|
| **@multisystem/api** | API Fastify con auth JWT, Swagger, CORS |
| **@multisystem/contracts** | Tipos compartidos (auth, company, ApiResponse) |

### Módulos de negocio

Las empresas pueden activar estos módulos:

- **workify** — Órdenes de trabajo
- **shopflow** — Ventas, productos, clientes, proveedores, reportes
- **techservices** — Servicios técnicos y mantenimiento

---

## Requisitos

- Node.js 20+
- pnpm 10+
- Base de datos PostgreSQL (Neon recomendado)

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
# Iniciar todos los servicios (API + apps) en paralelo
pnpm dev
```

- **API:** http://localhost:3000  
- **Swagger:** http://localhost:3000/api/docs  
- **Techservices:** http://localhost:3004  

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
| `CORS_ORIGIN` | Orígenes CORS separados por coma | localhost:3003,3004,3005 |
| `JWT_SECRET` | Clave para firmar tokens | (requerido en prod) |
| `JWT_EXPIRES_IN` | Expiración del token | 7d |
| `NODE_ENV` | Entorno | development |

Para **techservices**, definir `NEXT_PUBLIC_API_URL` si la API no está en `http://localhost:3000`.

---

## Stack tecnológico

- **Monorepo:** pnpm workspaces, Turborepo
- **API:** Fastify 5, Zod, JWT, Swagger
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **BD:** Prisma (vía `@multisystem/database`)
- **Lenguaje:** TypeScript (strict)

---

## Documentación adicional

- [API - README](./packages/api/README.md) — Detalle de endpoints, Swagger y despliegue
