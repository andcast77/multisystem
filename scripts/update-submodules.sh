#!/bin/bash
# Script para actualizar Git Submodules a la última versión

set -e

echo "🔄 Actualizando Git Submodules..."

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f ".gitmodules" ]; then
    echo "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Actualizar todos los submodules a la última versión de sus ramas remotas
echo "📥 Actualizando submodules desde remotos..."
git submodule update --remote

# Mostrar estado actualizado
echo ""
echo "📊 Estado actualizado de submodules:"
git submodule status

echo ""
echo "✅ Submodules actualizados correctamente!"
echo ""
echo "⚠️  Nota: Los cambios en submodules deben ser commiteados en el repositorio principal:"
echo "   git add modules/"
echo "   git commit -m 'chore: actualizar submodules'"
