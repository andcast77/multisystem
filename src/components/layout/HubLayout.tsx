'use client'

import { usePathname } from 'next/navigation'
import { getActiveModule, getEnabledModules } from '@/lib/modules/registry'
import { HubSidebar } from './HubSidebar'
import { HubHeader } from './HubHeader'

export function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeModule = getActiveModule(pathname || '')
  const modules = getEnabledModules()

  return (
    <div className="flex h-screen bg-gray-50">
      <HubSidebar 
        modules={modules} 
        activeModule={activeModule}
        currentPath={pathname || ''}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HubHeader activeModule={activeModule} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
