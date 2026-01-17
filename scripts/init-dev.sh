#!/bin/bash
# Script para inicializar el entorno de desarrollo completo

set -e

echo "🚀 Inicializando entorno de desarrollo de Multisystem..."
echo ""

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f ".gitmodules" ]; then
    echo "❌ Error: No se encontró .gitmodules. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Paso 1: Configurar submodules
echo "📦 Paso 1/3: Configurando Git Submodules..."
./scripts/setup-submodules.sh

# Paso 2: Verificar que los submodules existen
echo ""
echo "🔍 Paso 2/3: Verificando estructura de módulos..."
if [ ! -d "modules/hub" ] || [ ! -d "modules/shopflow" ] || [ ! -d "modules/workify" ]; then
    echo "⚠️  Advertencia: Algunos módulos no están presentes."
    echo "   Asegúrate de que las URLs en .gitmodules sean correctas."
fi

# Paso 3: Instalar dependencias (si es necesario)
echo ""
echo "📚 Paso 3/3: Verificando dependencias..."
echo "   Para instalar dependencias de la API:"
echo "   cd api && pnpm install"
echo ""
echo "   Para instalar dependencias de cada módulo:"
echo "   cd modules/hub && pnpm install"
echo "   cd modules/shopflow && pnpm install"
echo "   cd modules/workify && pnpm install"
echo ""

echo "✅ Entorno de desarrollo inicializado!"
echo ""
echo "📖 Próximos pasos:"
echo "   1. Configura las URLs de los repositorios en .gitmodules"
echo "   2. Ejecuta: ./scripts/setup-submodules.sh"
echo "   3. Instala las dependencias de cada módulo"
echo "   4. Configura las variables de entorno (.env)"
echo "   5. Inicia los servicios con: docker-compose up"
