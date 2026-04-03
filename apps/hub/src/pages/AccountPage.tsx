import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { clearTokenCookie } from "@/lib/auth";
import { authApi } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@multisystem/ui";
import { User, Mail, Shield, LogOut } from "lucide-react";

export function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useUser();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // proceed even if the API call fails
    }
    clearTokenCookie();
    await queryClient.clear();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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

  const roleLabel =
    user.membershipRole || user.role || "—";

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mi cuenta</h1>
        <p className="text-slate-600 mt-1">Información de tu perfil y sesión</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Datos de tu cuenta de usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user.name || "—"}</p>
              <Badge variant="outline">{roleLabel}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{user.email}</span>
          </div>

          {user.isSuperuser && (
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-amber-700 font-medium">Superadministrador del sistema</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sesión</CardTitle>
          <CardDescription>Gestiona tu sesión activa</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
