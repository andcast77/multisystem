'use client'

import Link from 'next/link'
import { ModuleConfig } from '@/lib/modules/registry'

interface HubSidebarProps {
  modules: ModuleConfig[]
  activeModule?: ModuleConfig
  currentPath: string
}

export function HubSidebar({ modules, activeModule, currentPath }: HubSidebarProps) {
  const isActive = (module: ModuleConfig) => {
    return activeModule?.id === module.id
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">MultiSystem</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {/* Link al hub principal */}
        <Link
          href="/"
          className={`block px-4 py-2 rounded-lg transition-colors ${
            !activeModule
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🏠</span>
            <span>Inicio</span>
          </span>
        </Link>

        {/* Módulos */}
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.route}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              isActive(module)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{module.icon || '📦'}</span>
              <span>{module.name}</span>
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
        <p>v1.0.0</p>
      </div>
    </aside>
  )
}
