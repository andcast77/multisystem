# Guía de Despliegue en Vercel

Esta guía explica cómo desplegar los frontends (Hub, ShopFlow, Workify) en Vercel, mientras los servicios backend (API, Database API) se despliegan en Railway u otra plataforma.

## 🏗️ Arquitectura de Despliegue

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
│                   RAILWAY                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   API    │  │ Database │  │PostgreSQL │            │
│  │ (Fastify)│  │   API    │  │           │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                    │
│       └─────────────┴─────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prerrequisitos

1. **Cuenta en Vercel**: [vercel.com](https://vercel.com)
2. **Cuenta en Railway** (o similar) para servicios backend
3. **Repositorios Git** configurados (GitHub, GitLab, Bitbucket)
4. **Variables de entorno** preparadas

## 🚀 Despliegue del Hub (Raíz del Proyecto)

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta tu repositorio de GitHub/GitLab/Bitbucket
3. Selecciona el repositorio `multisystem`

### Paso 2: Configurar Proyecto

**Configuración del Proyecto:**
- **Framework Preset**: Next.js
- **Root Directory**: `/` (raíz del repositorio)
- **Build Command**: `pnpm build` (o `npm run build`)
- **Output Directory**: `.next` (automático para Next.js)
- **Install Command**: `pnpm install` (o `npm install`)

### Paso 3: Variables de Entorno

Configura las siguientes variables de entorno en Vercel:

```bash
# URL de la API Principal (desplegada en Railway)
NEXT_PUBLIC_API_URL=https://tu-api.railway.app

# URLs de módulos frontend (desplegados en Vercel)
NEXT_PUBLIC_SHOPFLOW_URL=https://tu-shopflow.vercel.app
NEXT_PUBLIC_WORKIFY_URL=https://tu-workify.vercel.app

# Configuración de módulos
NEXT_PUBLIC_SHOPFLOW_ENABLED=true
NEXT_PUBLIC_WORKIFY_ENABLED=true

# Otros
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Paso 4: Desplegar

1. Haz clic en **Deploy**
2. Vercel construirá y desplegará automáticamente
3. Obtendrás una URL como: `https://tu-proyecto.vercel.app`

## 🛍️ Despliegue de ShopFlow

### ⚠️ Importante: Repositorio Independiente

**ShopFlow debe ser un repositorio Git completamente independiente** (no un submodule). Vercel no es compatible con Git Submodules para proyectos separados.

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta el repositorio de ShopFlow directamente
   - Repositorio: `multisystem-shopflow` (o el nombre de tu repo)
   - **NO** uses el repositorio principal `multisystem`
3. Vercel detectará Next.js automáticamente

### Paso 2: Variables de Entorno

```bash
# URL de la API Principal
NEXT_PUBLIC_API_URL=https://tu-api.railway.app

# Base path (si se usa)
# NOTA: Si despliegas en un dominio separado, puedes eliminar basePath del next.config.ts
# Si usas basePath, asegúrate de que coincida con la configuración

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Paso 3: Configurar Dominio Personalizado

**Recomendación**: Cada módulo debe tener su propio dominio para evitar problemas con `basePath`.

1. En Vercel, ve a **Settings → Domains**
2. Agrega tu dominio personalizado (ej: `shopflow.tudominio.com`)
3. Configura DNS según las instrucciones de Vercel

### Paso 4: Eliminar basePath (Recomendado)

Si `next.config.ts` tiene `basePath: '/shopflow'`, **elimínalo** ya que cada módulo tiene su propio dominio:

```typescript
// Antes
const nextConfig: NextConfig = {
  basePath: '/shopflow',
  // ...
}

// Después (sin basePath)
const nextConfig: NextConfig = {
  // basePath eliminado - cada módulo tiene su propio dominio
  // ...
}
```

### Paso 5: Desplegar

1. Haz clic en **Deploy**
2. Obtendrás una URL como: `https://tu-shopflow.vercel.app`
3. Una vez configurado el dominio personalizado: `https://shopflow.tudominio.com`

## 👥 Despliegue de Workify

### ⚠️ Importante: Repositorio Independiente

**Workify debe ser un repositorio Git completamente independiente** (no un submodule).

Sigue los mismos pasos que ShopFlow:

1. Crea un **nuevo proyecto** en Vercel
2. Conecta el repositorio de Workify directamente (ej: `multisystem-workify`)
3. Configura las mismas variables de entorno (excepto URLs específicas)
4. Configura dominio personalizado (ej: `workify.tudominio.com`)
5. Elimina `basePath` del `next.config.ts` si existe
6. Despliega

## 🔧 Configuración Avanzada

### Configurar Dominios Personalizados

1. En cada proyecto de Vercel, ve a **Settings → Domains**
2. Agrega tu dominio personalizado
3. Configura DNS según las instrucciones de Vercel

### ⚠️ Git Submodules NO Compatibles

**Vercel NO es compatible con Git Submodules para proyectos separados**. 

**Solución**: Cada módulo (ShopFlow, Workify) debe ser un **repositorio Git completamente independiente**:

- `multisystem-shopflow` → Repositorio independiente
- `multisystem-workify` → Repositorio independiente
- `multisystem` → Repositorio principal (solo Hub)

Cada repositorio se conecta a Vercel como un proyecto separado.

### Optimizar Builds

Para builds más rápidos, puedes configurar:

**vercel.json** (opcional, en la raíz de cada frontend):

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

## 🔐 Variables de Entorno por Entorno

### Producción

```bash
NEXT_PUBLIC_API_URL=https://tu-api.railway.app
NEXT_PUBLIC_SHOPFLOW_URL=https://tu-shopflow.vercel.app
NEXT_PUBLIC_WORKIFY_URL=https://tu-workify.vercel.app
NODE_ENV=production
```

### Preview (Staging)

Vercel crea automáticamente URLs de preview para cada PR. Puedes configurar:

```bash
NEXT_PUBLIC_API_URL=https://tu-api-staging.railway.app
# ... otras URLs de staging
```

## 🔄 Actualización Automática

Vercel despliega automáticamente cuando:

- Haces push a la rama principal (producción)
- Creas un Pull Request (preview)
- Haces push a otras ramas (preview)

## 🐛 Solución de Problemas

### Error: "Module not found"

- Verifica que el **Root Directory** esté configurado correctamente
- Asegúrate de que `package.json` esté en el directorio raíz del proyecto

### Error: "Build failed"

- Revisa los logs de build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `pnpm-lock.yaml` esté commitado

### Error: "API URL not found"

- Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente
- Asegúrate de que la API esté desplegada y accesible
- Verifica CORS en la API para permitir el dominio de Vercel

### Problemas con basePath

Si tienes problemas con rutas:

1. **Opción 1**: Elimina `basePath` de `next.config.ts` y despliega en dominios separados
2. **Opción 2**: Mantén `basePath` y configura Vercel para usar ese path base

## 📝 Checklist de Despliegue

### Repositorios
- [ ] ShopFlow es un repositorio Git independiente (no submodule)
- [ ] Workify es un repositorio Git independiente (no submodule)
- [ ] Hub está en el repositorio principal `multisystem`

### Despliegue en Vercel
- [ ] Hub desplegado en Vercel (repositorio: `multisystem`)
- [ ] ShopFlow desplegado en Vercel (repositorio: `multisystem-shopflow`)
- [ ] Workify desplegado en Vercel (repositorio: `multisystem-workify`)
- [ ] Cada proyecto tiene su propio dominio personalizado
- [ ] `basePath` eliminado de `next.config.ts` en cada módulo

### Backend
- [ ] API desplegada en Railway
- [ ] Database API desplegada en Railway
- [ ] PostgreSQL configurado

### Configuración
- [ ] Variables de entorno configuradas en todos los proyectos de Vercel
- [ ] CORS configurado en la API para permitir dominios de Vercel
- [ ] URLs de módulos actualizadas en variables de entorno del Hub
- [ ] Pruebas de integración realizadas

## 🔗 Enlaces Útiles

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Monorepos en Vercel](https://vercel.com/docs/concepts/monorepos)

## 📚 Siguiente Paso

Una vez desplegados los frontends en Vercel, consulta [docs/RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) para desplegar los servicios backend en Railway.
