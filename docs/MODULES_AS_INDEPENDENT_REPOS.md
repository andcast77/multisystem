# Módulos como Repositorios Independientes

## 🎯 Objetivo

Los módulos frontend (ShopFlow, Workify) deben ser **repositorios Git completamente independientes**, no Git Submodules. Esto permite:

- ✅ Despliegue en Vercel sin problemas
- ✅ Cada módulo en su propio dominio
- ✅ Despliegue independiente
- ✅ Mejor separación de responsabilidades

## 🏗️ Arquitectura de Repositorios

### Estructura Actual (Con Submodules) ❌

```
multisystem/ (repositorio principal)
├── modules/
│   ├── shopflow/  (Git Submodule)
│   └── workify/   (Git Submodule)
└── services/
    ├── api/       (Git Submodule)
    └── database/  (Git Submodule)
```

**Problema**: Vercel no es compatible con Git Submodules para proyectos separados.

### Estructura Recomendada (Repositorios Independientes) ✅

```
multisystem/ (repositorio principal - solo Hub)
└── (código del Hub)

multisystem-shopflow/ (repositorio independiente)
└── (código de ShopFlow)

multisystem-workify/ (repositorio independiente)
└── (código de Workify)

multisystem-api/ (repositorio independiente - backend)
└── (código de API)

multisystem-database/ (repositorio independiente - backend)
└── (código de Database API)
```

## 🔄 Migración de Submodules a Repositorios Independientes

### Paso 1: Crear Repositorios Independientes

Si actualmente tienes submodules, necesitas convertirlos en repositorios independientes:

#### Para ShopFlow:

```bash
# 1. Crear nuevo repositorio en GitHub/GitLab
# Nombre: multisystem-shopflow

# 2. Desde el directorio del submodule
cd modules/shopflow

# 3. Verificar que estás en la rama correcta
git checkout main  # o master

# 4. Agregar el nuevo repositorio remoto
git remote add origin-new https://github.com/tu-usuario/multisystem-shopflow.git

# 5. Push al nuevo repositorio
git push origin-new main

# 6. (Opcional) Cambiar el remoto principal
git remote remove origin
git remote rename origin-new origin
```

#### Para Workify:

```bash
cd modules/workify
git remote add origin-new https://github.com/tu-usuario/multisystem-workify.git
git push origin-new main
```

### Paso 2: Actualizar Referencias en el Repositorio Principal

Una vez que los módulos son repositorios independientes, puedes:

**Opción A: Eliminar los submodules del repositorio principal**

```bash
# Desde la raíz del repositorio principal
git submodule deinit modules/shopflow
git submodule deinit modules/workify
git rm modules/shopflow
git rm modules/workify
git commit -m "chore: convertir módulos a repositorios independientes"
```

**Opción B: Mantener referencias locales (solo para desarrollo)**

Puedes mantener los directorios `modules/` localmente para desarrollo, pero no como submodules:

```bash
# Eliminar submodules
git submodule deinit modules/shopflow
git submodule deinit modules/workify
git rm modules/shopflow
git rm modules/workify

# Agregar a .gitignore
echo "modules/" >> .gitignore

# Clonar localmente para desarrollo (opcional)
git clone https://github.com/tu-usuario/multisystem-shopflow.git modules/shopflow
git clone https://github.com/tu-usuario/multisystem-workify.git modules/workify
```

### Paso 3: Actualizar .gitmodules

Elimina las entradas de los módulos frontend de `.gitmodules`:

```ini
# Mantener solo servicios backend como submodules (si los necesitas)
[submodule "services/api"]
	path = services/api
	url = https://github.com/tu-usuario/multisystem-api.git

[submodule "services/database"]
	path = services/database
	url = https://github.com/tu-usuario/multisystem-database.git

# Eliminar módulos frontend (ahora son repositorios independientes)
# [submodule "modules/shopflow"]  ← ELIMINAR
# [submodule "modules/workify"]    ← ELIMINAR
```

## 🚀 Despliegue en Vercel

### Hub (Repositorio Principal)

