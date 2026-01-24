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
- **`nginx/`** - Configuración del reverse proxy
- **`scripts/`** - Scripts de utilidad para desarrollo
- **`docker-compose.yml`** - Orquestación de servicios

**Nota**: `services/api/` y `services/database/` son servicios independientes con sus propios repositorios Git, configurados como **Git Submodules**. La comunicación entre ellos es exclusivamente por HTTP.

### Hub (Plataforma Principal)
- **Raíz del repositorio** - La aplicación Next.js de multisystem está en la raíz
  - ✅ **Parte del repositorio principal** - No es un submodule
  - Es la aplicación central que integra todos los módulos
  - Contiene `package.json`, `src/`, `next.config.js`, etc. directamente en la raíz
  - **Build independiente**: El build del hub excluye `services/` y `modules/` (submodules)
  - **Comunicación por HTTP**: Solo se comunica con servicios/módulos mediante variables de entorno

### Módulos Frontend como Submodules
- **`modules/shopflow/`** - Módulo ShopFlow
- **`modules/workify/`** - Módulo Workify

Cada módulo frontend es un **Git Submodule** independiente con su propio repositorio Git. Estos módulos se integran en el hub y consumen la API compartida (`services/api/`) **únicamente por HTTP**.

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
- ✅ Cada componente es independiente (diferentes builds, diferentes contenedores)
- ✅ Comunicación solo por HTTP (variables de entorno con URLs)
- ✅ Sin dependencias directas entre componentes (no imports, no file:../, no workspaces compartidos)
- ✅ Cada componente tiene su propio repositorio (submodules)
- ✅ El build del hub excluye `services/` y `modules/` (no se incluyen en la imagen Docker)

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- Git
- Node.js 20+ y pnpm (para desarrollo local)
- Tailwind CSS está configurado (incluido en el proyecto)

### Clonar el Proyecto

```bash
# Clonar el repositorio principal
git clone <URL_REPO_MULTISYSTEM>
cd multisystem

# Inicializar todos los submodules (api + módulos frontend)
git submodule update --init --recursive

# O usar el script de inicialización
./scripts/setup-submodules.sh  # Linux/Mac
.\scripts\setup-submodules.ps1  # Windows PowerShell
```

### Configuración Inicial

1. **Configurar URLs de submodules** (si aún no están configuradas):
   Edita `.gitmodules` y reemplaza los placeholders con las URLs reales de tus repositorios:
   ```ini
   [submodule "services/api"]
       path = services/api
       url = https://github.com/tu-usuario/api.git
   
   [submodule "modules/shopflow"]
       path = modules/shopflow
       url = https://github.com/tu-usuario/shopflow.git
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Edita .env con tus configuraciones
   ```

3. **Inicializar submodules**:
   ```bash
   ./scripts/setup-submodules.sh
   ```

### Desarrollo Local

#### Opción 1: Docker Compose (Recomendado)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

#### Opción 2: Desarrollo Local sin Docker

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

# 5. En otra terminal, iniciar hub (desde la raíz) y cada módulo
# Hub está en la raíz, así que desde multisystem/
# Las dependencias ya están instaladas (pnpm-lock.yaml existe)
pnpm install  # Solo necesario si cambias dependencias
pnpm dev

# En otra terminal, iniciar módulos
cd modules/shopflow
pnpm install
pnpm dev

cd modules/workify
pnpm install
pnpm dev
```

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
│   ├── nginx.conf          # Configuración reverse proxy
│   ├── Dockerfile          # Multi-stage Dockerfile
│   ├── src/
│   └── ...
│
├── modules/                # 🔗 Módulos frontend como submodules
│   ├── shopflow/          # Módulo ShopFlow
│   └── workify/           # Módulo Workify
│
├── scripts/                # ✅ Scripts de utilidad
│   ├── setup-submodules.sh
│   ├── update-submodules.sh
│   └── init-dev.sh
│
├── docker-compose.yml      # ✅ Desarrollo
├── docker-compose.prod.yml # ✅ Producción
└── .gitmodules            # 🔗 Configuración de submodules
```

