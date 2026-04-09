"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardSessionGate } from "@/components/auth/DashboardSessionGate";
import { ShopflowModuleGuard } from "@/components/layout/ShopflowModuleGuard";
import { CompanyContextBootstrap } from "@/components/providers/CompanyContextBootstrap";
import { StoreProvider } from "@/components/providers/StoreContext";

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardSessionGate>
        <ShopflowModuleGuard>
          <CompanyContextBootstrap>
            <StoreProvider>
              <div className="flex min-h-screen flex-col lg:flex-row">
                <Sidebar />
                <div className="min-h-0 min-w-0 flex-1">{children}</div>
              </div>
            </StoreProvider>
          </CompanyContextBootstrap>
        </ShopflowModuleGuard>
      </DashboardSessionGate>
    </ProtectedRoute>
  );
}
