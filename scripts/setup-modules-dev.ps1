# Script para clonar módulos independientes para desarrollo local (PowerShell)
# Los módulos son repositorios independientes, no submodules

$ErrorActionPreference = "Stop"

Write-Host "🔧 Configurando módulos para desarrollo local..." -ForegroundColor Cyan
Write-Host ""

# Directorio base
$BaseDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ModulesDir = Join-Path $BaseDir "modules"

# Crear directorio modules si no existe
if (-not (Test-Path $ModulesDir)) {
    New-Item -ItemType Directory -Path $ModulesDir | Out-Null
}

# URLs de repositorios (actualiza con tus URLs reales)
$ShopflowRepo = if ($env:SHOPFLOW_REPO) { $env:SHOPFLOW_REPO } else { "https://github.com/andcast77/multisystem-shopflow.git" }
$WorkifyRepo = if ($env:WORKIFY_REPO) { $env:WORKIFY_REPO } else { "https://github.com/andcast77/multisystem-workify.git" }

# Función para clonar módulo
function Clone-Module {
    param(
        [string]$Name,
        [string]$RepoUrl
    )
    
    $ModuleDir = Join-Path $ModulesDir $Name
    
    if (Test-Path $ModuleDir) {
        Write-Host "⚠️  $Name ya existe en $ModuleDir" -ForegroundColor Yellow
        $response = Read-Host "   ¿Actualizar? (y/n)"
        if ($response -match "^[yY]") {
            Write-Host "   Actualizando $Name..." -ForegroundColor Cyan
            Push-Location $ModuleDir
            git pull origin main 2>$null
            if ($LASTEXITCODE -ne 0) {
                git pull origin master 2>$null
            }
            Pop-Location
        }
    } else {
        Write-Host "📦 Clonando $Name..." -ForegroundColor Green
        git clone $RepoUrl $ModuleDir
        Write-Host "✅ $Name clonado" -ForegroundColor Green
    }
}

# Clonar módulos
Write-Host "📦 Clonando módulos frontend..." -ForegroundColor Cyan
Clone-Module -Name "shopflow" -RepoUrl $ShopflowRepo
Clone-Module -Name "workify" -RepoUrl $WorkifyRepo

Write-Host ""
Write-Host "✅ Módulos configurados para desarrollo local" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar desarrollo:"
Write-Host "  Hub:        pnpm dev (desde la raíz)"
Write-Host "  ShopFlow:   cd modules/shopflow && pnpm dev"
Write-Host "  Workify:    cd modules/workify && pnpm dev"
Write-Host ""
Write-Host "Nota: Los módulos son repositorios independientes."
Write-Host "      Para desplegar, conecta cada repositorio a Vercel por separado."
