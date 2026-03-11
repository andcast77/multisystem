import bcrypt from 'bcryptjs'
import { prisma } from '../db/index.js'
import type { TokenPayload } from '../core/auth.js'
import { canAccessCompany, canManageMembers } from '../core/permissions.js'
import type { CreateMemberBody, UpdateMemberStoresBody } from '../dto/company-members.dto.js'
import { ForbiddenError, NotFoundError, BadRequestError } from '../common/errors/app-error.js'

const roleOrder = { OWNER: 0, ADMIN: 1, USER: 2 } as const

export async function list(companyId: string, caller: TokenPayload) {
  if (!canAccessCompany(caller, companyId)) throw new ForbiddenError('No tienes acceso a esta empresa')
  const members = await prisma.companyMember.findMany({
    where: { companyId },
    include: { user: true },
  })
  const nonSuperuser = members
    .filter((m) => !m.user.isSuperuser)
    .sort((a, b) => {
      const oa = roleOrder[a.membershipRole as keyof typeof roleOrder] ?? 3
      const ob = roleOrder[b.membershipRole as keyof typeof roleOrder] ?? 3
      if (oa !== ob) return oa - ob
      return `${a.user.firstName} ${a.user.lastName}`.trim().localeCompare(`${b.user.firstName} ${b.user.lastName}`.trim())
    })
  const userIdsUser = nonSuperuser.filter((m) => m.membershipRole === 'USER').map((m) => m.userId)
  const userStoresMap = new Map<string, string[]>()
  if (userIdsUser.length > 0) {
    const userStores = await prisma.userStore.findMany({
      where: { userId: { in: userIdsUser }, store: { companyId } },
      select: { userId: true, storeId: true },
    })
    for (const us of userStores) {
      const arr = userStoresMap.get(us.userId) ?? []
      arr.push(us.storeId)
      userStoresMap.set(us.userId, arr)
    }
  }
  return { members: nonSuperuser, userStoresMap }
}

export async function create(companyId: string, caller: TokenPayload, body: CreateMemberBody) {
  if (!canAccessCompany(caller, companyId)) throw new ForbiddenError('No tienes acceso a esta empresa')
  if (!canManageMembers(caller)) throw new ForbiddenError('Solo el owner o un admin pueden crear usuarios')
  const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
  if (existing) throw new BadRequestError('Ya existe un usuario con este email')
  const hashed = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashed,
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      role: 'USER',
      isActive: true,
      isSuperuser: false,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  })
  await prisma.companyMember.create({ data: { userId: user.id, companyId, membershipRole: body.membershipRole } })
  if (body.membershipRole === 'USER') {
    let storeIds: string[] = []
    if (Array.isArray(body.storeIds) && body.storeIds.length > 0) {
      const valid = await prisma.store.findMany({ where: { id: { in: body.storeIds }, companyId }, select: { id: true } })
      storeIds = valid.map((s) => s.id)
    } else {
      const all = await prisma.store.findMany({ where: { companyId, active: true }, select: { id: true } })
      storeIds = all.map((s) => s.id)
    }
    for (const storeId of storeIds) {
      await prisma.userStore.upsert({
        where: { userId_storeId: { userId: user.id, storeId } },
        create: { userId: user.id, storeId },
        update: {},
      })
    }
  }
  return { user, membershipRole: body.membershipRole }
}

export async function updateStores(companyId: string, userId: string, caller: TokenPayload, body: UpdateMemberStoresBody) {
  if (!canAccessCompany(caller, companyId)) throw new ForbiddenError('No tienes acceso a esta empresa')
  if (!canManageMembers(caller)) throw new ForbiddenError('Solo el owner o un admin pueden modificar locales de usuarios')
  const member = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { membershipRole: true },
  })
  if (!member) throw new NotFoundError('Usuario no encontrado en esta empresa')
  if (member.membershipRole !== 'USER') {
    throw new BadRequestError('Solo los usuarios con rol USER tienen locales asignados. Los owners y admins tienen acceso a todos.')
  }
  let idsToAssign: string[] = []
  if (Array.isArray(body.storeIds) && body.storeIds.length > 0) {
    const valid = await prisma.store.findMany({ where: { id: { in: body.storeIds }, companyId }, select: { id: true } })
    idsToAssign = valid.map((s) => s.id)
  }
  const companyStores = await prisma.store.findMany({ where: { companyId }, select: { id: true } })
  const companyStoreIds = companyStores.map((s) => s.id)
  await prisma.userStore.deleteMany({ where: { userId, storeId: { in: companyStoreIds } } })
  for (const storeId of idsToAssign) {
    await prisma.userStore.upsert({
      where: { userId_storeId: { userId, storeId } },
      create: { userId, storeId },
      update: {},
    })
  }
  return { storeIds: idsToAssign }
}
