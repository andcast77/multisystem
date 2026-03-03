'use client'

import { useUser } from '@/hooks/useUser'
import { authApi } from '@/lib/api/client'
import { Button } from '@multisystem/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@multisystem/ui'
import { Badge } from '@multisystem/ui'
import { Mail, Shield, Building2, Calendar, LogOut } from 'lucide-react'

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'default'
    case 'SUPERVISOR':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Administrador'
    case 'SUPERVISOR':
      return 'Supervisor'
    case 'CASHIER':
      return 'Cajero'
    default:
      return role
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AccountPage() {
  const { data: user, isLoading, error } = useUser()

  const handleLogout = async () => {
    try {
      await authApi.post('/logout')
    } catch {
      // ignore
    }
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        Cargando...
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Error</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">
              {error instanceof Error ? error.message : 'No se pudo cargar el usuario'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {user.name || 'Mi cuenta'}
          </h1>
          <p className="text-muted-foreground">
            Información y configuración de tu cuenta
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-medium">Nombre</div>
                <div className="text-gray-500">{user.name || '—'}</div>
              </div>
              <div>
                <div className="font-medium">Email</div>
                <div className="text-gray-500">{user.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Rol y permisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
              {user.membershipRole && (
                <Badge variant="outline">{user.membershipRole}</Badge>
              )}
              {user.isSuperuser && (
                <Badge variant="destructive">Superusuario</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(user.company || user.preferredCompanyId) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {user.company && (
                <div>
                  <div className="font-medium">Empresa actual</div>
                  <div className="text-gray-500">{user.company.name}</div>
                </div>
              )}
              {user.preferredCompanyId && !user.company?.id && (
                <div>
                  <div className="font-medium">Empresa preferida</div>
                  <div className="text-gray-500">{user.preferredCompanyId}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Fechas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <div className="font-medium">Creado</div>
              <div className="text-gray-500">{formatDate(user.createdAt)}</div>
            </div>
            <div>
              <div className="font-medium">Actualizado</div>
              <div className="text-gray-500">{formatDate(user.updatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
