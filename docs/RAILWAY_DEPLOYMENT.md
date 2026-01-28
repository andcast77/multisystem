# Guía de Despliegue en Railway

Esta guía explica cómo desplegar el proyecto Multisystem en Railway, la plataforma recomendada para producción debido a su soporte nativo para Docker Compose y PostgreSQL gestionado.

## Resumen

Railway es la plataforma ideal para Multisystem porque:

- ✅ **Soporte nativo de Docker Compose**: Puedes desplegar tu `docker-compose.prod.yml` casi sin cambios
- ✅ **PostgreSQL gestionado**: Base de datos incluida con backups automáticos
- ✅ **Networking automático**: Los servicios se comunican usando nombres de servicio (ej: `api:3000`)
- ✅ **Git Submodules**: Soporte completo para submodules durante el build
- ✅ **Simplicidad**: Despliegue en minutos con configuración mínima
- ✅ **Precio razonable**: Plan gratuito con $5 de crédito/mes, luego pay-as-you-go

## Requisitos Previos

- Cuenta de Railway ([railway.app](https://railway.app))
- Repositorio en GitHub, GitLab o Bitbucket
- Docker Compose configurado (`docker-compose.prod.yml`)
- Git Submodules inicializados en el repositorio

## Arquitectura en Railway

```
┌─────────────────────────────────────┐
│         Railway Platform            │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐                  │
│  │ Hub Frontend │  Next.js + Nginx │
│  │  (Puerto 80) │                  │
│  └──────┬───────┘                  │
│         │                           │
│  ┌──────▼───────┐                  │
│  │ ShopFlow     │  Next.js         │
│  │  (Puerto 3)  │                  │
│  └──────┬───────┘                  │
│         │                           │
│  ┌──────▼───────┐                  │
│  │ Workify      │  Next.js         │
│  │  (Puerto 4)  │                  │
│  └──────┬───────┘                  │
│         │                           │
│  ┌──────▼───────┐                  │
│  │ API Backend  │  Node.js         │
│  │  (Puerto 0)  │                  │
│  └──────┬───────┘                  │
│         │                           │
│  ┌──────▼───────┐                  │
│  │ PostgreSQL   │  Gestionado      │
│  │  (Railway)   │                  │
│  └─────────────┘                  │
│                                     │
└─────────────────────────────────────┘
```

## Pasos de Despliegue

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio de GitHub
5. Selecciona el repositorio `multisystem`

### 2. Configurar Docker Compose

Railway detectará automáticamente `docker-compose.prod.yml` en la raíz del repositorio.

**Nota importante**: Railway usa el archivo `docker-compose.yml` o `docker-compose.prod.yml` si está presente. Asegúrate de que el archivo de producción esté en la raíz.

Si Railway no detecta automáticamente Docker Compose:

1. Ve a la configuración del proyecto
2. En "Settings" → "Service Source"
3. Selecciona "Docker Compose"
4. Especifica el archivo: `docker-compose.prod.yml`

### 3. Configurar PostgreSQL Gestionado

En lugar de usar el servicio PostgreSQL de Docker Compose, usa el PostgreSQL gestionado de Railway:

1. En el dashboard de Railway, haz clic en "New" → "Database" → "PostgreSQL"
2. Railway creará automáticamente un servicio PostgreSQL
3. Copia la variable de entorno `DATABASE_URL` que Railway genera automáticamente
4. Esta URL será algo como: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

### 4. Configurar Variables de Entorno

Ve a "Variables" en el dashboard de Railway y configura las siguientes variables:

#### Variables Requeridas

```bash
# Base de datos (usar la URL de Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Entorno
NODE_ENV=production

# Puertos (Railway asigna puertos automáticamente, pero puedes usar defaults)
API_PORT=3000
HUB_FRONTEND_PORT=3005
SHOPFLOW_FRONTEND_PORT=3003
WORKIFY_FRONTEND_PORT=3004

# URLs internas (usar nombres de servicio de Railway)
# Railway usa nombres de servicio basados en los nombres en docker-compose
NEXT_PUBLIC_API_URL=http://api:3000
NEXT_PUBLIC_SHOPFLOW_URL=http://shopflow-frontend:3003
NEXT_PUBLIC_WORKIFY_URL=http://workify-frontend:3004

# CORS (ajustar con las URLs públicas de Railway)
CORS_ORIGINS=https://tu-proyecto.railway.app,https://shopflow.railway.app,https://workify.railway.app

# Habilitación de módulos
NEXT_PUBLIC_SHOPFLOW_ENABLED=true
NEXT_PUBLIC_WORKIFY_ENABLED=true

# Telemetría
NEXT_TELEMETRY_DISABLED=1
```

#### Variables Opcionales de PostgreSQL

Si prefieres mantener el servicio PostgreSQL de Docker Compose (no recomendado para producción):

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=multisystem_db
POSTGRES_PORT=5432
```

**Recomendación**: Usa siempre PostgreSQL gestionado de Railway para producción.

### 5. Configurar Git Submodules

Railway necesita inicializar los submodules durante el build. Railway debería hacerlo automáticamente, pero si tienes problemas:

1. Ve a "Settings" → "Build Command"
2. Agrega antes del build:
   ```bash
   git submodule update --init --recursive && docker-compose -f docker-compose.prod.yml up --build
   ```

O configura en `railway.json` (ver sección de configuración avanzada).

### 6. Ajustar docker-compose.prod.yml para Railway

Railway puede requerir algunos ajustes menores. Crea un archivo `docker-compose.railway.yml` o modifica temporalmente `docker-compose.prod.yml`:

**Cambios recomendados**:

1. **Remover el servicio PostgreSQL** si usas PostgreSQL gestionado de Railway:
   ```yaml
   # Comentar o remover el servicio postgres
   # postgres:
   #   image: postgres:16-alpine
   #   ...
   ```

2. **Ajustar depends_on**: Si removiste PostgreSQL, ajusta las dependencias:
   ```yaml
   api:
     # depends_on:
     #   postgres:
     #     condition: service_healthy
   ```

3. **Puertos**: Railway asigna puertos automáticamente, pero puedes mantener la configuración actual.

### 7. Desplegar

1. Railway comenzará el despliegue automáticamente cuando detecte cambios
2. Puedes forzar un despliegue desde el dashboard
3. Monitorea los logs en tiempo real desde el dashboard

### 8. Configurar Dominios Públicos

1. Ve a cada servicio en Railway
2. Haz clic en "Settings" → "Generate Domain"
3. Railway generará una URL pública (ej: `tu-proyecto.railway.app`)
4. Actualiza `CORS_ORIGINS` con las URLs públicas generadas

## Configuración Detallada

### Networking entre Servicios

Railway crea una red interna donde los servicios se comunican usando los nombres definidos en `docker-compose.prod.yml`:

- `api:3000` → Servicio API
- `shopflow-frontend:3003` → Servicio ShopFlow
- `workify-frontend:3004` → Servicio Workify
- `hub-frontend:3005` → Servicio Hub

**Importante**: Las variables `NEXT_PUBLIC_*` deben usar estos nombres internos, no URLs públicas.

### Health Checks

Railway usa los health checks definidos en `docker-compose.prod.yml`. Asegúrate de que cada servicio tenga un endpoint de health:

- API: `/health`
- Hub: `/health` (vía Nginx)
- ShopFlow: `/api/health`
- Workify: `/api/health`

### Migraciones de Base de Datos

Para ejecutar migraciones Prisma:

1. **Opción 1: Script manual desde Railway CLI**
   ```bash
   railway run --service api sh -c "cd services/database && pnpm install && pnpm exec prisma generate && pnpm exec prisma db push"
   ```

2. **Opción 2: Usando migraciones formales**
   ```bash
   railway run --service api sh -c "cd services/database && pnpm install && pnpm exec prisma migrate deploy"
   ```

3. **Opción 3: En el build de la API**
   - Agrega migraciones al Dockerfile de la API para ejecutarlas automáticamente

### Variables de Entorno por Servicio

Puedes configurar variables de entorno específicas por servicio en Railway:

1. Selecciona el servicio (ej: `api`)
2. Ve a "Variables"
3. Agrega variables específicas del servicio

Variables que pueden ser específicas por servicio:
- `PORT` (Railway lo asigna automáticamente)
- `DATABASE_URL` (solo para API)
- `NEXT_PUBLIC_API_URL` (solo para frontends)

## Troubleshooting

### Error: Submodules no inicializados

**Síntoma**: Build falla con error de directorios vacíos en `services/api` o `modules/`

**Solución**:
1. Verifica que los submodules estén configurados en `.gitmodules`
2. Asegúrate de que Railway tenga acceso al repositorio
3. Agrega al build command: `git submodule update --init --recursive`

### Error: Servicios no se comunican

**Síntoma**: Los frontends no pueden conectarse a la API

**Solución**:
1. Verifica que uses nombres de servicio correctos (ej: `http://api:3000`)
2. Verifica que los servicios estén en la misma red (mismo docker-compose)
3. Revisa los logs de cada servicio

### Error: PostgreSQL no encontrado

**Síntoma**: La API no puede conectarse a PostgreSQL

**Solución**:
1. Si usas PostgreSQL gestionado: Verifica que `DATABASE_URL` esté configurada correctamente
2. Si usas PostgreSQL de Docker Compose: Verifica que el servicio esté desplegado
3. Revisa que `depends_on` esté configurado correctamente

### Error: Build timeout

**Síntoma**: El build excede el tiempo límite

**Solución**:
1. Optimiza el Dockerfile (usa multi-stage builds)
2. Reduce el tamaño de la imagen
3. Usa `.dockerignore` para excluir archivos innecesarios
4. Considera usar build cache de Railway

### Error: Puerto ya en uso

**Síntoma**: Railway no puede asignar puertos

**Solución**:
1. Railway asigna puertos automáticamente
2. No necesitas especificar puertos en `docker-compose.yml` para Railway
3. Usa variables de entorno para obtener el puerto asignado: `$PORT`

### Logs no aparecen

**Síntoma**: No ves logs en el dashboard

**Solución**:
1. Verifica que los servicios estén ejecutándose
2. Revisa la configuración de logging en cada servicio
3. Usa `railway logs` desde la CLI

## Mejores Prácticas

### 1. Gestión de Variables de Entorno

- Usa Railway's variable management para secrets
- No commitees `.env` files
- Usa diferentes variables para desarrollo y producción
- Documenta todas las variables requeridas

### 2. Backups de Base de Datos

Railway PostgreSQL gestionado incluye backups automáticos, pero:

- Configura backups manuales periódicos si es crítico
- Documenta el proceso de restauración
- Considera usar Railway's point-in-time recovery

### 3. Monitoreo

- Usa Railway's built-in metrics
- Configura alertas para errores críticos
- Monitorea el uso de recursos
- Revisa logs regularmente

### 4. Escalabilidad

- Railway escala automáticamente según el tráfico
- Monitorea el uso de recursos
- Considera separar servicios críticos si es necesario
- Usa Railway's resource limits apropiadamente

### 5. Seguridad

- Usa HTTPS (Railway lo proporciona automáticamente)
- Mantén secrets en Railway's variable management
- No expongas información sensible en logs
- Actualiza dependencias regularmente

## Configuración Avanzada

### railway.json

Crea un archivo `railway.json` en la raíz para configuración adicional:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "docker-compose -f docker-compose.prod.yml up",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Build Commands Personalizados

Si necesitas comandos de build personalizados:

1. Ve a "Settings" → "Build Command"
2. Configura:
   ```bash
   git submodule update --init --recursive && \
   docker-compose -f docker-compose.prod.yml build && \
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Variables de Entorno por Entorno

Railway soporta diferentes variables por entorno (staging, production):

1. Crea diferentes proyectos para cada entorno
2. O usa Railway's environment variables con prefijos
3. Configura variables específicas por servicio

## Comparación con Otras Plataformas

| Característica | Railway | Render | Vercel | Heroku |
|----------------|---------|--------|--------|--------|
| Docker Compose | ✅ Nativo | ❌ | ❌ | ❌ |
| PostgreSQL | ✅ Gestionado | ✅ | ⚠️ Addon | ✅ Addon |
| Git Submodules | ✅ | ⚠️ | ⚠️ | ✅ |
| Networking Interno | ✅ Automático | ⚠️ Manual | ❌ | ⚠️ |
| Precio | $5 crédito/mes | Gratis (limitado) | Gratis (limitado) | $7/mes |
| Facilidad Setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

## Referencias

- [Documentación oficial de Railway](https://docs.railway.app)
- [Railway Docker Compose](https://docs.railway.app/deploy/docker)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Railway Environment Variables](https://docs.railway.app/deploy/variables)

## Notas Importantes

- Railway asigna puertos automáticamente, pero puedes usar los defaults de tu docker-compose
- Los servicios se comunican usando nombres de servicio, no IPs
- PostgreSQL gestionado es recomendado sobre el contenedor de Docker Compose
- Los submodules se inicializan automáticamente, pero verifica si hay problemas
- Railway proporciona HTTPS automáticamente para todos los servicios
- Monitorea el uso de recursos para optimizar costos

## Soporte

Si encuentras problemas:

1. Revisa los logs en Railway dashboard
2. Consulta la [documentación de Railway](https://docs.railway.app)
3. Revisa los [foros de Railway](https://railway.app/community)
4. Abre un issue en el repositorio del proyecto
