# Multisystem

Plataforma modular que integra múltiples aplicaciones independientes (monorepos) a través de una API compartida y un sistema de proxy reverso.

## 🏗️ Arquitectura

Multisystem está estructurado en tres categorías principales con **comunicación exclusivamente por HTTP**:

### Servicios Compartidos (Infraestructura de Multisystem)
- **`services/api/`** - API Principal (puerto 3001) - Lógica de negocio
  - 🔗 **Git Submodule** - Servicio compartido que consumen todos los módulos frontend
  - Consume Database API por HTTP (no por import directo)
- **`services/database/`** - Database API (puerto 3002) - Gestión de base de datos
  - 🔗 **Git Submodule** - Expone Prisma como API HTTP
  - Se conecta directamente a PostgreSQL
- **`scripts/`** - Scripts de utilidad para desarrollo

**Nota**: `services/api/` y `services/database/` son servicios independientes con sus propios repositorios Git, configurados como **Git Submodules**. La comunicación entre ellos es exclusivamente por HTTP.

### Hub (Plataforma Principal)
- **Raíz del repositorio** - La aplicación Next.js de multisystem está en la raíz
  - ✅ **Parte del repositorio principal** - No es un submodule
  - Es la aplicación central que integra todos los módulos
  - Contiene `package.json`, `src/`, `next.config.js`, etc. directamente en la raíz
  - **Build independiente**: El build del hub excluye `services/` y `modules/` (submodules)
  - **Comunicación por HTTP**: Solo se comunica con servicios/módulos mediante variables de entorno

### Módulos Frontend como Repositorios Independientes
- **`multisystem-shopflow/`** - Módulo ShopFlow (repositorio independiente)
- **`multisystem-workify/`** - Módulo Workify (repositorio independiente)

**⚠️ Importante**: Los módulos frontend son **repositorios Git completamente independientes** (NO submodules) para compatibilidad con Vercel. Cada módulo se despliega en su propio dominio en Vercel y consume la API compartida **únicamente por HTTP**.

Ver [docs/MODULES_AS_INDEPENDENT_REPOS.md](docs/MODULES_AS_INDEPENDENT_REPOS.md) para más detalles.

### Arquitectura de Comunicación

```
Frontends (Hub, ShopFlow, Workify)
    │ HTTP (NEXT_PUBLIC_API_URL)
    ▼
API Principal (puerto 3001) - services/api
    │ HTTP (DATABASE_API_URL)
    ▼
Database API (puerto 3002) - services/database
    │ Prisma Client
    ▼
PostgreSQL (puerto 5432)
```

**Principios de Arquitectura**:
- ✅ Cada componente es independiente (diferentes builds)
- ✅ Comunicación solo por HTTP (variables de entorno con URLs)
- ✅ Sin dependencias directas entre componentes (no imports, no file:../, no workspaces compartidos)
- ✅ Cada componente tiene su propio repositorio (submodules)
- ✅ El build del hub excluye `services/` y `modules/`

## 🚀 Inicio Rápido

### Prerrequisitos

- Git
- Node.js 20+ y pnpm (para desarrollo local)
- Tailwind CSS está configurado (incluido en el proyecto)

### Clonar el Proyecto

```bash
# Clonar el repositorio principal (Hub)
git clone <URL_REPO_MULTISYSTEM>
cd multisystem

# Inicializar submodules de servicios backend (solo services/api y services/database)
./scripts/setup-submodules.sh  # Linux/Mac
.\scripts\setup-submodules.ps1  # Windows PowerShell

# Clonar módulos frontend para desarrollo local (repositorios independientes)
./scripts/setup-modules-dev.sh  # Linux/Mac
.\scripts\setup-modules-dev.ps1  # Windows PowerShell
```

**Nota**: Los módulos frontend (ShopFlow, Workify) son **repositorios Git independientes**, no submodules. Se clonan localmente para desarrollo, pero se despliegan por separado en Vercel.

### Configuración Inicial

1. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Edita .env con tus configuraciones
   ```

2. **Inicializar servicios backend**:
   ```bash
   ./scripts/setup-submodules.sh  # Solo servicios backend
   ```

3. **Clonar módulos frontend para desarrollo** (opcional):
   ```bash
   ./scripts/setup-modules-dev.sh  # Clona ShopFlow y Workify localmente
   ```

### Desarrollo Local

```bash
# 1. Iniciar PostgreSQL (o usar servicio externo)
# 2. Instalar dependencias de la API
cd services/api
pnpm install

# 3. Configurar base de datos
pnpm db:generate
pnpm db:push
pnpm db:seed

# 4. Iniciar API
pnpm dev

