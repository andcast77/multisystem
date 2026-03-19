import bcrypt from 'bcryptjs'
import { prisma } from '../db/index.js'
import { generateToken, verifyToken, type TokenPayload } from '../core/auth.js'
import { getUserCompanies, selectCompanyForUser } from '../core/auth-context.js'
import { findModulesByKeys, getCompanyModules } from '../core/modules.js'
import type { LoginBody, RegisterBody } from '../dto/auth.dto.js'
import type { CompanyRow } from '../core/auth-context.js'
import { UnauthorizedError, BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../common/errors/app-error.js'
import { assertSelfOrSuperuser, resolveCompanyAccess } from '../policies/company-authorization.policy.js'

export type LoginResult = {
  user: { id: string; email: string; name: string; role: string; isSuperuser: boolean }
  token: string
  companyId?: string
  company?: CompanyRow
  companies?: CompanyRow[]
}

export type RegisterResult = {
  user: { id: string; email: string; name: string; role: string; companyId?: string }
  token: string
  company?: { id: string; name: string; modules: { workify: boolean; shopflow: boolean; techservices: boolean } }
}

export type MeResult = {
  id: string
  email: string
  role: string
  isActive: boolean
  name: string
  companyId?: string
  preferredCompanyId?: string
  membershipRole?: string
  isSuperuser?: boolean
  company?: { id: string; name: string; modules: { workify: boolean; shopflow: boolean; techservices: boolean } }
}

export async function login(body: LoginBody): Promise<LoginResult> {
  const { email, password, companyId: bodyCompanyId } = body

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
      isSuperuser: true,
      firstName: true,
      lastName: true,
      shopflowPreferredCompanyId: true,
    },
  })

  if (!user) throw new UnauthorizedError('Credenciales inválidas')
  if (!user.isActive) throw new UnauthorizedError('Usuario inactivo')

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) throw new UnauthorizedError('Credenciales inválidas')

  const companies = await getUserCompanies(user.id, user.isSuperuser ?? false)
  const preferredCompanyId = bodyCompanyId ?? user.shopflowPreferredCompanyId ?? undefined
  const selected = selectCompanyForUser(companies, preferredCompanyId)
  const selectedCompany = selected?.selectedCompany ?? null
  const selectedMembershipRole = selected?.selectedMembershipRole ?? null

  const tokenPayload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    isSuperuser: user.isSuperuser ?? false,
  }
  if (selectedCompany) {
    tokenPayload.companyId = selectedCompany.id
    if (selectedMembershipRole) tokenPayload.membershipRole = selectedMembershipRole
  }
  const token = generateToken(tokenPayload)

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email

  const result: LoginResult = {
    user: {
      id: user.id,
      email: user.email,
      name,
      role: user.role,
      isSuperuser: user.isSuperuser ?? false,
    },
    token,
  }
  if (selectedCompany) {
    result.companyId = selectedCompany.id
    result.company = selectedCompany
  }
  if (companies.length > 1 || user.isSuperuser) {
    result.companies = companies
  }

  return result
}

