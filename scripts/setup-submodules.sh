#!/bin/bash
# Script para clonar servicios backend (repositorios independientes)
# Nota: services/api y services/database son repositorios Git independientes
#       NO son submodules, se clonan directamente para desarrollo local
#       Los módulos frontend se clonan con scripts/setup-modules-dev.sh

set -e

echo "🔧 Clonando servicios backend (repositorios independientes)..."

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Crear directorio services si no existe
mkdir -p services

# Clonar services/api si no existe
if [ ! -d "services/api" ]; then
    echo "📦 Clonando services/api..."
    git clone https://github.com/andcast77/multisystem-api.git services/api
else
    echo "✅ services/api ya existe (omitiendo)"
fi

# Clonar services/database si no existe
if [ ! -d "services/database" ]; then
    echo "📦 Clonando services/database..."
    git clone https://github.com/andcast77/multisystem-database.git services/database
else
    echo "✅ services/database ya existe (omitiendo)"
fi

echo ""
echo "✅ Servicios backend clonados correctamente!"
echo ""
echo "💡 Para actualizar los servicios, ve a cada directorio y ejecuta:"
echo "   cd services/api && git pull"
echo "   cd services/database && git pull"
echo ""
echo "📝 Nota: Los módulos frontend (ShopFlow, Workify) son repositorios independientes."
echo "   Para clonarlos localmente, usa: ./scripts/setup-modules-dev.sh"
