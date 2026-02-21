import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar as SidebarComponent, type NavGroup, type SidebarUser } from "@multisystem/ui";
import {
  LayoutDashboard,
  Settings,
  Users,
  Building2,
  LogOut,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { CompanySelector } from "@/components/features/CompanySelector";
import { clearTokenCookie } from "@/lib/auth";

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Gestión",
    items: [
      { title: "Miembros", href: "/dashboard/members", icon: Users },
      { title: "Configuración", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useUser();

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, error, navigate]);

  const handleLogout = async () => {
    clearTokenCookie();
    await queryClient.clear();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarUser: SidebarUser = {
    name: user.name || user.email,
    email: user.email,
    role: user.membershipRole || user.role,
  };

  // Only show company selector for superusers or users with multiple companies
  const showCompanySelector = user.isSuperuser || false; // Will be enhanced with multi-company check

  return (
    <div className="flex h-screen">
      <SidebarComponent
        navGroups={navGroups}
        user={sidebarUser}
        branding={{
          name: "Multisystem Hub",
          shortName: "HUB",
          logo: <Building2 className="h-6 w-6" />,
        }}
        companySelector={
          showCompanySelector ? (
            <CompanySelector
              currentCompanyId={user.companyId}
              isSuperuser={user.isSuperuser}
            />
          ) : undefined
        }
        navigation={{
          Link,
          usePathname: () => location.pathname,
        }}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
