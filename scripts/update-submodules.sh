#!/bin/bash
# Script para actualizar servicios backend (repositorios independientes)
# Nota: services/api y services/database son repositorios Git independientes
#       NO son submodules, se actualizan directamente con git pull

set -e

echo "🔄 Actualizando servicios backend..."

# Actualizar services/api si existe
if [ -d "services/api" ]; then
    echo "📥 Actualizando services/api..."
    cd services/api
    git pull || echo "⚠️  No se pudo actualizar services/api (puede tener cambios locales)"
    cd ../..
else
    echo "⚠️  services/api no existe. Ejecuta ./scripts/setup-submodules.sh primero"
fi

# Actualizar services/database si existe
if [ -d "services/database" ]; then
    echo "📥 Actualizando services/database..."
    cd services/database
    git pull || echo "⚠️  No se pudo actualizar services/database (puede tener cambios locales)"
    cd ../..
else
    echo "⚠️  services/database no existe. Ejecuta ./scripts/setup-submodules.sh primero"
fi

echo ""
echo "✅ Servicios backend actualizados!"
echo ""
echo "💡 Nota: Si hay conflictos, resuélvelos manualmente en cada directorio"
