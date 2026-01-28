# Migración a Arquitectura Híbrida: Vercel + Railway

Este documento resume los cambios realizados para migrar los frontends a Vercel y mantener los servicios backend en Railway.

## 📋 Resumen de Cambios

### ✅ Archivos Eliminados

- `Dockerfile` (raíz) - Hub ya no necesita Docker
- `modules/shopflow/Dockerfile` - ShopFlow se despliega en Vercel
- `modules/workify/Dockerfile` - Workify se despliega en Vercel

### ✅ Archivos Modificados

1. **docker-compose.yml**
   - Eliminados servicios de frontends (hub-frontend, shopflow-frontend, workify-frontend)
   - Mantenidos solo servicios backend (postgres, database, api)
   - Actualizado CORS para incluir `https://*.vercel.app`

2. **docker-compose.prod.yml**
   - Eliminados servicios de frontends
   - Mantenidos solo servicios backend
   - Actualizado CORS para producción

3. **next.config.js** (Hub)
   - Comentado `output: 'standalone'` (no necesario en Vercel)

4. **README.md**
   - Actualizada sección de despliegue con arquitectura híbrida
   - Actualizada sección de Docker (solo backend)
   - Agregadas referencias a guías de despliegue

### ✅ Archivos Creados

1. **docs/VERCEL_DEPLOYMENT.md**
   - Guía completa de despliegue en Vercel
   - Instrucciones para Hub, ShopFlow y Workify
   - Configuración de variables de entorno
   - Solución de problemas

## 🏗️ Nueva Arquitectura

### Antes (Todo en Docker/Railway)
```
┌─────────────────────────────────────┐
│         RAILWAY/DOCKER              │
│  ┌──────────┐  ┌──────────┐        │
│  │   Hub    │  │ ShopFlow │        │
│  └────┬─────┘  └────┬─────┘        │
│       │             │               │
│  ┌────┴─────────────┴─────┐        │
│  │   API    │  Database   │        │
│  └──────────┴─────────────┘        │
└─────────────────────────────────────┘
```

### Después (Híbrido: Vercel + Railway)
```
┌─────────────────────────────────────┐
│            VERCEL                   │
│  ┌──────────┐  ┌──────────┐        │
│  │   Hub    │  │ ShopFlow │        │
│  └────┬─────┘  └────┬─────┘        │
│       │             │               │
│       └─────────────┘               │
│              │ HTTP                 │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           RAILWAY                    │
│  ┌──────────┐  ┌──────────┐        │
│  │   API    │  │ Database │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

## 🚀 Próximos Pasos

### 1. Desplegar Frontends en Vercel

Sigue la guía en [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md):

- [ ] Desplegar Hub
- [ ] Desplegar ShopFlow
- [ ] Desplegar Workify
- [ ] Configurar variables de entorno
- [ ] Configurar dominios personalizados (opcional)

### 2. Desplegar Backend en Railway

Sigue la guía en [docs/RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md):

- [ ] Desplegar Database API
- [ ] Desplegar API Principal
- [ ] Configurar PostgreSQL
- [ ] Configurar variables de entorno
- [ ] Configurar CORS para dominios de Vercel

### 3. Configurar CORS en Backend

Asegúrate de que la API permita requests desde Vercel:

```bash
# En Railway, configura CORS_ORIGINS:
CORS_ORIGINS=https://tu-hub.vercel.app,https://tu-shopflow.vercel.app,https://tu-workify.vercel.app,https://*.vercel.app
```

### 4. Actualizar Variables de Entorno

**En Vercel (Frontends)**:
```bash
NEXT_PUBLIC_API_URL=https://tu-api.railway.app
NEXT_PUBLIC_SHOPFLOW_URL=https://tu-shopflow.vercel.app
NEXT_PUBLIC_WORKIFY_URL=https://tu-workify.vercel.app
```

**En Railway (Backend)**:
```bash
DATABASE_URL=postgresql://...
DATABASE_API_URL=http://database:3002
CORS_ORIGINS=https://*.vercel.app
```

## 🔄 Desarrollo Local

### Frontends (Sin Docker)

**Importante**: Los módulos son repositorios independientes. Primero clónalos:

```bash
# Clonar módulos para desarrollo local
./scripts/setup-modules-dev.sh  # Linux/Mac
.\scripts\setup-modules-dev.ps1  # Windows PowerShell