# 5. En otra terminal, iniciar hub (desde la raíz)
# Hub está en la raíz, así que desde multisystem/
pnpm install
pnpm dev

# 6. En otras terminales, iniciar módulos frontend
# (Primero clonar con: ./scripts/setup-modules-dev.sh)
cd modules/shopflow
pnpm install
pnpm dev

# En otra terminal:
cd modules/workify
pnpm install
pnpm dev
```

**Nota**: Los módulos frontend deben clonarse primero con `setup-modules-dev.sh` ya que son repositorios independientes.

## 📁 Estructura del Proyecto

```
multisystem/
├── services/               # 🔗 Servicios compartidos (submodules)
│   ├── api/               # Servicio backend compartido
│   │   ├── src/
│   │   │   ├── routes/    # Rutas de la API
│   │   │   └── lib/       # Utilidades compartidas
│   │   └── package.json   # Depende de @multisystem/database
│   │
│   └── database/          # 🔗 Servicio de base de datos (submodule)
│       ├── prisma/        # Schema y migraciones de BD
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   └── client.ts  # Cliente Prisma exportado
│       └── package.json
│
├── [archivos de Next.js]   # ✅ Aplicación hub en la raíz
│   ├── package.json
│   ├── pnpm-lock.yaml      # Lockfile de dependencias
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js  # Configuración Tailwind CSS
│   ├── postcss.config.js   # Configuración PostCSS
│   ├── src/
│   └── ...
│
├── modules/                # 📦 Módulos frontend (repositorios independientes, clonados localmente)
│   ├── shopflow/          # Módulo ShopFlow (repositorio: multisystem-shopflow)
│   └── workify/           # Módulo Workify (repositorio: multisystem-workify)
│                          # Nota: Se clonan con scripts/setup-modules-dev.sh
│
├── scripts/                # ✅ Scripts de utilidad
│   ├── setup-submodules.sh    # Solo servicios backend
│   ├── setup-modules-dev.sh   # Clona módulos frontend para desarrollo
│   ├── update-submodules.sh
│   └── init-dev.sh
│
└── .gitmodules            # 🔗 Configuración de submodules (solo servicios backend)
```

**Leyenda:**
- ✅ = Contenido del repositorio principal (multisystem)
- 🔗 = Git Submodules (solo servicios backend: services/api y services/database)
- 📦 = Repositorios independientes (módulos frontend clonados localmente para desarrollo)

## 🔧 Scripts Disponibles

### Setup de Submodules (Solo Servicios Backend)

```bash
# Linux/Mac
./scripts/setup-submodules.sh

# Windows PowerShell
.\scripts\setup-submodules.ps1
```

**Nota**: Este script solo inicializa submodules de servicios backend (services/api y services/database).

### Setup de Módulos Frontend (Repositorios Independientes)

```bash
# Linux/Mac
./scripts/setup-modules-dev.sh

# Windows PowerShell
.\scripts\setup-modules-dev.ps1
```

**Nota**: Este script clona los módulos frontend (ShopFlow, Workify) como repositorios independientes para desarrollo local.

### Actualizar Submodules

```bash
# Linux/Mac
./scripts/update-submodules.sh

# Windows PowerShell
.\scripts\update-submodules.ps1
```

### Inicialización Completa

```bash
# Linux/Mac
./scripts/init-dev.sh

# Windows PowerShell
.\scripts\init-dev.ps1
```

## 🔄 Trabajar con Repositorios

### Actualizar Submodules (Solo Servicios Backend)

```bash
# Actualizar submodules de servicios backend a la última versión
git submodule update --remote

# O usar el script
./scripts/update-submodules.sh
```

### Trabajar en el Hub

```bash
# Trabajar en hub (la raíz del repositorio es la aplicación hub)
# Desde la raíz de multisystem/
# ... hacer cambios en src/, componentes, etc. ...
git add .
git commit -m "feat: nueva funcionalidad en hub"
git push origin main
```

### Trabajar en un Módulo Frontend (Repositorio Independiente)

Los módulos frontend (ShopFlow, Workify) son **repositorios independientes**, no submodules.

**Opción 1: Trabajar directamente en el repositorio independiente**

```bash
# Clonar el repositorio del módulo (si no lo tienes)
git clone https://github.com/tu-usuario/multisystem-shopflow.git
cd multisystem-shopflow

# Crear una rama y trabajar normalmente
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

**Opción 2: Trabajar desde el clon local (para desarrollo)**

```bash
# Si clonaste con setup-modules-dev.sh
cd modules/shopflow

# Trabajar normalmente (es un repositorio Git independiente)
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

**Nota**: No necesitas actualizar referencias en el repositorio principal porque los módulos son independientes.

### Agregar un Nuevo Módulo Frontend

```bash
# 1. Crear un nuevo repositorio Git independiente
# 2. Clonarlo localmente para desarrollo
git clone <URL_REPO> modules/nuevo-modulo

