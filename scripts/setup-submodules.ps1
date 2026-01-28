# Script para inicializar y actualizar Git Submodules (PowerShell)
# Nota: Los módulos frontend (ShopFlow, Workify) son repositorios independientes
#       y se clonan con scripts/setup-modules-dev.ps1

Write-Host "🔧 Configurando Git Submodules (solo servicios backend)..." -ForegroundColor Cyan

# Verificar que estamos en el directorio raíz del proyecto
if (-not (Test-Path ".gitmodules")) {
    Write-Host "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Inicializar submodules si no están inicializados
Write-Host "📦 Inicializando submodules de servicios backend..." -ForegroundColor Yellow
Write-Host "   (services/api y services/database)" -ForegroundColor Gray
git submodule update --init --recursive

# Verificar estado de submodules
Write-Host ""
Write-Host "📊 Estado de submodules:" -ForegroundColor Cyan
git submodule status

Write-Host ""
Write-Host "✅ Submodules de servicios backend configurados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para actualizar submodules a la última versión, ejecuta:" -ForegroundColor Yellow
Write-Host "   git submodule update --remote" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Nota: Los módulos frontend (ShopFlow, Workify) son repositorios independientes." -ForegroundColor Yellow
Write-Host "   Para clonarlos localmente, usa: .\scripts\setup-modules-dev.ps1" -ForegroundColor Gray