# O manualmente:
git clone https://github.com/tu-usuario/multisystem-shopflow.git modules/shopflow
git clone https://github.com/tu-usuario/multisystem-workify.git modules/workify
```

Luego inicia desarrollo:

```bash
# Hub
pnpm dev

# ShopFlow
cd modules/shopflow && pnpm dev

# Workify
cd modules/workify && pnpm dev
```

### Backend (Con Docker)

```bash
# Solo servicios backend
docker-compose up -d
```

## ⚠️ Consideraciones Importantes

### Repositorios Independientes (NO Submodules)

**CRÍTICO**: Los módulos frontend (ShopFlow, Workify) deben ser **repositorios Git completamente independientes**, NO submodules. Vercel no es compatible con Git Submodules para proyectos separados.

- ✅ Cada módulo tiene su propio repositorio Git
- ✅ Cada módulo se conecta a Vercel como proyecto separado
- ✅ Cada módulo puede tener su propio dominio

Ver [docs/MODULES_AS_INDEPENDENT_REPOS.md](MODULES_AS_INDEPENDENT_REPOS.md) para la guía completa de migración.

### basePath en Next.js

Si `next.config.ts` tiene `basePath`:

- **Recomendado**: Eliminar `basePath` y desplegar cada módulo en su propio dominio
- Cada módulo tendrá su propio dominio (ej: `shopflow.tudominio.com`)

### Desarrollo Local

Para desarrollo local, clona los repositorios manualmente o usa el script:

```bash
./scripts/setup-modules-dev.sh  # Linux/Mac
.\scripts\setup-modules-dev.ps1  # Windows
```

### Variables de Entorno

- Las variables que empiezan con `NEXT_PUBLIC_` son expuestas al cliente
- Las variables sin `NEXT_PUBLIC_` son solo del servidor
- Configura todas las variables necesarias en cada plataforma

## 📚 Documentación

- [Guía de Despliegue en Vercel](VERCEL_DEPLOYMENT.md)
- [Guía de Despliegue en Railway](RAILWAY_DEPLOYMENT.md)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Railway](https://docs.railway.app)

## 🐛 Problemas Comunes

### Error: "API URL not found"

- Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente en Vercel
- Verifica que la API esté desplegada y accesible
- Verifica CORS en la API

### Error: "Module not found" en Vercel

- Verifica que el **Root Directory** esté configurado correctamente
- Asegúrate de que `package.json` esté en el directorio correcto

### Error: "Build failed"

- Revisa los logs de build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `pnpm-lock.yaml` esté commitado

## ✅ Checklist de Migración

### Preparación
- [x] Eliminar Dockerfiles de frontends
- [x] Actualizar docker-compose.yml
- [x] Actualizar docker-compose.prod.yml
- [x] Crear guía de despliegue en Vercel
- [x] Actualizar README.md
- [x] Crear guía de repositorios independientes

### Migración de Repositorios
- [ ] Crear repositorio `multisystem-shopflow` (independiente)
- [ ] Crear repositorio `multisystem-workify` (independiente)
- [ ] Migrar código de ShopFlow al nuevo repositorio
- [ ] Migrar código de Workify al nuevo repositorio
- [ ] Eliminar submodules del repositorio principal (opcional)
- [ ] Actualizar `.gitmodules` (eliminar módulos frontend)

### Despliegue
- [ ] Desplegar Hub en Vercel (repositorio: `multisystem`)
- [ ] Desplegar ShopFlow en Vercel (repositorio: `multisystem-shopflow`)
- [ ] Desplegar Workify en Vercel (repositorio: `multisystem-workify`)
- [ ] Configurar dominios personalizados para cada módulo
- [ ] Eliminar `basePath` de `next.config.ts` en cada módulo
- [ ] Desplegar API en Railway
- [ ] Desplegar Database API en Railway
- [ ] Configurar CORS para dominios de Vercel
- [ ] Configurar variables de entorno en todos los proyectos
- [ ] Probar integración completa
