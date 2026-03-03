import bcrypt from 'bcryptjs'
import { prisma } from '../db/index.js'
import type { CreateUserBody, UpdateUserBody } from '../dto/users.dto.js'
import type { TokenPayload } from '../core/auth.js'

export async function listUsers(caller: TokenPayload) {
  if (caller.role !== 'ADMIN' && caller.role !== 'SUPERADMIN') {
    return null
  }
  return prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function create(body: CreateUserBody) {
  const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
  if (existing) return { error: 'Ya existe un usuario con este email', code: 400 as const }

  const hashedPassword = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      role: (body.role as 'USER' | 'ADMIN' | 'SUPERADMIN') ?? 'USER',
      isActive: body.isActive ?? true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return user
}

export async function update(
  id: string,
  body: UpdateUserBody
): Promise<
  | Awaited<ReturnType<typeof prisma.user.update>>
  | { error: string; code: 400 | 404 }
> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  })
  if (!existing) return { error: 'Usuario no encontrado', code: 404 }

  if (body.email && body.email !== existing.email) {
    const emailCheck = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
    if (emailCheck) return { error: 'Ya existe un usuario con este email', code: 400 }
  }

  const updateData: Record<string, unknown> = {}
  if (body.email !== undefined) updateData.email = body.email
  if (body.password !== undefined) updateData.password = await bcrypt.hash(body.password, 10)
  if (body.firstName !== undefined) updateData.firstName = body.firstName
  if (body.lastName !== undefined) updateData.lastName = body.lastName
  if (body.role !== undefined) updateData.role = body.role
  if (body.isActive !== undefined) updateData.isActive = body.isActive

  if (Object.keys(updateData).length === 0) {
    return { error: 'No hay campos para actualizar', code: 400 }
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function remove(id: string): Promise<{ success: true } | { error: string; code: 400 | 404 }> {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { error: 'Usuario no encontrado', code: 404 }

  const salesCount = await prisma.sale.count({ where: { userId: id } })
  if (salesCount > 0) {
    return {
      error: 'No se puede eliminar un usuario que tiene ventas. Desactive el usuario en su lugar.',
      code: 400,
    }
  }

  await prisma.user.delete({ where: { id } })
  return { success: true }
}