# 3. Actualizar scripts/setup-modules-dev.sh con la nueva URL
# 4. Configurar el proyecto en Vercel conectando el repositorio
```

## 🌐 Servicios y Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Hub Frontend | 3000 | Plataforma principal (desarrollo) |
| API | 3001 | API compartida |
| Database API | 3002 | Servicio de base de datos |
| ShopFlow Frontend | 3003 | Módulo ShopFlow |
| Workify Frontend | 3004 | Módulo Workify |
| PostgreSQL | 5432 | Base de datos |

## 🔧 Desarrollo Local

Para desarrollo local, ejecuta cada servicio desde su directorio:

```bash
# Hub (desde la raíz)
pnpm install
pnpm dev

# ShopFlow (desde modules/shopflow)
cd modules/shopflow
pnpm install
pnpm dev

# Workify (desde modules/workify)
cd modules/workify
pnpm install
pnpm dev
```

**Nota**: Los servicios backend (API, Database API) se despliegan en Railway. Ver [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md).

### Ejecutar Migraciones

```bash
# Desde el directorio services/database
cd services/database
pnpm install
pnpm exec prisma generate
pnpm exec prisma db push

# O usando migraciones formales
pnpm exec prisma migrate dev --name nombre_migracion
```


## 🚀 Despliegue

Multisystem utiliza una arquitectura híbrida de despliegue:

- **Frontends (Hub, ShopFlow, Workify)**: Desplegados en **Vercel**
- **Backend Services (API, Database API)**: Desplegados en **Railway**

### 🎨 Frontends en Vercel

Vercel es la plataforma recomendada para los frontends Next.js debido a:
- ✅ Optimización automática para Next.js
- ✅ Despliegue automático desde Git
- ✅ CDN global integrado
- ✅ Preview deployments para cada PR
- ✅ Plan gratuito generoso

**Guía completa**: [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

### 🔧 Backend en Railway

Railway es la plataforma recomendada para los servicios backend debido a:
- ✅ PostgreSQL gestionado incluido
- ✅ Networking automático entre servicios
- ✅ Soporte para Git Submodules
- ✅ Precio razonable ($5 crédito/mes en plan gratuito)

**Guía completa**: [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md)

### Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Hub    │  │ ShopFlow │  │ Workify  │             │
│  │ (Next.js)│  │ (Next.js)│  │ (Next.js)│             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                    │
│       └─────────────┴─────────────┘                    │
│                    │ HTTP                                │
└────────────────────┼────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   RAILWAY                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   API    │  │ Database │  │PostgreSQL │            │
│  │ (Fastify)│  │   API    │  │           │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                    │
│       └─────────────┴─────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Variables de Entorno Principales

**Frontends (Vercel)**:
```bash
NEXT_PUBLIC_API_URL=https://tu-api.railway.app
NEXT_PUBLIC_SHOPFLOW_URL=https://tu-shopflow.vercel.app
NEXT_PUBLIC_WORKIFY_URL=https://tu-workify.vercel.app
NODE_ENV=production
```

**Backend (Railway)**:
```bash
DATABASE_URL=postgresql://...  # URL de PostgreSQL gestionado
NODE_ENV=production
PORT=3001  # Para API
DATABASE_API_URL=http://database:3002  # Para API
CORS_ORIGINS=https://*.vercel.app
```

## 🔐 Variables de Entorno

Copia `.env.example` a `.env` y configura:

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `POSTGRES_USER` - Usuario de PostgreSQL
- `POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `API_PORT` - Puerto del servicio API Principal (default: 3001)
- `DATABASE_API_PORT` - Puerto del servicio Database API (default: 3002)
- `HUB_FRONTEND_PORT` - Puerto del Hub Frontend (default: 3000)
- `CORS_ORIGINS` - Orígenes permitidos para CORS
- `NEXT_PUBLIC_API_URL` - URL de la API Principal para los frontends (HTTP)
- `DATABASE_API_URL` - URL de Database API (usada internamente por API Principal, HTTP)
- `NEXT_PUBLIC_SHOPFLOW_URL` - URL del módulo ShopFlow (HTTP)
- `NEXT_PUBLIC_WORKIFY_URL` - URL del módulo Workify (HTTP)

Ver `env.example` para todas las variables disponibles.

## 📝 Notas sobre la Arquitectura

### Servicios vs Módulos

