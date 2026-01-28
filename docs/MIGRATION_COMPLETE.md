# Migración Completada: Módulos a Repositorios Independientes

## ✅ Cambios Realizados

### 1. Actualización de `.gitmodules`

- ✅ Eliminadas entradas de `modules/shopflow` y `modules/workify`
- ✅ Mantenidas solo entradas de servicios backend (`services/api` y `services/database`)

### 2. Configuración de Next.js

- ✅ Eliminado `basePath: '/shopflow'` de `modules/shopflow/next.config.ts`
- ✅ Eliminado `basePath: '/workify'` de `modules/workify/next.config.ts`

**Nota**: Los cambios en `next.config.ts` deben hacerse en los repositorios independientes. Si los archivos están en `modules/` localmente, hacer commit y push a los repositorios independientes.

### 3. Scripts Actualizados

- ✅ `scripts/setup-submodules.sh` - Actualizado para solo manejar servicios backend
- ✅ `scripts/setup-submodules.ps1` - Actualizado para solo manejar servicios backend
- ✅ `scripts/setup-modules-dev.sh` - Ya existe para clonar módulos independientes
- ✅ `scripts/setup-modules-dev.ps1` - Ya existe para clonar módulos independientes

### 4. `.gitignore` Actualizado

- ✅ Agregados comentarios sobre módulos frontend como repositorios independientes
- ✅ Opción para agregar `modules/` al `.gitignore` (comentada)

### 5. Documentación Actualizada

- ✅ `README.md` - Actualizado con nueva estructura de repositorios
- ✅ `docs/VERCEL_DEPLOYMENT.md` - Ya estaba actualizado
- ✅ `docs/MODULES_AS_INDEPENDENT_REPOS.md` - Ya existía

## 📋 Próximos Pasos Manuales

### 1. Hacer Commit de Cambios en Repositorios Independientes

Los cambios en `next.config.ts` deben commitearse en los repositorios independientes:

```bash
# Para ShopFlow
cd modules/shopflow
git add next.config.ts
git commit -m "chore: eliminar basePath para despliegue en Vercel"
git push origin master  # o main

# Para Workify
cd modules/workify
git add next.config.ts
git commit -m "chore: eliminar basePath para despliegue en Vercel"
git push origin master  # o main
```

### 2. Hacer Commit de Cambios en Repositorio Principal

```bash
# Desde la raíz del repositorio principal
git add .gitmodules
git add scripts/
git add .gitignore
git add README.md
git commit -m "chore: migrar módulos frontend a repositorios independientes"
git push origin main
```

### 3. Eliminar Submodules del Sistema de Archivos (Opcional)

Si quieres eliminar los directorios `modules/` del repositorio principal:

```bash
# Eliminar submodules del sistema de archivos
git submodule deinit modules/shopflow
git submodule deinit modules/workify
git rm modules/shopflow
git rm modules/workify
git commit -m "chore: eliminar directorios de módulos frontend (ahora repositorios independientes)"
```

**Nota**: Esto eliminará los directorios localmente. Para desarrollo, usa `setup-modules-dev.sh` para clonarlos de nuevo.

### 4. Configurar Proyectos en Vercel

Sigue la guía en [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md):

1. **Crear proyecto para Hub**:
   - Repositorio: `multisystem`
   - Framework: Next.js
   - Variables de entorno:
     ```bash
     NEXT_PUBLIC_API_URL=https://tu-api.railway.app
     NEXT_PUBLIC_SHOPFLOW_URL=https://shopflow.tudominio.com
     NEXT_PUBLIC_WORKIFY_URL=https://workify.tudominio.com
     ```

2. **Crear proyecto para ShopFlow**:
   - Repositorio: `multisystem-shopflow`
   - Framework: Next.js (detectado automáticamente)
   - Variables de entorno:
     ```bash
     NEXT_PUBLIC_API_URL=https://tu-api.railway.app
     ```
   - Dominio personalizado: `shopflow.tudominio.com` (opcional)

3. **Crear proyecto para Workify**:
   - Repositorio: `multisystem-workify`
   - Framework: Next.js (detectado automáticamente)
   - Variables de entorno:
     ```bash
     NEXT_PUBLIC_API_URL=https://tu-api.railway.app
     ```
   - Dominio personalizado: `workify.tudominio.com` (opcional)

### 5. Configurar CORS en Backend

Asegúrate de que la API permita requests desde los dominios de Vercel:

```bash
# En Railway, configura CORS_ORIGINS:
CORS_ORIGINS=https://tu-hub.vercel.app,https://shopflow.tudominio.com,https://workify.tudominio.com,https://*.vercel.app
```

## ✅ Checklist Final

- [x] `.gitmodules` actualizado (módulos frontend eliminados)
- [x] `next.config.ts` de ShopFlow actualizado (basePath eliminado)
- [x] `next.config.ts` de Workify actualizado (basePath eliminado)
- [x] Scripts actualizados
- [x] `.gitignore` actualizado
- [x] `README.md` actualizado
- [ ] Cambios commitados en repositorios independientes (ShopFlow y Workify)
- [ ] Cambios commitados en repositorio principal
- [ ] Proyectos creados en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominios personalizados configurados (opcional)
- [ ] CORS configurado en backend
- [ ] Pruebas de despliegue realizadas

## 📚 Documentación de Referencia

- [Guía de Despliegue en Vercel](VERCEL_DEPLOYMENT.md)
- [Módulos como Repositorios Independientes](MODULES_AS_INDEPENDENT_REPOS.md)
- [Guía de Despliegue en Railway](../RAILWAY_DEPLOYMENT.md)

## 🎉 Resultado

Después de completar estos pasos:

- ✅ Los módulos frontend son repositorios completamente independientes
- ✅ Cada módulo se despliega en Vercel con su propio dominio
- ✅ No hay problemas de compatibilidad con Git Submodules
- ✅ Despliegue independiente de cada módulo
- ✅ Mejor separación de responsabilidades
