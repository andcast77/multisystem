---
name: Organizar proyecto multisystem
overview: Aislar el build del hub excluyendo services/ y modules/, asegurando que cada componente sea independiente y se comunique solo por HTTP.
todos:
  - id: update-dockerignore
    content: Actualizar .dockerignore para excluir explícitamente services/ y modules/
    status: pending
  - id: update-tsconfig
    content: Actualizar tsconfig.json para excluir services/ y modules/ de la compilación
    status: pending
  - id: verify-dockerfile
    content: Verificar que Dockerfile no copia services/ o modules/ (debe respetar .dockerignore)
    status: pending
  - id: verify-http-communication-hub
    content: Verificar que el código del hub solo usa HTTP para comunicarse con servicios/módulos
    status: pending
  - id: verify-subproject-independence
    content: Verificar que services/api NO importa de services/database (solo HTTP) y eliminar dependencias directas
    status: pending
  - id: verify-modules-independence
    content: Verificar que modules/shopflow y modules/workify NO importan de services/ (solo HTTP)
    status: pending
  - id: update-env-example
    content: Verificar y actualizar env.example con todas las URLs necesarias para comunicación HTTP
    status: pending
  - id: document-architecture
    content: Actualizar README.md documentando la arquitectura de comunicación por HTTP y la independencia de subproyectos
    status: pending
---

# Plan: Organización del Proyecto Multisystem

## Objetivo

Aislar completamente el build del hub para que excluya `services/` y `modules/`, asegurando que cada componente (hub, servicios, módulos) sea una instancia independiente que se comunique únicamente por HTTP. **Todos los subproyectos también deben ser independientes entre sí, sin dependencias directas (imports), solo comunicación por HTTP.**

## Análisis de la Situación Actual

### Problemas Identificados

1. **Dockerfile del Hub**: Copia todo el directorio raíz (`COPY . .`), incluyendo `services/` y `modules/` que son submodules independientes
2. **tsconfig.json**: No excluye explícitamente `services/` y `modules/` de la compilación
3. **.dockerignore**: Ya excluye algunos directorios pero puede mejorarse
4. **Dependencias**: Necesitamos verificar que no hay imports directos de services/modules en el código del hub
5. **Dependencias entre subproyectos**: Verificar que services/api NO importa de services/database (solo HTTP)
6. **Dependencias entre módulos y servicios**: Verificar que modules/shopflow y modules/workify NO importan de services (solo HTTP)

### Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────┐
│                    Usuario Final                        │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
   ┌────▼────┐                    ┌────▼────┐
   │   Hub   │                    │  Nginx  │
   │ (3000)  │                    │  (80)   │
   └────┬────┘                    └────┬────┘
        │                               │
        │ HTTP Requests                 │ HTTP Requests
        │                               │
   ┌────┴───────────────────────────────┴────┐
   │                                           │
┌──▼──────────┐  ┌──────────┐  ┌──────────────▼──┐
│  Services   │  │ Modules  │  │   Services API   │
│  (submod)   │  │(submod)  │  │   (3001, 3002)  │
└─────────────┘  └──────────┘  └──────────────────┘
```

**Arquitectura de APIs (Separación Mantenida)**:

```
Frontends (Hub, ShopFlow, Workify)
    │ HTTP
    ▼
API Principal (puerto 3001) - services/api
    │ HTTP (DATABASE_API_URL)
    ▼
Database API (puerto 3002) - services/database
    │ Prisma Client
    ▼