- **Hub**: La aplicación Next.js está en la raíz del repositorio - parte del repositorio principal
- **Servicios Compartidos como Submodules**:
  - **`services/api/`**: API Principal (puerto 3001) - Servicio backend compartido que consumen todos los módulos
    - Git Submodule en `services/`
    - Consume Database API por HTTP (no por import directo)
  - **`services/database/`**: Database API (puerto 3002) - Gestión de base de datos
    - Git Submodule en `services/`
    - Expone Prisma como API HTTP
- **Servicios de Infraestructura** (`scripts/`): Parte del repositorio principal de multisystem
- **Módulos Frontend como Submodules** (`modules/shopflow/`, `modules/workify/`): Aplicaciones frontend independientes

**Estructura de Repositorios**:
- `multisystem` → Repositorio principal (Hub)
- `multisystem-shopflow` → Repositorio independiente (ShopFlow)
- `multisystem-workify` → Repositorio independiente (Workify)
- `services/api/` → Submodule o repositorio independiente (API backend)
- `services/database/` → Submodule o repositorio independiente (Database API)

**Nota**: Los módulos frontend son repositorios independientes (no submodules) para compatibilidad con Vercel. Los servicios backend pueden ser submodules o repositorios independientes según tu preferencia.

### Independencia de Componentes

**Todos los componentes son independientes y se comunican solo por HTTP**:

- **Hub**: 
  - Build excluye `services/` y `modules/` (definido en `tsconfig.json`)
  - No tiene imports directos de submodules
  - Usa variables de entorno (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SHOPFLOW_URL`, etc.)

- **services/api**:
  - NO importa de `services/database` (solo HTTP)
  - NO tiene dependencia `file:../database` o `@multisystem/database` en `package.json`
  - Usa `DATABASE_API_URL` para comunicación HTTP con Database API

- **modules/shopflow y modules/workify**:
  - NO importan de `services/api` o `services/database`
  - NO tienen dependencias de `services/` en `package.json`
  - Usan `NEXT_PUBLIC_API_URL` para comunicación HTTP con API Principal

- **services/database**:
  - Es completamente independiente
  - Expone su funcionalidad solo por HTTP (puerto 3002)

## 🤝 Contribuir

### Trabajar en el Hub

1. Trabaja en el repositorio principal `multisystem`
2. Haz commit y push normalmente

### Trabajar en Módulos Frontend

1. Trabaja directamente en el repositorio independiente (ej: `multisystem-shopflow`)
2. Haz commit y push en el repositorio del módulo
3. **No necesitas** actualizar referencias en el repositorio principal (son independientes)

### Trabajar en Servicios Backend

1. Trabaja en el submodule (ej: `services/api`)
2. Haz commit y push en el repositorio del servicio
3. Actualiza la referencia en el repositorio principal si es necesario

## 📝 Notas Importantes

- **Hub es la aplicación principal**: La aplicación Next.js está en la raíz del repositorio, no es un submodule
- **Módulos frontend son repositorios independientes**: ShopFlow y Workify son repositorios Git completamente independientes (no submodules) para compatibilidad con Vercel
- **Servicios backend pueden ser submodules o repositorios independientes**: Según tu preferencia y plataforma de despliegue
- **Build del hub excluye submodules**: `services/` y `modules/` están excluidos del build del hub (definido en `tsconfig.json`)
- **Comunicación exclusivamente por HTTP**: Todos los componentes se comunican mediante HTTP usando variables de entorno, sin dependencias directas (no imports, no file:../)
- **Separación de APIs mantenida**: API Principal (3001) y Database API (3002) son servicios independientes que se comunican por HTTP
- **Actualiza submodules regularmente**: Usa `git submodule update --remote` para actualizar todos los submodules
- **Tailwind CSS configurado**: El proyecto incluye Tailwind CSS con configuración completa (`tailwind.config.js`, `postcss.config.js`)
- **Lockfile incluido**: El proyecto incluye `pnpm-lock.yaml` para builds reproducibles
- **Despliegue híbrido**: Frontends en Vercel, Backend en Railway

## 🆘 Solución de Problemas

### Los módulos no están disponibles localmente

Si los módulos son repositorios independientes, clónalos manualmente:

```bash
# Para desarrollo local
git clone https://github.com/tu-usuario/multisystem-shopflow.git modules/shopflow
git clone https://github.com/tu-usuario/multisystem-workify.git modules/workify
```

O usa el script de setup:
```bash
./scripts/setup-dev.sh
```

### Error al desplegar en Vercel

- Verifica que cada módulo sea un repositorio independiente (no submodule)
- Asegúrate de conectar el repositorio correcto en Vercel
- Verifica que `package.json` esté en la raíz de cada repositorio

## 📄 Licencia

[Especificar licencia]