**Leyenda:**
- ✅ = Contenido del repositorio principal (multisystem)
- 🔗 = Git Submodules (repositorios independientes)

## 🔧 Scripts Disponibles

### Setup de Submodules

```bash
# Linux/Mac
./scripts/setup-submodules.sh

# Windows PowerShell
.\scripts\setup-submodules.ps1
```

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

## 🔄 Trabajar con Git Submodules

### Actualizar Submodules

```bash
# Actualizar todos los submodules a la última versión
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

### Trabajar en un Módulo Específico

```bash
# Entrar al módulo
cd modules/shopflow

# Crear una rama y trabajar normalmente
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Volver al repositorio principal
cd ../..

# Actualizar la referencia del submodule
git add modules/shopflow
git commit -m "chore: actualizar referencia de shopflow"
```

### Agregar un Nuevo Módulo

```bash
# Agregar como submodule
git submodule add <URL_REPO> modules/nuevo-modulo

# Commit en el repositorio principal
git commit -m "feat: agregar nuevo módulo"
```

## 🌐 Servicios y Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Hub Frontend | 3000 | Plataforma principal (desarrollo) |
| API | 3001 | API compartida |
| Database API | 3002 | Servicio de base de datos |
| ShopFlow Frontend | 3003 | Módulo ShopFlow |
| Workify Frontend | 3004 | Módulo Workify |
| Nginx | 80 | Reverse proxy (solo producción) |
| PostgreSQL | 5432 | Base de datos |

## 🐳 Docker

El proyecto incluye un Dockerfile multi-stage optimizado con los siguientes targets:

- **`deps`**: Instalación de dependencias
- **`build`**: Compilación de producción
- **`runtime`**: Imagen optimizada para producción (usa `output: standalone`)
- **`dev`**: Entorno de desarrollo (sin Nginx)
- **`runtime-with-nginx`**: Producción con Nginx integrado como reverse proxy

### Desarrollo

```bash
# Iniciar todos los servicios (incluye PostgreSQL, API, módulos y hub)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f hub-frontend

# Detener servicios
docker-compose down
```

### Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Build Manual

```bash
# Build para desarrollo (sin Nginx)
docker build -t multisystem-hub --target dev .

# Build para producción (con Nginx)
docker build -t multisystem-hub-prod --target runtime-with-nginx .
```

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

### Ejecutar Servicios Individualmente

Cada servicio puede ejecutarse de forma **completamente independiente** sin `depends_on`. Si las dependencias no están disponibles, el servicio mostrará errores de conexión pero seguirá corriendo:

```bash
# Solo PostgreSQL
docker-compose up -d postgres

# Solo API (si postgres no está, dará errores de conexión a BD)
docker-compose up -d api

# Solo Hub frontend (si api/shopflow/workify no están, mostrará errores en el frontend)
docker-compose up -d hub-frontend

# Solo ShopFlow frontend (si api no está, dará errores de conexión a API)
docker-compose up -d shopflow-frontend

