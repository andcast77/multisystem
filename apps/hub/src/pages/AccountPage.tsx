import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { clearTokenCookie } from "@/lib/auth";
import { authApi, shopflowNotificationsApi } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Switch,
  Label,
} from "@multisystem/ui";
import { User, Mail, Shield, LogOut, Bell } from "lucide-react";

const NOTIFICATION_TYPE_ROWS = [
  { key: "LOW_STOCK", label: "Stock bajo (PLAN-20)" },
  { key: "IMPORTANT_SALE", label: "Ventas importantes (PLAN-20)" },
  { key: "PENDING_TASK", label: "Tareas pendientes (PLAN-20)" },
  { key: "SYSTEM", label: "Sistema / reportes (PLAN-20)" },
  { key: "COLLAB", label: "Colaboración (PLAN-17)" },
  { key: "SECURITY", label: "Seguridad / MFA (PLAN-24)" },
] as const;

function channelValueForType(
  prefs: {
    inAppEnabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    preferences?: Record<string, { inApp?: boolean; push?: boolean; email?: boolean }> | null;
  },
  typeKey: string,
  channel: "inApp" | "push" | "email"
): boolean {
  const row = prefs.preferences?.[typeKey];
  const globals = {
    inApp: prefs.inAppEnabled,
    push: prefs.pushEnabled,
    email: prefs.emailEnabled,
  };
  if (row && row[channel] !== undefined) return !!row[channel];
  return globals[channel];
}

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

  const shopflowEnabled = user.company?.modules?.shopflow === true;

  const prefsQuery = useQuery({
    queryKey: ["hubNotificationPrefs", user.id],
    queryFn: async () => {
      const res = await shopflowNotificationsApi.getPreferences(user.id);
      if (!res.success || !res.data) throw new Error(res.error || "prefs");
      return res.data;
    },
    enabled: shopflowEnabled,
  });

  const updatePrefs = useMutation({
    mutationFn: async (patch: {
      inAppEnabled?: boolean;
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      preferences?: Record<string, { inApp?: boolean; push?: boolean; email?: boolean }>;
    }) => {
      const res = await shopflowNotificationsApi.updatePreferences(user.id, patch);
      if (!res.success || !res.data) throw new Error(res.error || "update");
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hubNotificationPrefs", user.id] });
    },
  });

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

      {shopflowEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              Canales de notificación
            </CardTitle>
            <CardDescription>
              Controla cómo recibes alertas del módulo Shopflow (stock, reportes, etc.). Requiere Shopflow
              activo para tu empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Cargando preferencias…</p>
            ) : prefsQuery.isError ? (
              <p className="text-sm text-red-600">No se pudieron cargar las preferencias.</p>
            ) : prefsQuery.data ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="in-app-notif">En la aplicación</Label>
                    <p className="text-xs text-slate-500">Campana y lista en Hub / Shopflow</p>
                  </div>
                  <Switch
                    id="in-app-notif"
                    checked={prefsQuery.data.inAppEnabled}
                    disabled={updatePrefs.isPending}
                    onCheckedChange={(v: boolean) => updatePrefs.mutate({ inAppEnabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="push-notif">Push en el navegador</Label>
                    <p className="text-xs text-slate-500">Notificaciones del sistema (si están habilitadas)</p>
                  </div>
                  <Switch
                    id="push-notif"
                    checked={prefsQuery.data.pushEnabled}
                    disabled={updatePrefs.isPending}
                    onCheckedChange={(v: boolean) => updatePrefs.mutate({ pushEnabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="email-notif">Correo electrónico</Label>
                    <p className="text-xs text-slate-500">Resúmenes y alertas por email</p>
                  </div>
                  <Switch
                    id="email-notif"
                    checked={prefsQuery.data.emailEnabled}
                    disabled={updatePrefs.isPending}
                    onCheckedChange={(v: boolean) => updatePrefs.mutate({ emailEnabled: v })}
                  />
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-900">Preferencias por tipo</p>
                  <p className="text-xs text-slate-500">
                    Ajusta canales por categoría (PLAN-20 jobs, PLAN-17 colaboración, PLAN-24 MFA). Si no
                    fijas un canal para un tipo, se aplican los interruptores globales de arriba.
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                          <th className="py-2 px-3 font-medium">Tipo</th>
                          <th className="py-2 px-2 font-medium text-center">En app</th>
                          <th className="py-2 px-2 font-medium text-center">Push</th>
                          <th className="py-2 px-2 font-medium text-center">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {NOTIFICATION_TYPE_ROWS.map((row) => (
                          <tr key={row.key} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-3 text-slate-800">{row.label}</td>
                            <td className="py-2 px-2 text-center">
                              <Switch
                                checked={channelValueForType(prefsQuery.data, row.key, "inApp")}
                                disabled={updatePrefs.isPending}
                                onCheckedChange={(v: boolean) =>
                                  updatePrefs.mutate({ preferences: { [row.key]: { inApp: v } } })
                                }
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Switch
                                checked={channelValueForType(prefsQuery.data, row.key, "push")}
                                disabled={updatePrefs.isPending}
                                onCheckedChange={(v: boolean) =>
                                  updatePrefs.mutate({ preferences: { [row.key]: { push: v } } })
                                }
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Switch
                                checked={channelValueForType(prefsQuery.data, row.key, "email")}
                                disabled={updatePrefs.isPending}
                                onCheckedChange={(v: boolean) =>
                                  updatePrefs.mutate({ preferences: { [row.key]: { email: v } } })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
