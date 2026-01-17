export interface ModuleConfig {
  id: string
  name: string
  route: string
  url: string
  enabled: boolean
  icon?: string
  color?: string
  description?: string
}

const MODULES: ModuleConfig[] = [
  {
    id: 'shopflow',
    name: 'ShopFlow',
    route: '/shopflow',
    url: process.env.NEXT_PUBLIC_SHOPFLOW_URL || 'http://localhost:3003',
    enabled: process.env.NEXT_PUBLIC_SHOPFLOW_ENABLED !== 'false',
    icon: '🛒',
    color: '#3B82F6',
    description: 'Punto de Venta y Gestión de Inventario',
  },
  {
    id: 'workify',
    name: 'Workify',
    route: '/workify',
    url: process.env.NEXT_PUBLIC_WORKIFY_URL || 'http://localhost:3004',
    enabled: process.env.NEXT_PUBLIC_WORKIFY_ENABLED !== 'false',
    icon: '👥',
    color: '#10B981',
    description: 'Recursos Humanos y Gestión de Empleados',
  },
]

export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return MODULES.find(m => m.id === moduleId && m.enabled)
}

export function getModuleByRoute(route: string): ModuleConfig | undefined {
  return MODULES.find(m => m.enabled && route.startsWith(m.route))
}

export function getAllModules(): ModuleConfig[] {
  return MODULES.filter(m => m.enabled)
}

export function getModuleUrl(moduleId: string): string | undefined {
  return getModuleConfig(moduleId)?.url
}

export { MODULES as MODULES_CONFIG }
