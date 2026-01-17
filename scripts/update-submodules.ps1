# Script para actualizar Git Submodules a la última versión (PowerShell)

Write-Host "🔄 Actualizando Git Submodules..." -ForegroundColor Cyan

# Verificar que estamos en el directorio raíz del proyecto
if (-not (Test-Path ".gitmodules")) {
    Write-Host "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Actualizar todos los submodules a la última versión de sus ramas remotas
Write-Host "📥 Actualizando submodules desde remotos..." -ForegroundColor Yellow
git submodule update --remote

# Mostrar estado actualizado
Write-Host ""
Write-Host "📊 Estado actualizado de submodules:" -ForegroundColor Cyan
git submodule status

Write-Host ""
Write-Host "✅ Submodules actualizados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Nota: Los cambios en submodules deben ser commiteados en el repositorio principal:" -ForegroundColor Yellow
Write-Host "   git add modules/" -ForegroundColor Gray
Write-Host "   git commit -m 'chore: actualizar submodules'" -ForegroundColor Gray
