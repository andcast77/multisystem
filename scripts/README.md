# Scripts de Utilidad - Multisystem

Este directorio contiene scripts de utilidad para clonar repositorios independientes y configurar el entorno de desarrollo.

## Scripts Disponibles

### `setup-submodules.sh` / `setup-submodules.ps1`

Clona los servicios backend (repositorios independientes) localmente para desarrollo.

**Uso:**
```bash
# Linux/Mac
./scripts/setup-submodules.sh

# Windows PowerShell
.\scripts\setup-submodules.ps1
```

**Qué hace:**
- Clona `services/api` y `services/database` desde sus repositorios Git independientes
- Estos son repositorios separados, NO submodules
- Se clonan localmente solo para desarrollo

### `update-submodules.sh` / `update-submodules.ps1`

Actualiza los servicios backend clonados localmente.

**Uso:**
```bash
# Linux/Mac
./scripts/update-submodules.sh

# Windows PowerShell
.\scripts\update-submodules.ps1
```

**Qué hace:**
- Actualiza `services/api` y `services/database` usando `git pull`
- Si hay conflictos, debes resolverlos manualmente en cada directorio

### `setup-modules-dev.sh` / `setup-modules-dev.ps1`

Clona los módulos frontend (repositorios independientes) localmente para desarrollo.

**Uso:**
```bash
# Linux/Mac
./scripts/setup-modules-dev.sh

# Windows PowerShell
.\scripts\setup-modules-dev.ps1
```

**Qué hace:**
- Clona `modules/shopflow` y `modules/workify` desde sus repositorios Git independientes
- Estos son repositorios separados que se despliegan en Vercel

### `init-dev.sh` / `init-dev.ps1`

Inicializa el entorno de desarrollo completo.

**Uso:**
```bash
# Linux/Mac
./scripts/init-dev.sh

# Windows PowerShell
.\scripts\init-dev.ps1
```

**Qué hace:**
1. Clona los servicios backend (repositorios independientes)
2. Verifica la estructura
3. Proporciona instrucciones para instalar dependencias

## Notas

- Los scripts `.sh` son para Linux/Mac y entornos compatibles con bash
- Los scripts `.ps1` son para Windows PowerShell
- Todos los scripts verifican que se ejecuten desde el directorio raíz del proyecto
- Los scripts son idempotentes: puedes ejecutarlos múltiples veces sin problemas

## Permisos (Linux/Mac)

Para ejecutar los scripts `.sh` en Linux/Mac, asegúrate de que tengan permisos de ejecución:

```bash
chmod +x scripts/*.sh
```
