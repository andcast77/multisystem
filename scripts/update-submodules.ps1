# Script para actualizar servicios backend (repositorios independientes)
# Nota: services/api y services/database son repositorios Git independientes
#       NO son submodules, se actualizan directamente con git pull

Write-Host "🔄 Actualizando servicios backend..." -ForegroundColor Cyan

# Actualizar services/api si existe
if (Test-Path "services/api") {
    Write-Host "📥 Actualizando services/api..." -ForegroundColor Yellow
    Push-Location services/api
    try {
        git pull
    } catch {
        Write-Host "⚠️  No se pudo actualizar services/api (puede tener cambios locales)" -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "⚠️  services/api no existe. Ejecuta .\scripts\setup-submodules.ps1 primero" -ForegroundColor Yellow
}

# Actualizar services/database si existe
if (Test-Path "services/database") {
    Write-Host "📥 Actualizando services/database..." -ForegroundColor Yellow
    Push-Location services/database
    try {
        git pull
    } catch {
        Write-Host "⚠️  No se pudo actualizar services/database (puede tener cambios locales)" -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "⚠️  services/database no existe. Ejecuta .\scripts\setup-submodules.ps1 primero" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Servicios backend actualizados!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Nota: Si hay conflictos, resuélvelos manualmente en cada directorio" -ForegroundColor Yellow
