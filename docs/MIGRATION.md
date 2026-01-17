# Guía de Migración a Git Submodules

Esta guía explica cómo migrar los monorepos existentes (hub, shopflow, workify) a la nueva estructura con Git Submodules.

## ⚠️ Importante

**Antes de comenzar**, asegúrate de:
- Hacer backup de tu trabajo
- Tener todos los cambios commiteados
- Tener acceso a los repositorios remotos de cada monorepo

## Escenario A: Los Monorepos Ya Tienen Repositorios Git Separados

Si cada monorepo (hub, shopflow, workify) ya tiene su propio repositorio Git:

### Paso 1: Verificar Repositorios Remotos

```bash
# Verificar que cada monorepo tiene un remote configurado
cd hub
git remote -v
# Deberías ver algo como: origin  https://github.com/tu-usuario/hub.git

cd ../shopflow
git remote -v

cd ../workify
git remote -v
```

### Paso 2: Crear Directorio modules/ (si no existe)

```bash
cd ..  # Volver a la raíz de multisystem
mkdir modules
```

### Paso 3: Mover Monorepos a modules/

```bash
# Mover cada monorepo
git mv hub modules/hub
git mv shopflow modules/shopflow
git mv workify modules/workify
```

### Paso 4: Configurar Submodules

```bash
# Eliminar los directorios del índice de Git (pero mantener los archivos)
git rm --cached modules/hub modules/shopflow modules/workify

# Agregar como submodules
git submodule add <URL_REPO_HUB> modules/hub
git submodule add <URL_REPO_SHOPFLOW> modules/shopflow
git submodule add <URL_REPO_WORKIFY> modules/workify
```

### Paso 5: Commit

```bash
git add .gitmodules
git commit -m "refactor: migrar monorepos a Git Submodules"
```

## Escenario B: Los Monorepos NO Tienen Repositorios Git Separados

Si los monorepos están dentro del repositorio principal sin sus propios repos:

### Paso 1: Crear Repositorios para Cada Monorepo

1. Crea un nuevo repositorio en GitHub/GitLab/etc. para cada monorepo:
   - `hub` → nuevo repo: `https://github.com/tu-usuario/hub.git`
   - `shopflow` → nuevo repo: `https://github.com/tu-usuario/shopflow.git`
   - `workify` → nuevo repo: `https://github.com/tu-usuario/workify.git`

### Paso 2: Inicializar Repositorios en Cada Monorepo

```bash
# Para hub
cd hub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL_REPO_HUB>
git push -u origin main
cd ..

# Repetir para shopflow y workify
cd shopflow
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL_REPO_SHOPFLOW>
git push -u origin main
cd ..

cd workify
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL_REPO_WORKIFY>
git push -u origin main
cd ..
```

### Paso 3: Mover a modules/ y Configurar Submodules

```bash
# Volver a la raíz
cd ..

# Crear directorio modules
mkdir modules

# Mover monorepos
git mv hub modules/hub
git mv shopflow modules/shopflow
git mv workify modules/workify

# Eliminar del índice
git rm --cached modules/hub modules/shopflow modules/workify

# Agregar como submodules
git submodule add <URL_REPO_HUB> modules/hub
git submodule add <URL_REPO_SHOPFLOW> modules/shopflow
git submodule add <URL_REPO_WORKIFY> modules/workify
```

### Paso 4: Commit

```bash
git add .gitmodules
git commit -m "refactor: migrar monorepos a Git Submodules"
```

## Paso 5: Actualizar Configuración

### Actualizar .gitmodules

Edita `.gitmodules` y asegúrate de que las URLs sean correctas:

```ini
[submodule "modules/hub"]
    path = modules/hub
    url = https://github.com/tu-usuario/hub.git
    
[submodule "modules/shopflow"]
    path = modules/shopflow
    url = https://github.com/tu-usuario/shopflow.git
    
[submodule "modules/workify"]
    path = modules/workify
    url = https://github.com/tu-usuario/workify.git
```

### Verificar Docker Compose

Los archivos `docker-compose.yml` y `docker-compose.prod.yml` ya deberían estar actualizados con los nuevos paths (`./modules/hub`, etc.). Verifica que estén correctos.

## Paso 6: Verificar que Todo Funciona

```bash
# Verificar estado de submodules
git submodule status

# Deberías ver algo como:
# abc1234 modules/hub (v1.0.0)
# def5678 modules/shopflow (v1.0.0)
# ghi9012 modules/workify (v1.0.0)

# Verificar que Docker puede encontrar los módulos
docker-compose config
```

## Paso 7: Actualizar .gitignore

El `.gitignore` ya debería estar actualizado con las reglas para submodules. Verifica que incluya:

```gitignore
# Git Submodules - ignorar contenido pero permitir referencias
modules/*/
!modules/*/.git
!modules/*/.gitmodules
```

## Solución de Problemas

### Error: "fatal: not a git repository"

Si al intentar agregar un submodule obtienes este error, significa que el directorio ya tiene un `.git` pero no está configurado correctamente.

**Solución:**
```bash
# Eliminar el directorio del índice y el .git local
rm -rf modules/hub/.git
git rm --cached modules/hub

# Agregar como submodule
git submodule add <URL_REPO_HUB> modules/hub
```

### Los Archivos No Se Mueven

Si `git mv` no funciona, puedes mover manualmente:

```bash
# Mover manualmente
mv hub modules/hub
mv shopflow modules/shopflow
mv workify modules/workify

# Agregar cambios
git add modules/
git commit -m "refactor: mover monorepos a modules/"

# Luego configurar como submodules (ver Paso 4)
```

### Conflicto con Historial Existente

Si hay conflictos con el historial de Git, puedes usar `--force`:

```bash
git submodule add --force <URL_REPO> modules/nombre
```

## Después de la Migración

1. **Actualiza la documentación** del equipo sobre la nueva estructura
2. **Comunica los cambios** a todos los desarrolladores
3. **Actualiza CI/CD** si es necesario para manejar submodules
4. **Prueba el flujo completo** de desarrollo con la nueva estructura

## Comandos Útiles Post-Migración

```bash
# Clonar proyecto con submodules
git clone --recurse-submodules <URL_REPO_MULTISYSTEM>

# Actualizar submodules
git submodule update --remote

# Trabajar en un módulo
cd modules/hub
git checkout -b feature/nueva-feature
# ... trabajar ...
git push origin feature/nueva-feature
```

## Referencias

- [README Principal](../README.md)
- [Guía de Desarrollo](DEVELOPMENT.md)
- [Documentación de Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
