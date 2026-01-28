#!/bin/bash

# Script para clonar módulos independientes para desarrollo local
# Los módulos son repositorios independientes, no submodules

set -e

echo "🔧 Configurando módulos para desarrollo local..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODULES_DIR="$BASE_DIR/modules"

# Crear directorio modules si no existe
mkdir -p "$MODULES_DIR"

# URLs de repositorios (actualiza con tus URLs reales)
SHOPFLOW_REPO="${SHOPFLOW_REPO:-https://github.com/andcast77/multisystem-shopflow.git}"
WORKIFY_REPO="${WORKIFY_REPO:-https://github.com/andcast77/multisystem-workify.git}"

# Función para clonar módulo
clone_module() {
    local name=$1
    local repo_url=$2
    local module_dir="$MODULES_DIR/$name"
    
    if [ -d "$module_dir" ]; then
        echo -e "${YELLOW}⚠️  $name ya existe en $module_dir${NC}"
        echo "   ¿Actualizar? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "   Actualizando $name..."
            cd "$module_dir"
            git pull origin main || git pull origin master
            cd "$BASE_DIR"
        fi
    else
        echo -e "${GREEN}📦 Clonando $name...${NC}"
        git clone "$repo_url" "$module_dir"
        echo -e "${GREEN}✅ $name clonado${NC}"
    fi
}

# Clonar módulos
echo "📦 Clonando módulos frontend..."
clone_module "shopflow" "$SHOPFLOW_REPO"
clone_module "workify" "$WORKIFY_REPO"

echo ""
echo -e "${GREEN}✅ Módulos configurados para desarrollo local${NC}"
echo ""
echo "Para iniciar desarrollo:"
echo "  Hub:        pnpm dev (desde la raíz)"
echo "  ShopFlow:   cd modules/shopflow && pnpm dev"
echo "  Workify:    cd modules/workify && pnpm dev"
echo ""
echo "Nota: Los módulos son repositorios independientes."
echo "      Para desplegar, conecta cada repositorio a Vercel por separado."