# Solo Workify frontend (si api no está, dará errores de conexión a API)
docker-compose up -d workify-frontend
```

**Ventajas de este enfoque:**
- ✅ **Aislamiento completo**: Cada servicio inicia independientemente
- ✅ **Sin bloqueos**: Un servicio no bloquea a otro si falta una dependencia
- ✅ **Desarrollo independiente**: Puedes trabajar en un módulo sin levantar todo el stack
- ✅ **Errores manejados**: Los servicios manejan errores de conexión internamente

**Nota**: Todos los servicios comparten la red `multisystem-network` para comunicación cuando están disponibles. Los servicios manejan errores de conexión internamente (timeouts, errores de red, etc.).

## 🚂 Despliegue en Railway

Railway es la plataforma recomendada para desplegar Multisystem en producción debido a su soporte nativo para Docker Compose y PostgreSQL gestionado.

### Inicio Rápido

1. Conecta tu repositorio de GitHub a Railway
2. Railway detectará automáticamente `docker-compose.prod.yml`
3. Configura PostgreSQL como servicio gestionado
4. Ajusta variables de entorno
5. Despliega

Para una guía detallada, consulta [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md).

### Ventajas de Railway

- ✅ Soporte nativo de Docker Compose
- ✅ PostgreSQL gestionado incluido
- ✅ Networking automático entre servicios
- ✅ Soporte para Git Submodules
- ✅ Despliegue en minutos
- ✅ Precio razonable ($5 crédito/mes en plan gratuito)

### Configuración Básica

Railway detecta automáticamente tu `docker-compose.prod.yml` y despliega todos los servicios. Solo necesitas:

1. **PostgreSQL gestionado**: Crea un servicio PostgreSQL en Railway y usa su `DATABASE_URL`
2. **Variables de entorno**: Configura las variables necesarias en el dashboard
3. **Dominios públicos**: Railway genera URLs públicas automáticamente

### Variables de Entorno Principales

```bash
DATABASE_URL=postgresql://...  # URL de PostgreSQL gestionado de Railway
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://api:3001
NEXT_PUBLIC_SHOPFLOW_URL=http://shopflow-frontend:3003
NEXT_PUBLIC_WORKIFY_URL=http://workify-frontend:3004
CORS_ORIGINS=https://tu-proyecto.railway.app
```

Ver [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) para la lista completa y configuración detallada.

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
- **Servicios de Infraestructura** (`nginx/`, `scripts/`): Parte del repositorio principal de multisystem
- **Módulos Frontend como Submodules** (`modules/shopflow/`, `modules/workify/`): Aplicaciones frontend independientes

**Estructura de Submodules**:
- `services/api/` → Submodule en `services/` (servicio compartido)
- `services/database/` → Submodule en `services/` (gestión de base de datos)
- `modules/shopflow/`, `modules/workify/` → Submodules en `modules/` (aplicaciones frontend)
- Raíz del repositorio → Aplicación hub (Next.js) - no es submodule
- Todos los submodules se gestionan con `git submodule update --init --recursive`

### Independencia de Componentes

**Todos los componentes son independientes y se comunican solo por HTTP**:

- **Hub**: 
  - Build excluye `services/` y `modules/` (definido en `.dockerignore` y `tsconfig.json`)
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

1. Trabaja en el módulo específico (submodule)
2. Haz commit y push en el repositorio del módulo
3. Actualiza la referencia en el repositorio principal si es necesario

## 📝 Notas Importantes

- **Hub es la aplicación principal**: La aplicación Next.js está en la raíz del repositorio, no es un submodule
- **Servicios y módulos son independientes**: `services/api/`, `services/database/` y los módulos frontend tienen sus propios repositorios Git como submodules
- **El repositorio principal trackea referencias de submodules**: No se duplican commits de servicios ni módulos
- **Docker funciona con rutas locales**: El contexto de hub apunta a la raíz (`.`), servicios a `services/api/` y módulos a `modules/`
- **Build del hub excluye submodules**: `services/` y `modules/` están excluidos del build del hub (definido en `.dockerignore` y `tsconfig.json`)
- **Comunicación exclusivamente por HTTP**: Todos los componentes se comunican mediante HTTP usando variables de entorno, sin dependencias directas (no imports, no file:../)
- **Separación de APIs mantenida**: API Principal (3001) y Database API (3002) son servicios independientes que se comunican por HTTP
- **Actualiza submodules regularmente**: Usa `git submodule update --remote` para actualizar todos los submodules
- **Tailwind CSS configurado**: El proyecto incluye Tailwind CSS con configuración completa (`tailwind.config.js`, `postcss.config.js`)
- **Lockfile incluido**: El proyecto incluye `pnpm-lock.yaml` para builds reproducibles
- **Nginx solo en producción**: Nginx se usa únicamente en producción (stage `runtime-with-nginx`), no en desarrollo

## 🆘 Solución de Problemas

### Los submodules están vacíos

```bash
git submodule update --init --recursive
```

### Error al clonar submodules

Verifica que las URLs en `.gitmodules` sean correctas y que tengas acceso a los repositorios.

### Docker no encuentra los módulos

Asegúrate de que los submodules estén inicializados:
```bash
git submodule update --init --recursive
```

## 📄 Licencia

[Especificar licencia]
