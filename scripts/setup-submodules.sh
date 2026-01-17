#!/bin/bash
# Script para inicializar y actualizar Git Submodules

set -e

echo "🔧 Configurando Git Submodules..."

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f ".gitmodules" ]; then
    echo "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Inicializar submodules si no están inicializados
echo "📦 Inicializando submodules..."
git submodule update --init --recursive

# Verificar estado de submodules
echo ""
echo "📊 Estado de submodules:"
git submodule status

echo ""
echo "✅ Submodules configurados correctamente!"
echo ""
echo "💡 Para actualizar submodules a la última versión, ejecuta:"
echo "   git submodule update --remote"
