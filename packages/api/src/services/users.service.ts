import bcrypt from 'bcryptjs'
import { prisma } from '../db/index.js'
import type { CreateUserBody, UpdateUserBody } from '../dto/users.dto.js'
import type { TokenPayload } from '../core/auth.js'
import { ForbiddenError, NotFoundError, BadRequestError } from '../common/errors/app-error.js'

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function listUsers(caller: TokenPayload) {
  if (caller.role !== 'ADMIN' && caller.role !== 'SUPERADMIN') {
    throw new ForbiddenError('Solo administradores pueden listar usuarios')
  }
  return prisma.user.findMany({
    where: { isActive: true },
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT })
  if (!user) throw new NotFoundError('Usuario no encontrado')
  return user
}

export async function create(body: CreateUserBody) {
  const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
  if (existing) throw new BadRequestError('Ya existe un usuario con este email')

  const hashedPassword = await bcrypt.hash(body.password, 10)
  return prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      role: (body.role as 'USER' | 'ADMIN' | 'SUPERADMIN') ?? 'USER',
      isActive: body.isActive ?? true,
    },
    select: USER_SELECT,
  })
}

export async function update(id: string, body: UpdateUserBody) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } })
  if (!existing) throw new NotFoundError('Usuario no encontrado')

  if (body.email && body.email !== existing.email) {
    const emailCheck = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
    if (emailCheck) throw new BadRequestError('Ya existe un usuario con este email')
  }

  const updateData: Record<string, unknown> = {}
  if (body.email !== undefined) updateData.email = body.email
  if (body.password !== undefined) updateData.password = await bcrypt.hash(body.password, 10)
  if (body.firstName !== undefined) updateData.firstName = body.firstName
  if (body.lastName !== undefined) updateData.lastName = body.lastName
  if (body.role !== undefined) updateData.role = body.role
  if (body.isActive !== undefined) updateData.isActive = body.isActive

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('No hay campos para actualizar')
  }

  return prisma.user.update({ where: { id }, data: updateData, select: USER_SELECT })
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw new NotFoundError('Usuario no encontrado')

  const salesCount = await prisma.sale.count({ where: { userId: id } })
  if (salesCount > 0) {
    throw new BadRequestError('No se puede eliminar un usuario que tiene ventas. Desactive el usuario en su lugar.')
  }

  await prisma.user.delete({ where: { id } })
}
