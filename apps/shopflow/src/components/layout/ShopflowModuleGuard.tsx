'use client'

import { useUser } from '@/hooks/useUser'

export function ShopflowModuleGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser()

  if (isLoading || !user) return <>{children}</>
  if (user.isSuperuser) return <>{children}</>
  if (!user.companyId) return <>{children}</>
  if (user.company?.shopflowEnabled !== false) return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-amber-900 mb-2">Módulo no activo</h1>
        <p className="text-amber-800">
          El módulo Shopflow no está activado para esta empresa. Contacta al administrador para activarlo.
        </p>
      </div>
    </div>
  )
}
