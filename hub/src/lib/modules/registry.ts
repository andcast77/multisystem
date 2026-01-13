import { ModuleConfig, getAllModules, getModuleByRoute, getModuleConfig } from './config'

export type { ModuleConfig }

export interface ModuleRoute {
  path: string
  label: string
  icon?: string
  permissions?: string[]
}

export interface ModuleMetadata extends ModuleConfig {
  routes?: ModuleRoute[]
  version?: string
}

/**
 * Obtiene todos los módulos habilitados
 */
export function getEnabledModules(): ModuleConfig[] {
  return getAllModules()
}

/**
 * Obtiene configuración de módulo por ID
 */
export function getModule(moduleId: string): ModuleConfig | undefined {
  return getModuleConfig(moduleId)
}

/**
 * Detecta el módulo activo desde una ruta
 */
export function getActiveModule(pathname: string): ModuleConfig | undefined {
  return getModuleByRoute(pathname)
}

/**
 * Verifica si una ruta pertenece a un módulo
 */
export function isModuleRoute(pathname: string, moduleId: string): boolean {
  const module = getModule(moduleId)
  if (!module) return false
  return pathname.startsWith(module.route)
}

/**
 * Obtiene la ruta relativa del módulo (sin el prefijo)
 */
export function getModuleRelativePath(pathname: string, moduleId: string): string {
  const module = getModule(moduleId)
  if (!module) return pathname
  return pathname.replace(module.route, '') || '/'
}
