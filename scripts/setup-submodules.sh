#!/bin/bash
# Script para inicializar y actualizar Git Submodules (solo servicios backend)
# Nota: Los módulos frontend (ShopFlow, Workify) son repositorios independientes
#       y se clonan con scripts/setup-modules-dev.sh

set -e

echo "🔧 Configurando Git Submodules (solo servicios backend)..."

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f ".gitmodules" ]; then
    echo "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Inicializar submodules si no están inicializados
echo "📦 Inicializando submodules de servicios backend..."
echo "   (services/api y services/database)"
git submodule update --init --recursive

# Verificar estado de submodules
echo ""
echo "📊 Estado de submodules:"
git submodule status

echo ""
echo "✅ Submodules de servicios backend configurados correctamente!"
echo ""
echo "💡 Para actualizar submodules a la última versión, ejecuta:"
echo "   git submodule update --remote"
echo ""
echo "📝 Nota: Los módulos frontend (ShopFlow, Workify) son repositorios independientes."
echo "   Para clonarlos localmente, usa: ./scripts/setup-modules-dev.sh"