export async function register(body: RegisterBody): Promise<RegisterResult> {
  const {
    email,
    password,
    firstName = '',
    lastName = '',
    companyName,
    workifyEnabled = true,
    shopflowEnabled = false,
    technicalServicesEnabled = false,
  } = body

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) throw new BadRequestError('Ya existe un usuario con este email')

  const hashedPassword = await bcrypt.hash(password, 10)

  if (companyName && companyName.trim()) {
    const modulesMap = await findModulesByKeys(['workify', 'shopflow', 'techservices'])
    const workifyMod = modulesMap.get('workify')
    const shopflowMod = modulesMap.get('shopflow')
    const techservicesMod = modulesMap.get('techservices')

    const { user, company } = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'USER',
          isActive: true,
          isSuperuser: false,
        },
      })

      const c = await tx.company.create({
        data: {
          name: companyName.trim(),
          ownerUserId: u.id,
          isActive: true,
        },
      })

      await tx.companyMember.create({
        data: { userId: u.id, companyId: c.id, membershipRole: 'OWNER' },
      })

      const moduleIds: string[] = []
      if (workifyEnabled && workifyMod) moduleIds.push(workifyMod.id)
      if (shopflowEnabled && shopflowMod) moduleIds.push(shopflowMod.id)
      if (technicalServicesEnabled && techservicesMod) moduleIds.push(techservicesMod.id)
      for (const modId of moduleIds) {
        await tx.companyModule.create({
          data: { companyId: c.id, moduleId: modId, enabled: true },
        })
      }

      const role =
        (await tx.role.findFirst({ where: { name: 'admin', companyId: c.id } })) ??
        (await tx.role.create({ data: { name: 'admin', companyId: c.id } }))

      await tx.userRoleAssignment.create({
        data: { userId: u.id, roleId: role.id, companyId: c.id },
      })

      return { user: u, company: c }
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
      isSuperuser: false,
      membershipRole: 'OWNER',
    })

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email

    return {
      user: {
        id: user.id,
        email: user.email,
        name,
        role: user.role,
        companyId: company.id,
      },
      token,
      company: {
        id: company.id,
        name: company.name,
        modules: { workify: workifyEnabled, shopflow: shopflowEnabled, techservices: technicalServicesEnabled },
      },
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'USER',
      isActive: true,
      isSuperuser: false,
    },
  })

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email

  return {
    user: { id: user.id, email: user.email, name, role: user.role },
    token,
  }
}

export async function me(decoded: TokenPayload): Promise<MeResult> {
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      firstName: true,
      lastName: true,
      shopflowPreferredCompanyId: true,
    },
  })

  if (!user) throw new NotFoundError('Usuario no encontrado')
  if (!user.isActive) throw new UnauthorizedError('Usuario inactivo')

  let preferredCompanyId: string | null = user.shopflowPreferredCompanyId

  if (!preferredCompanyId) {
    const companies = await getUserCompanies(decoded.id, decoded.isSuperuser ?? false)
    const defaultCompanyId = companies[0]?.id ?? null
    if (defaultCompanyId) {
      await prisma.user.update({
        where: { id: decoded.id },
        data: { shopflowPreferredCompanyId: defaultCompanyId },
      })
      preferredCompanyId = defaultCompanyId
    }
  }

  let company: { id: string; name: string; modules: { workify: boolean; shopflow: boolean; techservices: boolean } } | null = null
  let responseCompanyId: string | undefined = decoded.companyId

  if (decoded.companyId) {
    const c = await prisma.company.findFirst({
      where: { id: decoded.companyId, isActive: true },
    })
    if (c) {
      const modules = await getCompanyModules(c.id)
      company = { id: c.id, name: c.name, modules }
    }
  }

  if (!responseCompanyId || !company) {
    const effectiveId = preferredCompanyId ?? undefined
    if (effectiveId) {
      responseCompanyId = effectiveId
      const c = await prisma.company.findFirst({
        where: { id: effectiveId, isActive: true },
      })
      if (c) {
        const modules = await getCompanyModules(c.id)
        company = { id: c.id, name: c.name, modules }
      }
    }
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email

  return {
    ...user,
    name,
    companyId: responseCompanyId,
    preferredCompanyId: preferredCompanyId ?? undefined,
    membershipRole: decoded.membershipRole,
    isSuperuser: decoded.isSuperuser,
    company: company ?? undefined,
  }
}

export async function verify(token: string): Promise<{ valid: true; user: TokenPayload }> {
  if (!token) throw new BadRequestError('Token es requerido')
  const decoded = verifyToken(token)
  if (!decoded) throw new UnauthorizedError('Token inválido o expirado')
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, isActive: true },
  })
  if (!user || !user.isActive) throw new UnauthorizedError('Usuario no encontrado o inactivo')
  return { valid: true, user: decoded }
}

export async function getCompanies(userId: string, isSuperuser: boolean) {
  return getUserCompanies(userId, isSuperuser)
}