PostgreSQL (puerto 5432)
```

**Principios**:

- ✅ Cada componente es independiente (diferentes builds, diferentes contenedores)
- ✅ Comunicación solo por HTTP (variables de entorno con URLs)
- ✅ **Sin dependencias directas entre componentes** (no imports, no file:../, no workspaces compartidos)
- ✅ Cada componente tiene su propio repositorio (submodules)
- ✅ **Separación de APIs mantenida**: API Principal (3001) y Database API (3002) son servicios independientes
- ✅ **Subproyectos independientes**: services/api NO importa de services/database, modules NO importan de services

## Cambios a Realizar

### 1. Actualizar Dockerfile del Hub

**Archivo**: `Dockerfile`

**Cambios**:

- Excluir `services/` y `modules/` del contexto de build
- Asegurar que solo se copien archivos del hub
- Mantener la estructura multi-stage existente

**Estrategia**:

- Usar `.dockerignore` para excluir directorios (más eficiente)
- O usar `COPY` selectivo en lugar de `COPY . .`

### 2. Actualizar .dockerignore

**Archivo**: `.dockerignore`

**Cambios**:

- Agregar exclusiones explícitas para `services/` y `modules/`
- Mantener exclusiones existentes
- Asegurar que los submodules no se incluyan en el build

### 3. Actualizar tsconfig.json

**Archivo**: `tsconfig.json`

**Cambios**:

- Agregar exclusiones explícitas para `services/` y `modules/` en el array `exclude`
- Asegurar que TypeScript no intente compilar código de submodules

### 4. Verificar Comunicación por HTTP en Hub

**Archivo**: `next.config.js`, código del hub

**Verificaciones**:

- Asegurar que todas las referencias a servicios/módulos usen variables de entorno
- Verificar que no hay imports directos de `services/` o `modules/`
- Confirmar que las URLs se obtienen de `process.env.NEXT_PUBLIC_*`

### 5. Verificar Independencia de Subproyectos

**Archivos**: `services/api/package.json`, `services/database/package.json`, `modules/*/package.json`

**Verificaciones**:

- **services/api**: NO debe tener dependencia `file:../database` o `@multisystem/database`
- **services/api**: Solo debe usar `DATABASE_API_URL` (HTTP) para comunicarse con database
- **modules/shopflow y modules/workify**: NO deben tener dependencias de `services/`
- **modules/shopflow y modules/workify**: Solo deben usar `NEXT_PUBLIC_API_URL` (HTTP)
- Verificar que no hay imports directos entre subproyectos en el código

### 6. Actualizar Variables de Entorno

**Archivo**: `env.example`

**Verificaciones**:

- Asegurar que todas las URLs de servicios y módulos estén definidas
- Confirmar que las URLs apuntan a servicios remotos (no rutas locales)
- Documentar que `DATABASE_API_URL` es para uso interno de services/api

## Implementación Detallada

### Paso 1: Actualizar .dockerignore

Agregar exclusiones explícitas:

```
# Submodules (instancias independientes)
services/
modules/

# Mantener exclusiones existentes
...
```

### Paso 2: Actualizar tsconfig.json

Agregar a `exclude`:

```json
{
  "exclude": [
    "node_modules",
    "services",
    "modules",
    ".next"
  ]
}
```

### Paso 3: Verificar Dockerfile

El Dockerfile actual usa `COPY . .` que respetará `.dockerignore`. Verificar que:

- No hay copias explícitas de `services/` o `modules/`
- Asegurar que el contexto de build es solo la raíz del hub

### Paso 4: Verificar Código del Hub

Buscar y eliminar cualquier import directo:

```bash
# Buscar imports problemáticos en hub
grep -r "from.*services" src/
grep -r "from.*modules" src/
grep -r "import.*services" src/
grep -r "import.*modules" src/
```

### Paso 4b: Verificar Independencia de Subproyectos

Verificar que cada subproyecto es independiente:

```bash
# Verificar que services/api NO importa de services/database
cd services/api
grep -r "from.*database" src/
grep -r "import.*database" src/
grep -r "@multisystem/database" package.json
grep -r "file:../database" package.json

# Verificar que modules NO importan de services
cd ../../modules/shopflow
grep -r "from.*services" src/
grep -r "import.*services" src/

cd ../workify
grep -r "from.*services" src/
grep -r "import.*services" src/
```

**Verificaciones en package.json**:

- `services/api/package.json`: NO debe tener `"@multisystem/database": "file:../database"`
- `modules/*/package.json`: NO deben tener dependencias de `services/`

### Paso 5: Actualizar next.config.js (si es necesario)

Asegurar que no hay referencias a rutas locales de services/modules:

```javascript
// ✅ Correcto: usar variables de entorno
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// ❌ Incorrecto: rutas locales
// const apiUrl = './services/api'
```

### Paso 6: Eliminar Dependencias Directas entre Subproyectos

Si existen dependencias directas, eliminarlas:

**En `services/api/package.json`**:

```json
// ❌ Eliminar si existe:
{
  "dependencies": {
    "@multisystem/database": "file:../database"  // ← ELIMINAR
  }
}

// ✅ Correcto: sin dependencias de database
{
  "dependencies": {
    // Solo dependencias npm públicas
  }
}
```

**En código de `services/api/`**:

```typescript
// ❌ Eliminar si existe:
import { prisma } from '@multisystem/database'
import { prisma } from '../database'

// ✅ Correcto: comunicación por HTTP
const response = await fetch(`${process.env.DATABASE_API_URL}/query`, {
  method: 'POST',
  body: JSON.stringify({ query: '...' })
})
```

### Paso 7: Documentar Arquitectura

Actualizar `README.md` para reflejar:

- Que services/ y modules/ son instancias independientes
- Que la comunicación es solo por HTTP
- Que los subproyectos NO dependen unos de otros (solo HTTP)
- Cómo configurar las URLs de servicios/módulos

## Estructura de Archivos Resultante

```
multisystem/
├── Dockerfile              # ✅ Solo build del hub (excluye services/, modules/)
├── .dockerignore          # ✅ Excluye services/, modules/
├── tsconfig.json          # ✅ Excluye services/, modules/
├── next.config.js         # ✅ Usa variables de entorno para URLs
├── package.json           # ✅ Solo dependencias del hub
├── src/                   # ✅ Código del hub
│   └── app/
├── services/              # 🔗 Submodule (NO incluido en build)
│   ├── api/
│   └── database/
├── modules/               # 🔗 Submodules (NO incluidos en build)
│   ├── shopflow/
│   └── workify/
└── docker-compose.yml     # ✅ Orquesta servicios independientes
```

## Comunicación por HTTP

### Arquitectura de Comunicación

La arquitectura mantiene **dos APIs separadas** que se comunican por HTTP:

1. **API Principal (puerto 3001)** - `services/api/`

   - Lógica de negocio
   - Endpoints de ShopFlow, Workify, etc.
   - Consume Database API por HTTP

2. **Database API (puerto 3002)** - `services/database/`

   - Expone Prisma como API HTTP
   - Gestiona schema y migraciones
   - Se conecta directamente a PostgreSQL

**Flujo de Comunicación**:

```
Frontends → API Principal (3001) → Database API (3002) → PostgreSQL
```

### Variables de Entorno Requeridas

```env
# URLs de servicios (HTTP)
# API Principal - Lógica de negocio
NEXT_PUBLIC_API_URL=http://api:3001

