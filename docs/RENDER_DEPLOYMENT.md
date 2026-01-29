# Guía de Despliegue en Render.com (Sin Docker)

Esta guía explica cómo desplegar la API Fastify en Render.com usando el plan gratuito, **sin Docker**, usando los buildpacks nativos de Node.js.

## 🎯 Objetivo

Desplegar `services/api/` en Render.com para que sea accesible por HTTP y se conecte a Neon PostgreSQL.

## 📋 Prerrequisitos

1. **Cuenta en Render.com**: [render.com](https://render.com) (gratis)
2. **Repositorio en GitHub**: Tu código debe estar en GitHub
3. **Base de datos Neon**: Configurada con credenciales
4. **Node.js 20+**: Render detectará automáticamente la versión

## 🏗️ Arquitectura

```
Frontend (Vercel/Next.js)
    ↓ HTTP
API Fastify (Render.com - Gratis)
    ↓ Prisma Client / HTTP
Neon PostgreSQL (Serverless)
```

## ⚠️ Limitaciones del Plan Gratuito

- ✅ **Gratis**: $0/mes
- ⚠️ **Sleep**: Se duerme después de 15 minutos de inactividad (se despierta automáticamente con el primer request)
- ✅ **HTTPS**: Incluido automáticamente
- ✅ **Variables de entorno**: Soportadas
- ✅ **Logs**: Disponibles en dashboard
- ⚠️ **Build time**: Limitado a 90 minutos
- ⚠️ **RAM**: 512MB (suficiente para API pequeña/mediana)

## 🚀 Pasos de Despliegue

### Paso 1: Preparar el Repositorio

**IMPORTANTE**: Si `services/api` es un repositorio Git separado (`multisystem-api`):
- Conecta el repositorio `multisystem-api` directamente en Render (no el repositorio principal)
- Root Directory será `/` (raíz)

Si `services/api` está dentro del repositorio principal:
- Conecta el repositorio principal `multisystem`
- Root Directory será `services/api`

Asegúrate de que el repositorio tenga:

- ✅ `package.json` con scripts `build` y `start`
- ✅ `tsconfig.json` para compilar TypeScript (con `types: ["node"]`)
- ✅ Código fuente en `src/`

### Paso 2: Crear Nuevo Web Service en Render

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub (si es la primera vez, autoriza Render)
4. Selecciona el repositorio `multisystem` (o el nombre de tu repo)

### Paso 3: Configurar el Servicio

#### Configuración Básica

- **Name**: `multisystem-api` (o el nombre que prefieras)
- **Region**: Elige la región más cercana a tus usuarios
- **Branch**: `master` o `main` (según tu rama principal)
- **Root Directory**: `/` (raíz del repositorio `multisystem-api`) ⚠️ **IMPORTANTE**
- **Runtime**: `Node` (Render lo detecta automáticamente)
- **Build Command**: `pnpm install --prod=false && pnpm build`
- **Start Command**: `pnpm start`

#### Configuración Avanzada (Opcional)

- **Auto-Deploy**: `Yes` (despliega automáticamente en cada push)
- **Health Check Path**: `/health` (ya existe en tu API)

### Paso 4: Configurar Variables de Entorno

En la sección **"Environment"** del servicio, agrega:

```bash
# Puerto (Render lo asigna automáticamente, pero puedes dejarlo)
PORT=10000

# Orígenes CORS permitidos (comma-separated)
# Reemplaza con las URLs de tus frontends desplegados
CORS_ORIGIN=https://tu-hub.vercel.app,https://tu-shopflow.vercel.app,https://tu-workify.vercel.app

# URL de conexión a Neon (con -pooler para mejor rendimiento)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Entorno
NODE_ENV=production
```

**Nota sobre DATABASE_URL**: 
- Usa la URL con `-pooler` en el host para conexiones pooled (mejor para serverless)
- Obtén la URL desde [Neon Console](https://console.neon.tech) → Tu proyecto → Connection Details

### Paso 5: Desplegar

1. Haz clic en **"Create Web Service"**
2. Render comenzará el build automáticamente
3. Monitorea los logs en tiempo real
4. Una vez completado, obtendrás una URL como: `https://multisystem-api.onrender.com`

## 📝 Verificación Post-Despliegue

### 1. Health Check

```bash
curl https://tu-api.onrender.com/health
```

Debería responder:
```json
{ "status": "ok" }
```

### 2. Probar Endpoints

```bash
# Ejemplo: endpoint de usuarios (si existe)
curl https://tu-api.onrender.com/api/users
```

### 3. Verificar Logs

En el dashboard de Render, ve a **"Logs"** para ver:
- ✅ Build exitoso
- ✅ Servidor iniciado correctamente
- ✅ Conexión a Neon establecida
- ⚠️ Cualquier error o warning

## 🔧 Configuración Detallada

### Build Command

```bash
pnpm install --prod=false && pnpm build
```

**Explicación**:
- `pnpm install --prod=false`: Instala todas las dependencias incluyendo devDependencies (necesario para TypeScript y @types/node)
- `pnpm build`: Compila TypeScript a JavaScript usando `tsc`

### Start Command

```bash
pnpm start
```

**Explicación**:
- Ejecuta `node dist/server.js` (definido en `package.json` scripts)
- Render asigna el puerto automáticamente vía variable `PORT`
- Fastify ya está configurado para leer `process.env.PORT`

### Root Directory

**IMPORTANTE**: Debe ser `/` (raíz) porque:
- Si `services/api` es un repositorio Git separado (`multisystem-api`), conecta ese repositorio directamente
- El código de la API está en la raíz de ese repositorio
- El `package.json` de la API está en la raíz del repositorio `multisystem-api`
- Si usas el repositorio principal `multisystem`, entonces Root Directory sería `services/api`

## 🔄 Actualización Automática

Render despliega automáticamente cuando:
- ✅ Haces push a la rama principal (`master`/`main`)
- ✅ Haces push a otras ramas (si tienes preview deployments habilitados)

## 🐛 Solución de Problemas

### Error: "Build failed - Cannot find module"

**Causa**: Dependencias no instaladas correctamente

**Solución**:
1. Verifica que `pnpm-lock.yaml` esté commitado
2. Verifica que `Root Directory` esté configurado como `services/api`
3. Revisa los logs de build para ver qué módulo falta

### Error: "Port already in use"

**Causa**: Conflicto de puerto

**Solución**:
- Render asigna el puerto automáticamente vía `PORT`
- Asegúrate de que Fastify use `process.env.PORT` (ya lo hace)
- No hardcodees puertos en el código

### Error: "Cannot connect to database"

**Causa**: `DATABASE_URL` incorrecta o Neon no accesible

**Solución**:
1. Verifica que `DATABASE_URL` esté configurada en variables de entorno
2. Verifica que uses la URL con `-pooler` para mejor rendimiento
3. Verifica que Neon permita conexiones desde cualquier IP (por defecto sí)
4. Revisa los logs para ver el error específico de conexión

### Error: "CORS blocked"

**Causa**: Orígenes no configurados correctamente

**Solución**:
1. Verifica que `CORS_ORIGIN` incluya todas las URLs de tus frontends
2. Asegúrate de usar `https://` en producción (no `http://`)
3. Separa múltiples orígenes con comas: `https://app1.com,https://app2.com`

### Cold Start Lento

**Causa**: Servicio dormido (plan gratuito)

**Solución**:
- Es normal en el plan gratuito después de 15 min de inactividad
- El primer request puede tardar 10-30 segundos
- Considera usar un servicio de "ping" periódico para mantenerlo activo (ej: UptimeRobot)

## 📊 Monitoreo

### Logs en Tiempo Real

Render proporciona logs en tiempo real en el dashboard:
- Build logs: Durante el proceso de build
- Runtime logs: Logs de la aplicación en ejecución
- Puedes filtrar por nivel (info, warn, error)

### Health Checks

Render verifica automáticamente el endpoint `/health`:
- Configura **Health Check Path**: `/health`
- Render verificará cada 30 segundos aproximadamente
- Si falla, Render reiniciará el servicio

## 💰 Costos

- **Render Free Tier**: $0/mes
- **Neon Free Tier**: $0/mes (hasta cierto límite de uso)
- **Total**: **$0/mes** ✅

## 🔐 Seguridad

### Variables de Entorno Sensibles

- ✅ Nunca commitees `.env` files
- ✅ Usa variables de entorno de Render para secrets
- ✅ `DATABASE_URL` debe estar en variables de entorno, no en código

### HTTPS

- ✅ Render proporciona HTTPS automáticamente
- ✅ Todos los requests deben usar `https://`
- ✅ CORS debe configurarse con URLs HTTPS

## 📚 Referencias

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/node-version)
- [Neon Connection Strings](https://neon.tech/docs/connect/connection-string)
- [Fastify Documentation](https://www.fastify.io/)

## ✅ Checklist de Despliegue

### Antes de Desplegar

- [ ] Código en GitHub
- [ ] `package.json` con scripts `build` y `start`
- [ ] `tsconfig.json` configurado
- [ ] Health check endpoint `/health` funcionando
- [ ] Base de datos Neon configurada

### Configuración en Render

- [ ] Web Service creado
- [ ] Root Directory: `services/api`
- [ ] Build Command: `pnpm install && pnpm build`
- [ ] Start Command: `pnpm start`
- [ ] Variables de entorno configuradas:
  - [ ] `DATABASE_URL` (Neon con -pooler)
  - [ ] `CORS_ORIGIN` (URLs de frontends)
  - [ ] `NODE_ENV=production`
- [ ] Health Check Path: `/health`

### Post-Despliegue

- [ ] Health check responde correctamente
- [ ] Endpoints funcionan
- [ ] Conexión a Neon establecida
- [ ] Logs sin errores críticos
- [ ] Frontends actualizados con nueva URL de API

## 🎉 Siguiente Paso

Una vez desplegada la API en Render:

1. **Actualizar frontends**: Cambiar `NEXT_PUBLIC_API_URL` en Vercel a la nueva URL de Render
2. **Probar integración**: Verificar que los frontends se conecten correctamente
3. **Configurar monitoreo**: Considerar servicios de uptime monitoring (opcional)
