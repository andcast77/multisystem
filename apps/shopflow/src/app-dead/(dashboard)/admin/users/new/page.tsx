'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useCreateCompanyMember } from '@/hooks/useUsers'
import { UserForm } from '@/components/features/users/UserForm'
import { Button } from '@multisystem/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@multisystem/ui'
import { ArrowLeft, UserPlus } from 'lucide-react'
import type { CreateUserInput, UpdateUserInput } from '@/lib/validations/user'

export default function NewUserPage() {
  const router = useRouter()
  const { data: currentUser, isLoading: isLoadingUser } = useUser()
  const companyId = currentUser?.companyId
  const canCreateCompanyMember =
    currentUser?.membershipRole === 'OWNER' ||
    currentUser?.membershipRole === 'ADMIN' ||
    currentUser?.isSuperuser === true

  const createCompanyMember = useCreateCompanyMember(companyId)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    if (!companyId || !canCreateCompanyMember) return
    try {
      setError(null)
      const createData = data as CreateUserInput
      const parts = (createData.name || '').trim().split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ') ?? ''
      const membershipRole = createData.role === 'ADMIN' ? 'ADMIN' : 'USER'
      await createCompanyMember.mutateAsync({
        email: createData.email,
        password: createData.password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        membershipRole,
        storeIds: membershipRole === 'USER' ? createData.storeIds : undefined,
      })
      router.push('/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario')
    }
  }

  const isPending = createCompanyMember.isPending

  if (isLoadingUser) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
            <p className="text-muted-foreground">Agrega un nuevo usuario a la empresa</p>
          </div>
          <Link href="/admin/users">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <UserPlus className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Selecciona una empresa</h3>
          <p className="mt-2 text-center text-sm text-gray-500">
            Debes tener una empresa seleccionada para poder agregar usuarios.
          </p>
          <Link href="/admin/users" className="mt-4">
            <Button variant="outline">Volver a Usuarios</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!canCreateCompanyMember) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
            <p className="text-muted-foreground">Agrega un nuevo usuario a la empresa</p>
          </div>
          <Link href="/admin/users">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <UserPlus className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Sin permiso</h3>
          <p className="mt-2 text-center text-sm text-gray-500">
            Solo el propietario o un administrador pueden agregar usuarios a la empresa.
          </p>
          <Link href="/admin/users" className="mt-4">
            <Button variant="outline">Volver a Usuarios</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
          <p className="text-muted-foreground">Agrega un nuevo usuario a la empresa</p>
        </div>
        <Link href="/admin/users">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Completa los datos del usuario. Los campos marcados con * son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>}
          <UserForm onSubmit={handleSubmit} isLoading={isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