export type SetContextResult = {
  token: string
  companyId: string
  company: { id: string; name: string; modules: { workify: boolean; shopflow: boolean; techservices: boolean } } | null
}

export async function setContext(
  decoded: TokenPayload,
  companyId: string
): Promise<SetContextResult> {
  const { allowed, membershipRole } = await resolveCompanyAccess(decoded.id, companyId, decoded.isSuperuser)
  if (!allowed) throw new ForbiddenError('No tienes acceso a esta empresa')
  const token = generateToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    companyId,
    isSuperuser: decoded.isSuperuser,
    membershipRole: membershipRole ?? undefined,
  })
  await prisma.user.update({
    where: { id: decoded.id },
    data: { shopflowPreferredCompanyId: companyId },
  })
  const company = await prisma.company.findFirst({
    where: { id: companyId, isActive: true },
  })
  const companyWithModules = company
    ? { id: company.id, name: company.name, modules: await getCompanyModules(company.id) }
    : null
  return { token, companyId, company: companyWithModules }
}

export async function createSession(body: {
  userId: string
  sessionToken: string
  ipAddress?: string
  userAgent?: string
  expiresAt?: string
}): Promise<void> {
  const { userId, sessionToken, ipAddress, userAgent, expiresAt } = body
  if (!userId || !sessionToken) throw new BadRequestError('userId y sessionToken son requeridos')
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: { id: true, role: true },
  })
  if (!user) throw new NotFoundError('Usuario no encontrado')
  const existingSessions = await prisma.session.findMany({
    where: { userId },
    take: 1,
    select: { id: true },
  })
  if (existingSessions.length > 0 && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    throw new ConflictError('Concurrent sessions not allowed for this role')
  }
  const expiresAtVal = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt: expiresAtVal,
    },
  })
}

export async function validateSession(token: string): Promise<{ valid: boolean }> {
  if (!token) return { valid: false }
  const rows = await prisma.session.findMany({
    where: { sessionToken: token, expiresAt: { gt: new Date() } },
    take: 1,
    select: { id: true },
  })
  return { valid: rows.length > 0 }
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      sessionToken: true,
      ipAddress: true,
      userAgent: true,
      expiresAt: true,
      createdAt: true,
    },
  })
}

export async function deleteSession(
  token: string,
  callerId: string,
  isSuperuser: boolean
): Promise<void> {
  const decodedToken = decodeURIComponent(token)
  const existing = await prisma.session.findMany({
    where: { sessionToken: decodedToken },
    take: 1,
    select: { id: true, userId: true },
  })
  if (existing.length === 0) throw new NotFoundError('Session not found')
  const sessionUserId = existing[0].userId
  assertSelfOrSuperuser(callerId, sessionUserId, isSuperuser, 'No puedes eliminar sesiones de otro usuario')
  await prisma.session.deleteMany({ where: { sessionToken: decodedToken } })
}

export async function terminateOthersSessions(
  userId: string,
  currentSessionToken: string,
  callerId: string,
  isSuperuser: boolean
): Promise<void> {
  if (!userId || !currentSessionToken) throw new BadRequestError('userId y currentSessionToken son requeridos')
  assertSelfOrSuperuser(callerId, userId, isSuperuser, 'Solo puedes terminar tus propias sesiones')
  await prisma.session.deleteMany({
    where: { userId, sessionToken: { not: currentSessionToken } },
  })
}

export async function cleanupExpiredSessions(isSuperuser: boolean): Promise<{ count: number }> {
  if (!isSuperuser) throw new ForbiddenError('Solo superusuarios pueden ejecutar esta operación')
  const deleted = await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  })
  return { count: deleted.count }
}

export async function updateConcurrentSessions(
  userId: string,
  callerId: string,
  isSuperuser: boolean
): Promise<void> {
  assertSelfOrSuperuser(callerId, userId, isSuperuser, 'Solo puedes modificar la política de sesiones de tu propio usuario')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) throw new NotFoundError('Usuario no encontrado')
}
