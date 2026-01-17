'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { 
  getActiveModule, 
  getModuleRelativePath,
  isModuleRoute,
  type ModuleConfig 
} from '@/lib/modules/registry'

export function useActiveModule() {
  const pathname = usePathname()
  
  const activeModule = useMemo(() => {
    return getActiveModule(pathname || '')
  }, [pathname])

  const relativePath = useMemo(() => {
    if (!activeModule) return pathname || ''
    return getModuleRelativePath(pathname || '', activeModule.id)
  }, [pathname, activeModule])

  const isModule = useMemo(() => {
    if (!pathname || !activeModule) return false
    return isModuleRoute(pathname, activeModule.id)
  }, [pathname, activeModule])

  return {
    activeModule,
    relativePath,
    isModule,
    pathname: pathname || '',
  }
}
