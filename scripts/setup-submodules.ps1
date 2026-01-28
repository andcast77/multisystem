# Script para clonar servicios backend (repositorios independientes)
# Nota: services/api y services/database son repositorios Git independientes
#       NO son submodules, se clonan directamente para desarrollo local
#       Los módulos frontend se clonan con scripts/setup-modules-dev.ps1

Write-Host "🔧 Clonando servicios backend (repositorios independientes)..." -ForegroundColor Cyan

# Verificar que estamos en el directorio raíz del proyecto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Crear directorio services si no existe
if (-not (Test-Path "services")) {
    New-Item -ItemType Directory -Path "services" | Out-Null
}

# Clonar services/api si no existe
if (-not (Test-Path "services/api")) {
    Write-Host "📦 Clonando services/api..." -ForegroundColor Yellow
    git clone https://github.com/andcast77/multisystem-api.git services/api
} else {
    Write-Host "✅ services/api ya existe (omitiendo)" -ForegroundColor Green
}

# Clonar services/database si no existe
if (-not (Test-Path "services/database")) {
    Write-Host "📦 Clonando services/database..." -ForegroundColor Yellow
    git clone https://github.com/andcast77/multisystem-database.git services/database
} else {
    Write-Host "✅ services/database ya existe (omitiendo)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Servicios backend clonados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para actualizar los servicios, ve a cada directorio y ejecuta:" -ForegroundColor Yellow
Write-Host "   cd services/api; git pull" -ForegroundColor Gray
Write-Host "   cd services/database; git pull" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Nota: Los módulos frontend (ShopFlow, Workify) son repositorios independientes." -ForegroundColor Yellow
Write-Host "   Para clonarlos localmente, usa: .\scripts\setup-modules-dev.ps1" -ForegroundColor Gray
