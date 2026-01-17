# Script para inicializar el entorno de desarrollo completo (PowerShell)

Write-Host "🚀 Inicializando entorno de desarrollo de Multisystem..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio raíz del proyecto
if (-not (Test-Path ".gitmodules")) {
    Write-Host "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Paso 1: Configurar submodules
Write-Host "📦 Paso 1/3: Configurando Git Submodules..." -ForegroundColor Yellow
& .\scripts\setup-submodules.ps1

# Paso 2: Verificar que los submodules existen
Write-Host ""
Write-Host "🔍 Paso 2/3: Verificando estructura de módulos..." -ForegroundColor Yellow
if (-not (Test-Path "modules/hub") -or -not (Test-Path "modules/shopflow") -or -not (Test-Path "modules/workify")) {
    Write-Host "⚠️  Advertencia: Algunos módulos no están presentes." -ForegroundColor Yellow
    Write-Host "   Asegúrate de que las URLs en .gitmodules sean correctas." -ForegroundColor Gray
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
Write-Host "   1. Configura las URLs de los repositorios en .gitmodules" -ForegroundColor Gray
Write-Host "   2. Ejecuta: .\scripts\setup-submodules.ps1" -ForegroundColor Gray
Write-Host "   3. Instala las dependencias de cada módulo" -ForegroundColor Gray
Write-Host "   4. Configura las variables de entorno (.env)" -ForegroundColor Gray
Write-Host "   5. Inicia los servicios con: docker-compose up" -ForegroundColor Gray
