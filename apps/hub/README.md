# Multisystem Hub

Landing page de la plataforma Multisystem. Punto de entrada unificado para acceder a los distintos módulos del ecosistema.

**Hub no incluye servicios ni módulos propios** — es únicamente una página de bienvenida que enlaza a las aplicaciones independientes.

## Arquitectura del Proyecto

La carpeta raíz `multisystem/` es solo una **carpeta contenedora**; no es un monorepo único. El Hub es un **proyecto independiente** dentro de ese contenedor; cada módulo es un monorepo propio y se mantiene en su propia rama de Git. Estructura:

```
multisystem/                 # Carpeta contenedora (no workspace raíz)
├── hub/                     ← Este proyecto (landing)
├── api/                     # API REST compartida (Fastify)
├── database/                # Base de datos (Prisma + Neon PostgreSQL)
├── shopflow/                # Módulo POS e inventario
├── workify/                 # Módulo de empleados y horarios
├── techservices/           # Módulo de servicios técnicos
└── component-library/       # Biblioteca UI (@multisystem/ui)
```

### Responsabilidades

| Proyecto | Descripción |
|----------|-------------|
| **Hub** | Landing page estática. Enlaces a ShopFlow, Workify y TechServices. Health check en `/health`. |
| **database** | Schema Prisma, migraciones y cliente. Consumido por la API. |
| **api** | API REST compartida. Consumida por los frontends como proyecto independiente. |
| **shopflow** | Sistema de punto de venta y gestión de inventario. Consume la API. |
| **workify** | Sistema de gestión de empleados y horarios. Consume la API. |
| **techservices** | Sistema de órdenes de trabajo y activos técnicos. Consume la API. |

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

- **Base de datos**: `database` — Schema Prisma, migraciones y cliente
- **API compartida**: `api` — Endpoints REST para los frontends
- **ShopFlow**: `shopflow` — Punto de venta e inventario
- **Workify**: `workify` — Empleados y horarios
- **TechServices**: `techservices` — Órdenes de trabajo y activos
