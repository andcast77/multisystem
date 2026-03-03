import { Sidebar } from '@/components/layout/Sidebar'
import { ShopflowModuleGuard } from '@/components/layout/ShopflowModuleGuard'
import { CompanyContextBootstrap } from '@/components/providers/CompanyContextBootstrap'
import { StoreProvider } from '@/components/providers/StoreContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ShopflowModuleGuard>
      <CompanyContextBootstrap>
        <StoreProvider>
          <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_45%)] bg-slate-50 flex overflow-x-hidden">
            <Sidebar />
            <div className="flex-1 min-w-0">
              <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
            </div>
          </div>
        </StoreProvider>
      </CompanyContextBootstrap>
    </ShopflowModuleGuard>
  )
}
