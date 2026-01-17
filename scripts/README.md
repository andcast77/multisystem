# Scripts de Utilidad - Multisystem

Este directorio contiene scripts de utilidad para trabajar con Git Submodules y el entorno de desarrollo.

## Scripts Disponibles

### `setup-submodules.sh` / `setup-submodules.ps1`

Inicializa y configura los Git Submodules del proyecto.

**Uso:**
```bash
# Linux/Mac
./scripts/setup-submodules.sh

# Windows PowerShell
.\scripts\setup-submodules.ps1
```

**Qué hace:**
- Verifica que existe `.gitmodules`
- Inicializa todos los submodules recursivamente
- Muestra el estado de los submodules

### `update-submodules.sh` / `update-submodules.ps1`

Actualiza todos los submodules a la última versión de sus ramas remotas.

**Uso:**
```bash
# Linux/Mac
./scripts/update-submodules.sh

# Windows PowerShell
.\scripts\update-submodules.ps1
```

**Qué hace:**
- Actualiza todos los submodules usando `git submodule update --remote`
- Muestra el estado actualizado
- Recuerda que debes hacer commit de los cambios en el repositorio principal

**Después de ejecutar:**
```bash
git add modules/
git commit -m "chore: actualizar submodules"
```

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
1. Configura los Git Submodules
2. Verifica la estructura de módulos
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