# Database API - Gestión de base de datos (usada internamente por API Principal)
# Nota: Los frontends NO consumen directamente Database API
DATABASE_API_URL=http://database:3002

# URLs de módulos frontend (HTTP)
NEXT_PUBLIC_SHOPFLOW_URL=http://shopflow-frontend:3003
NEXT_PUBLIC_WORKIFY_URL=http://workify-frontend:3004
```

### Ejemplo de Uso en Código

```typescript
// ✅ Correcto: Frontend (hub, shopflow, workify) consume API Principal por HTTP
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)

// ✅ Correcto: API Principal consume Database API por HTTP
// (dentro de services/api/src/)
const dbResponse = await fetch(`${process.env.DATABASE_API_URL}/query`, {
  method: 'POST',
  body: JSON.stringify({ query: 'SELECT * FROM products' })
})

// ❌ Incorrecto: import directo desde submodules
// import { getProducts } from '../services/api'
// import { prisma } from '../services/database'
// import { prisma } from '@multisystem/database'  // ← NO en services/api
```

### Reglas de Independencia entre Subproyectos

**services/api NO debe:**

- ❌ Importar de `services/database` (ni `file:../database` ni `@multisystem/database`)
- ❌ Tener dependencia en `package.json` hacia `services/database`
- ✅ Solo usar `DATABASE_API_URL` para comunicación HTTP

**modules/shopflow y modules/workify NO deben:**

- ❌ Importar de `services/api` o `services/database`
- ❌ Tener dependencias en `package.json` hacia `services/`
- ✅ Solo usar `NEXT_PUBLIC_API_URL` para comunicación HTTP

**services/database:**

- ✅ Es completamente independiente
- ✅ Expone su funcionalidad solo por HTTP (puerto 3002)

## Verificaciones Post-Implementación

1. **Build del Hub**: Debe completarse sin errores y sin incluir services/modules
2. **Tamaño de Imagen Docker**: Debe ser menor (sin código de submodules)
3. **TypeScript**: No debe reportar errores de servicios/modules
4. **Comunicación**: El hub debe comunicarse con servicios/módulos por HTTP
5. **Docker Compose**: Todos los servicios deben iniciar independientemente
6. **Independencia de Subproyectos**:

   - `services/api/package.json` NO tiene dependencia de `services/database`
   - `modules/*/package.json` NO tienen dependencias de `services/`
   - No hay imports directos entre subproyectos en el código
   - Todos los subproyectos se comunican solo por HTTP

## Beneficios

1. ✅ **Builds Independientes**: Cada componente se construye por separado
2. ✅ **Despliegue Independiente**: Cada servicio/módulo puede desplegarse por separado
3. ✅ **Sin Acoplamiento**: No hay dependencias directas entre componentes
4. ✅ **Escalabilidad**: Fácil agregar nuevos servicios/módulos
5. ✅ **Mantenibilidad**: Cambios en un componente no afectan a otros
6. ✅ **Claridad**: Separación clara de responsabilidades

## Notas Importantes

- Los submodules (`services/`, `modules/`) seguirán existiendo en el repositorio pero NO se incluirán en el build del hub
- Docker Compose seguirá orquestando todos los servicios, pero cada uno se construye independientemente
- La comunicación entre componentes es exclusivamente por HTTP usando variables de entorno
- Cada servicio/módulo tiene su propio Dockerfile y se construye desde su propio contexto
- **Separación de APIs mantenida**: 
  - API Principal (3001) y Database API (3002) son servicios independientes
  - La API Principal consume Database API por HTTP (no por import directo)
  - Los frontends solo consumen la API Principal, nunca Database API directamente
- **Independencia total entre subproyectos**:
  - `services/api` NO importa de `services/database` (solo HTTP)
  - `modules/shopflow` y `modules/workify` NO importan de `services/` (solo HTTP)
  - Cada subproyecto tiene su propio `package.json` sin dependencias entre ellos
  - No se usan `file:../` ni workspaces compartidos entre subproyectos
  - La única forma de comunicación es HTTP con URLs configuradas por variables de entorno
