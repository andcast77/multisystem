# Multisystem Hub

Landing page de la plataforma Multisystem. Punto de entrada unificado para acceder a los distintos módulos del ecosistema.

**Hub no incluye servicios ni módulos propios** — es únicamente una página de bienvenida que enlaza a las aplicaciones independientes.

## Arquitectura del Proyecto

Multisystem está organizado como un monorepo con la siguiente estructura:

```
multisystem/
├── hub/                    ← Este proyecto (landing)
├── services/
│   ├── database/           # Base de datos (Prisma + Neon PostgreSQL)
│   └── api/                # API REST compartida (Fastify)
└── modules/
    ├── shopflow/           # Módulo POS e inventario
    └── workify/            # Módulo de empleados y horarios
```

### Responsabilidades

| Proyecto | Descripción |
|----------|-------------|
| **Hub** | Landing page estática. Enlaces a ShopFlow y Workify. Health check en `/health`. |
| **services/database** | Schema Prisma, migraciones y cliente. Consumido por la API y los módulos como proyecto independiente. |
| **services/api** | API REST compartida. Consumida por los módulos como proyecto independiente. |
| **modules/shopflow** | Sistema de punto de venta y gestión de inventario. Consume `database` y `api`. |
| **modules/workify** | Sistema de gestión de empleados y horarios. Consume `database` y `api`. |

Cada módulo es un proyecto independiente que consume los servicios de base de datos y API según sus necesidades.

## Inicio Rápido

### Prerrequisitos

- Node.js 20+
- pnpm

### Instalación

```bash
pnpm install
```

### Desarrollo

```bash
# Solo el Hub (landing) en http://localhost:3001
pnpm dev

# Todos los proyectos del ecosistema
pnpm projects
```

### Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia el Hub en modo desarrollo (puerto 3001) |
| `pnpm build` | Build de producción |
| `pnpm start` | Inicia el servidor de producción |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm api` | Inicia el servicio API |
| `pnpm shopflow` | Inicia el módulo ShopFlow |
| `pnpm workify` | Inicia el módulo Workify |
| `pnpm projects` | Inicia API, ShopFlow, Workify y Hub |

## Estructura del Hub

```
src/
└── app/
    ├── layout.tsx      # Layout raíz
    ├── page.tsx        # Página principal (landing)
    ├── globals.css     # Estilos globales
    └── health/
        └── route.ts    # Health check GET /health
```

## Despliegue

El Hub está configurado para Vercel:

- **Build**: `pnpm build`
- **Health check**: `GET /health`
- **Rewrites**: `/api/*`, `/shopflow/*` y `/workify/*` se redirigen a los servicios desplegados externamente

## Variables de Entorno

Copia `env.example` a `.env` si necesitas configurar URLs de los módulos o la API. Para el Hub como landing estática, no son obligatorias en desarrollo local.

## Enlaces Relacionados

- **Base de datos**: `services/database` — Schema Prisma, migraciones y cliente
- **API compartida**: `services/api` — Endpoints REST para los módulos
- **ShopFlow**: `modules/shopflow` — Punto de venta e inventario
- **Workify**: `modules/workify` — Empleados y horarios
