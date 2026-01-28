#!/bin/bash
# Script para inicializar el entorno de desarrollo completo

set -e

echo "🚀 Inicializando entorno de desarrollo de Multisystem..."
echo ""

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Paso 1: Clonar servicios backend (repositorios independientes)
echo "📦 Paso 1/3: Clonando servicios backend..."
./scripts/setup-submodules.sh

# Paso 2: Verificar estructura
echo ""
echo "🔍 Paso 2/3: Verificando estructura..."
if [ ! -d "services/api" ] || [ ! -d "services/database" ]; then
    echo "⚠️  Advertencia: Algunos servicios no están presentes."
    echo "   Ejecuta: ./scripts/setup-submodules.sh"
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
echo "   1. Clona los módulos frontend: ./scripts/setup-modules-dev.sh"
echo "   2. Instala las dependencias de cada servicio/módulo"
echo "   3. Configura las variables de entorno (.env)"
echo "   4. Inicia los servicios con: docker-compose up"