1. Conecta el repositorio `multisystem` a Vercel
2. Configura variables de entorno con URLs de los módulos:

```bash
NEXT_PUBLIC_SHOPFLOW_URL=https://shopflow.tudominio.com
NEXT_PUBLIC_WORKIFY_URL=https://workify.tudominio.com
```

### ShopFlow (Repositorio Independiente)

1. Conecta el repositorio `multisystem-shopflow` a Vercel
2. Vercel detectará Next.js automáticamente
3. Configura dominio personalizado: `shopflow.tudominio.com`
4. Configura variables de entorno:

```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

### Workify (Repositorio Independiente)

1. Conecta el repositorio `multisystem-workify` a Vercel
2. Vercel detectará Next.js automáticamente
3. Configura dominio personalizado: `workify.tudominio.com`
4. Configura variables de entorno:

```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

## 🔧 Desarrollo Local

### Opción 1: Clonar Repositorios Separados

```bash
# Clonar repositorio principal
git clone https://github.com/tu-usuario/multisystem.git
cd multisystem

# Clonar módulos en directorios locales (para desarrollo)
git clone https://github.com/tu-usuario/multisystem-shopflow.git modules/shopflow
git clone https://github.com/tu-usuario/multisystem-workify.git modules/workify

# Agregar a .gitignore
echo "modules/" >> .gitignore
```

### Opción 2: Usar Scripts de Desarrollo

Crea scripts que clonen los repositorios automáticamente:

**scripts/setup-dev.sh**:

```bash
#!/bin/bash

# Clonar módulos si no existen
if [ ! -d "modules/shopflow" ]; then
  git clone https://github.com/tu-usuario/multisystem-shopflow.git modules/shopflow
fi

if [ ! -d "modules/workify" ]; then
  git clone https://github.com/tu-usuario/multisystem-workify.git modules/workify
fi

echo "✅ Módulos clonados para desarrollo local"
```

## 📝 Ventajas de Repositorios Independientes

1. **✅ Compatibilidad con Vercel**: Sin problemas con submodules
2. **✅ Dominios Separados**: Cada módulo en su propio dominio
3. **✅ Despliegue Independiente**: Cambios en un módulo no afectan otros
4. **✅ Permisos Granulares**: Diferentes equipos pueden tener acceso a diferentes repositorios
5. **✅ CI/CD Independiente**: Cada repositorio tiene su propio pipeline
6. **✅ Versionado Independiente**: Cada módulo tiene su propio versionado

## 🔗 Comunicación Entre Módulos

Los módulos se comunican mediante:

1. **HTTP/API**: Cada módulo consume la API compartida
2. **Variables de Entorno**: URLs de otros módulos configuradas en variables de entorno
3. **Dominios Públicos**: Cada módulo es accesible públicamente

### Ejemplo de Configuración

**Hub** (`multisystem`):
```bash
NEXT_PUBLIC_SHOPFLOW_URL=https://shopflow.tudominio.com
NEXT_PUBLIC_WORKIFY_URL=https://workify.tudominio.com
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

**ShopFlow** (`multisystem-shopflow`):
```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

**Workify** (`multisystem-workify`):
```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

## ✅ Checklist de Migración

- [ ] Crear repositorio `multisystem-shopflow` en GitHub/GitLab
- [ ] Crear repositorio `multisystem-workify` en GitHub/GitLab
- [ ] Migrar código de ShopFlow al nuevo repositorio
- [ ] Migrar código de Workify al nuevo repositorio
- [ ] Eliminar submodules del repositorio principal
- [ ] Actualizar `.gitmodules`
- [ ] Actualizar `.gitignore` para excluir `modules/` (opcional)
- [ ] Configurar proyectos en Vercel para cada repositorio
- [ ] Configurar dominios personalizados
- [ ] Actualizar variables de entorno
- [ ] Probar despliegue completo

## 📚 Referencias

- [Guía de Despliegue en Vercel](VERCEL_DEPLOYMENT.md)
- [Documentación de Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Vercel y Monorepos](https://vercel.com/docs/concepts/monorepos)
