# Script para inicializar el entorno de desarrollo completo (PowerShell)

Write-Host "🚀 Inicializando entorno de desarrollo de Multisystem..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio raíz del proyecto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Paso 1: Clonar servicios backend (repositorios independientes)
Write-Host "📦 Paso 1/3: Clonando servicios backend..." -ForegroundColor Yellow
& .\scripts\setup-submodules.ps1

# Paso 2: Verificar estructura
Write-Host ""
Write-Host "🔍 Paso 2/3: Verificando estructura..." -ForegroundColor Yellow
if (-not (Test-Path "services/api") -or -not (Test-Path "services/database")) {
    Write-Host "⚠️  Advertencia: Algunos servicios no están presentes." -ForegroundColor Yellow
    Write-Host "   Ejecuta: .\scripts\setup-submodules.ps1" -ForegroundColor Gray
}

# Paso 3: Instalar dependencias (si es necesario)
Write-Host ""
Write-Host "📚 Paso 3/3: Verificando dependencias..." -ForegroundColor Yellow
Write-Host "   Para instalar dependencias de la API:" -ForegroundColor Gray
Write-Host "   cd api; pnpm install" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Para instalar dependencias de cada módulo:" -ForegroundColor Gray
Write-Host "   cd modules/hub; pnpm install" -ForegroundColor DarkGray
Write-Host "   cd modules/shopflow; pnpm install" -ForegroundColor DarkGray
Write-Host "   cd modules/workify; pnpm install" -ForegroundColor DarkGray
Write-Host ""

Write-Host "✅ Entorno de desarrollo inicializado!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Clona los módulos frontend: .\scripts\setup-modules-dev.ps1" -ForegroundColor Gray
Write-Host "   2. Instala las dependencias de cada servicio/módulo" -ForegroundColor Gray
Write-Host "   3. Configura las variables de entorno (.env)" -ForegroundColor Gray
Write-Host "   4. Inicia los servicios manualmente desde cada directorio" -ForegroundColor Gray
