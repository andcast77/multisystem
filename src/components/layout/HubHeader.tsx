'use client'

import { ModuleConfig } from '@/lib/modules/registry'

interface HubHeaderProps {
  activeModule?: ModuleConfig
}

export function HubHeader({ activeModule }: HubHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {activeModule ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeModule.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeModule.name}
                </h2>
                {activeModule.description && (
                  <p className="text-sm text-gray-500">
                    {activeModule.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">
              MultiSystem Hub
            </h2>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Aquí irían acciones del usuario, notificaciones, etc. */}
        </div>
      </div>
    </header>
  )
}
