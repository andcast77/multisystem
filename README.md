# Multisystem

Plataforma modular que integra múltiples aplicaciones independientes (monorepos) a través de una API compartida y un sistema de proxy reverso.

## 🏗️ Arquitectura

Multisystem está estructurado en tres categorías principales:

### Servicios Compartidos (Infraestructura de Multisystem)
- **`services/api/`** - API compartida con Prisma y base de datos unificada (servicio backend)
  - 🔗 **Git Submodule** - Servicio compartido que consumen todos los módulos frontend
- **`nginx/`** - Configuración del reverse proxy
- **`docs/`** - Documentación del proyecto
- **`scripts/`** - Scripts de utilidad para desarrollo
- **`docker-compose.yml`** - Orquestación de servicios

**Nota**: `services/api/` es un servicio compartido con su propio repositorio Git, configurado como **Git Submodule** para que el repositorio principal trackee qué versión está usando.

### Hub (Plataforma Principal)
- **Raíz del repositorio** - La aplicación Next.js de multisystem está en la raíz
  - ✅ **Parte del repositorio principal** - No es un submodule
  - Es la aplicación central que integra todos los módulos
  - Contiene `package.json`, `src/`, `next.config.js`, etc. directamente en la raíz

### Módulos Frontend como Submodules
- **`modules/shopflow/`** - Módulo ShopFlow
- **`modules/workify/`** - Módulo Workify

Cada módulo frontend es un **Git Submodule** independiente con su propio repositorio Git. Estos módulos se integran en el hub y consumen la API compartida (`services/api/`).

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- Git
- Node.js 20+ y pnpm (para desarrollo local)

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
pnpm install
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
│   └── api/               # Servicio backend compartido
│       ├── src/
│       │   ├── routes/    # Rutas de la API
│       │   └── lib/       # Utilidades compartidas
│       └── prisma/        # Schema y migraciones de BD
│
├── nginx/                  # ✅ Configuración reverse proxy
│   ├── nginx.conf
│   └── Dockerfile
│
├── [archivos de Next.js]   # ✅ Aplicación hub en la raíz
│   ├── package.json
│   ├── next.config.js
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
├── docs/                   # ✅ Documentación
│   └── plans/             # Planes de arquitectura
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
| API | 3000 | API compartida |
| Hub Frontend | 3005 | Plataforma principal |
| ShopFlow Frontend | 3003 | Módulo ShopFlow |
| Workify Frontend | 3004 | Módulo Workify |
| Nginx | 80 | Reverse proxy |
| PostgreSQL | 5432 | Base de datos |

## 📚 Documentación Adicional

- [Guía de Desarrollo](docs/DEVELOPMENT.md) - Guía detallada para trabajar con submodules
- [Arquitectura Multi-Módulo](docs/plans/arquitectura-multi-modulo.md) - Documentación de arquitectura

## 🐳 Docker

### Desarrollo

```bash
docker-compose up -d
```

### Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Ejecutar Migraciones

```bash
docker-compose --profile migration up migrate-db
```

## 🔐 Variables de Entorno

Copia `.env.example` a `.env` y configura:

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `POSTGRES_USER` - Usuario de PostgreSQL
- `POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `API_PORT` - Puerto del servicio API (default: 3000)
- `CORS_ORIGINS` - Orígenes permitidos para CORS

## 📝 Notas sobre la Arquitectura

### Servicios vs Módulos

- **Hub**: La aplicación Next.js está en la raíz del repositorio - parte del repositorio principal
- **Servicios Compartidos como Submodules**:
  - **`services/api/`**: Servicio backend compartido que consumen todos los módulos
    - Git Submodule en `services/`
- **Servicios de Infraestructura** (`nginx/`, `docs/`, `scripts/`): Parte del repositorio principal de multisystem
- **Módulos Frontend como Submodules** (`modules/shopflow/`, `modules/workify/`): Aplicaciones frontend independientes

**Estructura de Submodules**:
- `services/api/` → Submodule en `services/` (servicio compartido)
- `modules/shopflow/`, `modules/workify/` → Submodules en `modules/` (aplicaciones frontend)
- Raíz del repositorio → Aplicación hub (Next.js) - no es submodule
- Todos los submodules se gestionan con `git submodule update --init --recursive`

## 🤝 Contribuir

1. Trabaja en el módulo específico (submodule)
2. Haz commit y push en el repositorio del módulo
3. Actualiza la referencia en el repositorio principal si es necesario

## 📝 Notas Importantes

- **Hub es la aplicación principal**: La aplicación Next.js está en la raíz del repositorio, no es un submodule
- **Servicios y módulos son independientes**: `services/api/` y los módulos frontend tienen sus propios repositorios Git como submodules
- **El repositorio principal trackea referencias de submodules**: No se duplican commits de servicios ni módulos
- **Docker funciona con rutas locales**: El contexto de hub apunta a la raíz (`.`), servicios a `services/api/` y módulos a `modules/`
- **Actualiza submodules regularmente**: Usa `git submodule update --remote` para actualizar todos los submodules

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
