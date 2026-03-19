# Multisystem Database

Paquete **@multisystem/database**: schema Prisma (PostgreSQL), migraciones, seed y **PrismaClient** exportado desde `src/client.ts`.

- **Local:** adaptador **`@prisma/adapter-pg`** cuando `DATABASE_URL` apunta a `localhost` o `127.0.0.1`.
- **Neon / cloud:** adaptador **`@prisma/adapter-neon`** en el resto de casos.

Referencias: [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon), [Neon + Prisma](https://neon.com/docs/guides/prisma).

## Contenido

- **Schema:** `prisma/schema.prisma` (modelos workify, shopflow, techservices, usuarios, empresas, módulos, etc.)
- **Migraciones activas:** `prisma/migrations/` · histórico bajo `prisma/migrations_legacy_20260213/` · SQL manual en `prisma/migrations/manual/`
- **Cliente:** `prisma generate` escribe en `dist/generated/prisma`; el build copia a `generated/` para que compile `src/client.ts`; runtime resuelve desde `dist/`

## Estructura

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── migrations/
│   ├── migrations_legacy_20260213/
│   ├── migrations/manual/
│   └── PRISMA_SCHEMA_SPLIT.md   # plan opcional multi-file schema
├── scripts/                     # copy-generated-for-tsc, fix-esm-extensions
├── src/client.ts
├── generated/                   # copia del client tras generate (build)
├── dist/                      # salida tsc + generated en publicación
├── package.json
├── prisma.config.ts
└── tsconfig*.json
```

## Uso

```json
{
  "dependencies": {
    "@multisystem/database": "workspace:*"
  }
}
```

```typescript
import { prisma } from '@multisystem/database'

const users = await prisma.user.findMany()
```

## Scripts

| Comando | Descripción |
|--------|-------------|
| `pnpm build` | `prisma generate` → copia a `generated/` → `tsc` → ajuste extensiones ESM |
| `pnpm generate` | Solo Prisma Client |
| `pnpm migrate:dev` | Crear/aplicar migraciones en desarrollo |
| `pnpm migrate:deploy` | Aplicar migraciones pendientes (CI/prod) |
| `pnpm migrate:deploy:dev` / `migrate:deploy:prod` | `migrate deploy` con `MIGRATE_TARGET` para elegir URL vía `prisma.config.ts` |
| `pnpm db:push` | Empuja schema sin migración (solo dev) |
| `pnpm db:seed` | Seed (`tsx prisma/seed.ts`) |
| `pnpm studio` | Prisma Studio |

## Variables de entorno

Colocar `.env` en **`packages/database/`** (migraciones/seed/studio) y/o la misma **`DATABASE_URL`** en **`packages/api/.env`** para la API.

**PostgreSQL local (Docker):** suele bastar:

```bash
DATABASE_URL=postgresql://multisystem:multisystem@localhost:5432/multisystem
```

**Neon (recomendado en cloud):**

```bash
# Pooled — runtime API y cliente Prisma en serverless
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Directa — migraciones, Studio (host sin -pooler)
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

- **`prisma.config.ts`** usa `DATABASE_URL`, `DIRECT_URL` y opcionalmente **`DATABASE_URL_ENV`**, **`MIGRATE_TARGET=production`** (prioriza `DIRECT_URL` para migrar contra prod) y **`SHADOW_DATABASE_URL`** (diff/migrate; en local puede derivarse a `…/multisystem_shadow`).

`pnpm generate` no necesita BD. Migrate/seed/studio sí. [Neon Console](https://console.neon.tech) → Connect para ambas URLs.

## Seeds

El seed cubre **workify**, **shopflow** y **techservices** (registros `Module`, permisos hub, datos de ejemplo por módulo).

### Ejecutar Seeds

```bash
pnpm --filter @multisystem/database db:seed
# o: cd packages/database && pnpm db:seed
```

### Contenido del Seed

El seed incluye:

**Workify:**
- Empresa de ejemplo (Acme Inc.)
- Departamentos (Recursos Humanos, Tecnología)
- Posiciones (Gerente, Desarrollador)
- Roles (Administrador, Empleado)
- Turnos de trabajo (Mañana, Tarde)
- Usuarios de ejemplo (admin@acme.com, user@acme.com)
- Empleados vinculados a usuarios
- Días festivos

**Techservices:** módulo `techservices` en BD, permiso `techservices.access`; las empresas de ejemplo pueden tener el módulo contratado (el seed no crea aún activos/órdenes de ejemplo salvo que el script lo amplíe).

**Shopflow:**
- Categorías (Electrónica, Ropa)
- Proveedores (Tech Supplies Inc., Fashion Wholesale)
- Productos de ejemplo (Laptop Dell XPS 15, Camiseta Básica)
- Clientes (Juan Pérez, María García)
- Configuración de tienda
- Configuración de tickets
- Configuración de fidelidad
- Venta de ejemplo con puntos de fidelidad

**Nota**: El seed limpia todos los datos existentes antes de insertar nuevos datos.

**Locales de venta (Shopflow)**: El seed crea dos locales por empresa (Acme y Beta). Para que el selector "Local de venta" en Shopflow muestre opciones, la **API** debe usar la **misma base de datos** que usaste para el seed: configura la misma `DATABASE_URL` en `api/.env` que en `database/.env` (o la que usas al ejecutar `pnpm db:seed`).

## Migraciones

```bash
pnpm --filter @multisystem/database migrate:dev -- --name nombre_migracion
pnpm --filter @multisystem/database generate
```

En despliegue: `pnpm --filter @multisystem/database migrate:deploy`.

## Referencias

- [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon)
- [Neon – Connect from Prisma](https://neon.com/docs/guides/prisma)
- [PRISMA_SCHEMA_SPLIT.md](./prisma/PRISMA_SCHEMA_SPLIT.md) — plan para dividir el schema por dominio (el schema actual sigue en un solo archivo hasta aplicarlo).
