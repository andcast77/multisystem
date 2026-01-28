# 🚀 Guía Rápida: Desplegar en Vercel

Esta es una guía paso a paso para desplegar tu proyecto **Hub** (aplicación principal) en Vercel.

## 📋 Prerrequisitos

1. ✅ Cuenta en [Vercel](https://vercel.com) (gratis)
2. ✅ Repositorio Git (GitHub, GitLab o Bitbucket)
3. ✅ Proyecto subido a tu repositorio Git

## 🎯 Paso 1: Conectar tu Repositorio

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Inicia sesión con tu cuenta de GitHub/GitLab/Bitbucket
3. Haz clic en **"Import Project"** o **"Add New Project"**
4. Selecciona tu repositorio `multisystem`
5. Haz clic en **"Import"**

## ⚙️ Paso 2: Configurar el Proyecto

Vercel detectará automáticamente que es un proyecto Next.js. Verifica que la configuración sea:

- **Framework Preset**: `Next.js` (debería detectarse automáticamente)
- **Root Directory**: `/` (raíz del repositorio)
- **Build Command**: `pnpm build` (o `npm run build` si usas npm)
- **Output Directory**: `.next` (automático para Next.js)
- **Install Command**: `pnpm install` (o `npm install`)

**Nota**: Si usas `pnpm`, asegúrate de que `pnpm-lock.yaml` esté en tu repositorio.

## 🔐 Paso 3: Configurar Variables de Entorno

Antes de desplegar, configura las variables de entorno. Haz clic en **"Environment Variables"** y agrega:

### Variables Requeridas

```bash
# URL de tu API (desplegada en Railway u otra plataforma)
NEXT_PUBLIC_API_URL=https://tu-api.railway.app

# URLs de módulos frontend (si ya están desplegados)
NEXT_PUBLIC_SHOPFLOW_URL=https://tu-shopflow.vercel.app
NEXT_PUBLIC_WORKIFY_URL=https://tu-workify.vercel.app

# Configuración de módulos (opcional)
NEXT_PUBLIC_SHOPFLOW_ENABLED=true
NEXT_PUBLIC_WORKIFY_ENABLED=true

# Entorno
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**⚠️ Importante**: 
- Reemplaza `https://tu-api.railway.app` con la URL real de tu API
- Si aún no has desplegado ShopFlow o Workify, puedes omitir esas variables por ahora
- Las variables que empiezan con `NEXT_PUBLIC_` son visibles en el cliente

### Cómo Agregar Variables

1. En la página de configuración del proyecto, ve a **"Settings"** → **"Environment Variables"**
2. Haz clic en **"Add New"**
3. Ingresa el nombre de la variable (ej: `NEXT_PUBLIC_API_URL`)
4. Ingresa el valor
5. Selecciona los entornos donde aplicará (Production, Preview, Development)
6. Haz clic en **"Save"**

## 🚀 Paso 4: Desplegar

1. Haz clic en el botón **"Deploy"**
2. Vercel comenzará a construir tu proyecto automáticamente
3. Espera a que termine el build (puede tomar 2-5 minutos)
4. Una vez completado, verás una URL como: `https://tu-proyecto.vercel.app`

## ✅ Paso 5: Verificar el Despliegue

1. Visita la URL que Vercel te proporcionó
2. Verifica que la aplicación cargue correctamente
3. Revisa los logs en el dashboard de Vercel si hay errores

## 🔄 Actualizaciones Automáticas

Vercel despliega automáticamente cuando:

- ✅ Haces `git push` a la rama principal (producción)
- ✅ Creas un Pull Request (preview deployment)
- ✅ Haces push a otras ramas (preview deployment)

Cada push crea un nuevo deployment con su propia URL.

## 🌐 Configurar Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a **"Settings"** → **"Domains"**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio (ej: `multisystem.tudominio.com`)
4. Sigue las instrucciones para configurar DNS
5. Vercel te dará los registros DNS que necesitas agregar

## 🐛 Solución de Problemas Comunes

### ⚠️ Advertencia: "Failed to fetch one or more git submodules"

**Esto es NORMAL y NO afecta el build**. El Hub no necesita los submodules para funcionar porque:

- ✅ El Hub se comunica con la API solo por HTTP (usando `NEXT_PUBLIC_API_URL`)
- ✅ Tanto `services/` como `modules/` son **proyectos separados** (repositorios independientes):
  - Se clonan localmente solo para desarrollo (para tener contexto)
  - Se despliegan por separado (services en Railway, modules en Vercel)
  - Están excluidos del build del Hub:
    - En `.gitignore` (no se trackean en el repositorio principal)
    - En `.vercelignore` (no se incluyen en el build de Vercel)
    - En `tsconfig.json` (excluidos de la compilación)
- ✅ El build continuará normalmente a pesar de esta advertencia

**Solución**: Puedes ignorar esta advertencia. El build debería completarse exitosamente.

**Nota**: Esta advertencia no debería aparecer si `.gitmodules` ha sido eliminado. Si aparece, es porque Vercel detectó el archivo en un commit anterior. En el próximo deployment debería desaparecer.

### ⚠️ Advertencia: "Ignored build scripts"

Si ves una advertencia sobre scripts de build ignorados (como Prisma o Sharp):

**Opción 1: Si no necesitas el paquete** (Recomendado)
- Elimina el paquete de `package.json` si no lo estás usando
- Ejemplo: Si no usas Prisma en el Hub, elimínalo de las dependencias

**Opción 2: Si necesitas el paquete**
- Los scripts se ejecutarán automáticamente en builds futuros
- O puedes aprobar manualmente en Vercel: Settings → Build & Development Settings → Build Command
- Agrega: `pnpm install --ignore-scripts=false` (no recomendado por seguridad)

**Nota**: Sharp es usado automáticamente por Next.js para optimización de imágenes, así que es normal que aparezca. Vercel lo manejará automáticamente.

### Error: "Build failed"

**Solución**:
- Revisa los logs de build en Vercel
- Verifica que `pnpm-lock.yaml` esté en el repositorio
- Asegúrate de que todas las dependencias estén en `package.json`

### Error: "Module not found"

**Solución**:
- Verifica que el **Root Directory** esté configurado como `/`
- Asegúrate de que `package.json` esté en la raíz del repositorio

### Error: "API URL not found" o errores de conexión

**Solución**:
- Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente
- Asegúrate de que tu API esté desplegada y accesible
- Verifica CORS en tu API para permitir el dominio de Vercel

### El sitio carga pero no funciona correctamente

**Solución**:
- Revisa la consola del navegador para errores
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de Vercel en **"Deployments"** → selecciona el deployment → **"Functions"**

## 📝 Checklist de Despliegue

Antes de desplegar, asegúrate de:

- [ ] Repositorio subido a GitHub/GitLab/Bitbucket
- [ ] `package.json` en la raíz del proyecto
- [ ] `pnpm-lock.yaml` o `package-lock.json` en el repositorio
- [ ] Variables de entorno configuradas en Vercel
- [ ] API backend desplegada (si es necesaria)
- [ ] CORS configurado en la API para permitir `*.vercel.app`

## 🔗 Enlaces Útiles

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Guía Completa de Despliegue](./docs/VERCEL_DEPLOYMENT.md)

## 📚 Próximos Pasos

Una vez desplegado el Hub:

1. **Desplegar módulos frontend** (ShopFlow, Workify) - Ver [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)
2. **Desplegar servicios backend** (API, Database API) - Ver [docs/RAILWAY_DEPLOYMENT.md](./docs/RAILWAY_DEPLOYMENT.md)
3. **Configurar dominios personalizados** para cada módulo
4. **Actualizar variables de entorno** con las URLs reales

---

**¿Necesitas ayuda?** Revisa la [documentación completa](./docs/VERCEL_DEPLOYMENT.md) o los logs de Vercel.
