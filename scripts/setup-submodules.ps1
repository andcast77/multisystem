# Script para inicializar y actualizar Git Submodules (PowerShell)

Write-Host "🔧 Configurando Git Submodules..." -ForegroundColor Cyan

# Verificar que estamos en el directorio raíz del proyecto
if (-not (Test-Path ".gitmodules")) {
    Write-Host "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Inicializar submodules si no están inicializados
Write-Host "📦 Inicializando submodules..." -ForegroundColor Yellow
git submodule update --init --recursive

# Verificar estado de submodules
Write-Host ""
Write-Host "📊 Estado de submodules:" -ForegroundColor Cyan
git submodule status

Write-Host ""
Write-Host "✅ Submodules configurados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para actualizar submodules a la última versión, ejecuta:" -ForegroundColor Yellow
Write-Host "   git submodule update --remote" -ForegroundColor Gray
