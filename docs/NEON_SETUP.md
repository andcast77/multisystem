# 🚀 Guía de Configuración de Neon

Esta guía te ayudará a configurar Neon como base de datos para el proyecto Multisystem.

## ⚠️ Importante: Arquitectura del Proyecto

- **`multisystem/`** (hub): Proyecto Next.js principal - **NO tiene Prisma**
- **`services/database/`**: Repositorio independiente - **SÍ tiene Prisma**
- La base de datos se configura en `services/database/`, no en el proyecto raíz

## ¿Por qué Neon?

- ✅ **3 GB gratis** (vs 500 MB de otras opciones)
- ✅ **10 branches** de base de datos (dev, staging, prod)
- ✅ **Auto-suspensión** cuando no se usa (ahorra recursos)
- ✅ **Point-in-time recovery** de 30 días
- ✅ **Perfecto con Prisma** - migraciones funcionan automáticamente

## 📋 Paso 1: Crear Proyecto en Neon

1. **Crear cuenta**:
   - Ve a [neon.tech](https://neon.tech)
   - Haz clic en "Sign Up" (puedes usar GitHub/Google)
   - Confirma tu email si es necesario

2. **Crear proyecto**:
   - Haz clic en "Create a project"
   - **Nombre del proyecto**: `multisystem` (o el que prefieras)
   - **Región**: Selecciona la más cercana (US, EU, o APAC)
   - **PostgreSQL version**: 16 (recomendado)
   - Haz clic en "Create project"
   - Espera 30-60 segundos mientras se crea

3. **Obtener connection string**:
   - Una vez creado, verás el dashboard
   - En la sección "Connection Details", verás la **Connection string**
   - Haz clic en "Copy" para copiarla
   - Formato: `postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`
   - ⚠️ **Importante**: Copia la contraseña inmediatamente, no podrás verla de nuevo

## 📋 Paso 2: Crear Branches (Opcional pero Recomendado)

Neon permite crear "branches" (copias de la BD) para diferentes entornos:

1. **Crear branch para desarrollo**:
   - En el dashboard, ve a "Branches"
   - Haz clic en "Create branch"
   - Nombre: `dev`
   - Haz clic en "Create"
   - Copia la connection string del branch `dev`

2. **Crear branch para producción**:
   - Repite el proceso para crear un branch `prod`
   - Usa este branch para producción

**Ventaja**: Cada branch es independiente, puedes tener datos de prueba en `dev` sin afectar `prod`.

## 📋 Paso 3: Configurar Variables de Entorno

### En el proyecto raíz (multisystem/)

1. **Actualizar `.env` en la raíz**:
   ```bash
   # En d:\Projects\multisystem\.env
   DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```

   **Ejemplo real**:
   ```bash
   DATABASE_URL=postgresql://neondb_owner:npg_abc123xyz@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### En services/database/

2. **Configurar `services/database/.env`**:
   
   El proyecto `services/database` necesita su propio `.env` con `DATABASE_URL`:
   
   ```bash
   # Ir a services/database
   cd services/database
   
   # Crear .env con la connection string de Neon
   echo "DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require" > .env
   ```
   
   **O copiar desde el .env de la raíz**:
   ```bash
   # Desde la raíz del proyecto
   cp .env services/database/.env
   ```

## 📋 Paso 4: Configurar Prisma en services/database

**Importante**: Prisma está SOLO en `services/database/`, NO en el proyecto `multisystem` (hub).

1. **Clonar el repositorio de database** (si aún no lo tienes):
   ```bash
   # Desde la raíz del proyecto multisystem
   ./scripts/setup-submodules.sh
   # O en Windows PowerShell:
   .\scripts\setup-submodules.ps1
   
   # O manualmente:
   git clone https://github.com/andcast77/multisystem-database.git services/database
   ```

2. **Verificar schema Prisma**:
   
   Verifica que `services/database/prisma/schema.prisma` tenga:
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

## 📋 Paso 5: Ejecutar Migraciones desde services/database

**Todas las operaciones de Prisma se hacen desde `services/database/`:**

1. **Ir al directorio de database**:
   ```bash
   cd services/database
   ```

2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

3. **Generar cliente Prisma**:
   ```bash
   pnpm prisma generate
   ```

4. **Aplicar schema a Neon**:
   ```bash
   # Opción rápida (desarrollo):
   pnpm prisma db push
   
   # Opción formal (recomendada para producción):
   pnpm prisma migrate dev --name init
   ```

5. **Verificar conexión**:
   ```bash
   pnpm prisma studio
   ```
   - Esto abrirá Prisma Studio en tu navegador
   - Deberías ver las tablas creadas en Neon
   - Si ves las tablas, ¡la conexión funciona! ✅

## 📋 Paso 6: Verificar en Neon Dashboard

1. Ve al dashboard de Neon
2. Haz clic en "Tables" o "SQL Editor"
3. Deberías ver todas las tablas creadas por Prisma
4. Puedes ejecutar queries SQL directamente desde el dashboard

## 🔄 Actualización Automática con Prisma

**Importante**: Todas las operaciones de Prisma se hacen desde `services/database/`, NO desde el proyecto raíz.

Neon se actualiza automáticamente cuando ejecutas migraciones Prisma:

```bash
# 1. Ir a services/database
cd services/database

# 2. Modificar schema.prisma (si es necesario)
# Editar: services/database/prisma/schema.prisma

# 3. Ejecutar migración
pnpm prisma migrate dev --name descripcion_cambio

# 4. Los cambios se aplican automáticamente a Neon ✅
```

**Recordatorio**: El proyecto `multisystem` (hub) NO tiene Prisma. Solo `services/database` lo tiene.

## 🌐 Configurar para Producción

### En Railway (si usas Railway para backend)

1. Ve al dashboard de Railway
2. Selecciona tu proyecto
3. Ve a "Variables"
4. Agrega `DATABASE_URL` con tu connection string de Neon (branch `prod`)
5. Guarda los cambios

### En Vercel (si usas Vercel)

1. Ve al dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a "Settings" → "Environment Variables"
4. Agrega `DATABASE_URL` con tu connection string de Neon
5. Selecciona los entornos (Production, Preview, Development)
6. Guarda

## 🎯 Usar Branches para Diferentes Entornos

**Recomendación**: Usa diferentes branches de Neon para diferentes entornos:

```bash
# services/database/.env.development
DATABASE_URL=postgresql://[user]:[password]@[endpoint-dev].neon.tech/neondb?sslmode=require

# services/database/.env.production
DATABASE_URL=postgresql://[user]:[password]@[endpoint-prod].neon.tech/neondb?sslmode=require
```

## 🐛 Solución de Problemas

### Error: "Connection refused"

- Verifica que la connection string sea correcta
- Asegúrate de incluir `?sslmode=require`
- Verifica que el proyecto en Neon esté activo (no suspendido)
- Verifica que `services/database/.env` tenga la `DATABASE_URL` correcta

### Error: "Database does not exist"

- Verifica que el nombre de la base de datos en la URL sea correcto (generalmente `neondb` o `multiflow`)
- Si creaste una base de datos con otro nombre, úsala en la URL

### Error: "Password authentication failed"

- La contraseña se muestra solo una vez al crear el proyecto
- Si la perdiste, ve a "Settings" → "Database" → "Reset password"
- Actualiza la `DATABASE_URL` en ambos `.env` (raíz y `services/database/`)

### La base de datos está suspendida

- Neon suspende automáticamente las bases de datos inactivas
- Simplemente haz una query y se reactivará automáticamente
- Puede tomar 1-2 segundos en reactivarse

### Error: "Cannot find module '@prisma/client'"

- Asegúrate de estar en `services/database/` (no en la raíz)
- Ejecuta `pnpm install` desde `services/database/`
- El proyecto raíz NO debe tener Prisma instalado

## 📚 Recursos Adicionales

- [Documentación de Neon](https://neon.tech/docs)
- [Neon con Prisma](https://neon.tech/docs/guides/prisma)
- [Branches en Neon](https://neon.tech/docs/guides/branching)

## ✅ Checklist

- [ ] Cuenta creada en Neon
- [ ] Proyecto creado en Neon
- [ ] Connection string copiada
- [ ] Branch `dev` creado (opcional)
- [ ] Branch `prod` creado (opcional)
- [ ] `DATABASE_URL` actualizada en `.env` (raíz del proyecto)
- [ ] `services/database/` clonado (repositorio independiente)
- [ ] `DATABASE_URL` configurada en `services/database/.env`
- [ ] `cd services/database && pnpm install`
- [ ] `cd services/database && pnpm prisma generate`
- [ ] `cd services/database && pnpm prisma db push` (o `prisma migrate dev`)
- [ ] Conexión verificada con `cd services/database && pnpm prisma studio`
- [ ] Tablas visibles en Neon dashboard
- [ ] `DATABASE_URL` configurada en Railway/Vercel (producción)

**Nota importante**: 
- ✅ Prisma está SOLO en `services/database/`
- ❌ El proyecto `multisystem` (hub) NO tiene Prisma
- ✅ Todas las operaciones de BD se hacen desde `services/database/`

## 🎉 ¡Listo!

Tu base de datos Neon está configurada y lista para usar. Las migraciones Prisma se aplicarán automáticamente cada vez que ejecutes `prisma migrate dev` o `prisma db push` desde `services/database/`.
