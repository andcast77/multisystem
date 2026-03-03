# Multisystem Database

Servicio Prisma + **Neon** (Postgres serverless): schema, migraciones y cliente. Configurado según [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon) y [Neon Prisma guide](https://neon.com/docs/guides/prisma).

## Contenido

- **Prisma Schema**: Definición de la base de datos
- **Migraciones**: `prisma/migrations`
- **Cliente**: Generado en `generated/prisma`, exportado vía `src/client.ts` usando `@prisma/adapter-neon` (driver serverless de Neon)

## Estructura

```
database/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── generated/
│   └── prisma/
├── src/
│   └── client.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
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
| `pnpm generate` | Genera Prisma Client |
| `pnpm migrate:dev` | Migraciones en desarrollo |
| `pnpm migrate:deploy` | Migraciones en producción |
| `pnpm db:push` | Sincroniza schema con BD |
| `pnpm db:seed` | Ejecuta seeds para llenar BD con datos iniciales |
| `pnpm studio` | Prisma Studio |

## Variables de entorno (Neon)

En `.env` en la raíz del servicio:

```bash
# Pooled (Prisma Client en runtime). Usar URL con -pooler en el host.
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Directa (Prisma CLI: migrate, studio, etc.). Sin -pooler.
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

- **DATABASE_URL**: conexión **pooled** (`-pooler`), usada por el cliente en la API.
- **DIRECT_URL**: conexión **directa**, usada por `prisma migrate`, `prisma studio`, etc. Si no existe, el CLI usa `DATABASE_URL`.

`pnpm generate` no necesita BD; migrate/studio requieren al menos una de las dos en `.env`. Ambas en [Neon Console](https://console.neon.tech) → Connect. Opcional: `?sslmode=require&connect_timeout=10` para evitar timeouts en cold start.

## Seeds

El proyecto incluye un seed completo con datos iniciales para ambos módulos (Workify y Shopflow).

### Ejecutar Seeds

```bash
cd database
pnpm db:seed
```

O usando Prisma directamente:

```bash
cd database
pnpm prisma db seed
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
cd database
pnpm migrate:dev --name nombre_migracion
pnpm generate
```

## Referencias

- [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon)
- [Neon – Connect from Prisma](https://neon.com/docs/guides/prisma)
