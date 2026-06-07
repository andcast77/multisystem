import type { TokenPayload } from '../core/auth.js'
import { prisma } from '../db/index.js'
import { canAccessCompany, canManageCompany, canManageMembers, isOwner } from '../core/permissions.js'
import { ForbiddenError } from '../common/errors/app-error.js'

export async function resolveCompanyAccess(
  userId: string,
  companyId: string,
  isSuperuser?: boolean
): Promise<{ allowed: boolean; membershipRole: string | null }> {
  if (isSuperuser) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, isActive: true },
      select: { id: true },
    })
    return { allowed: !!company, membershipRole: null }
  }

  const member = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { membershipRole: true },
  })
  if (member) return { allowed: true, membershipRole: member.membershipRole }

  const roleAssignment = await prisma.userRoleAssignment.findFirst({
    where: { userId, companyId },
    select: { id: true },
  })
  return { allowed: !!roleAssignment, membershipRole: null }
}

export function assertCompanyAccess(caller: TokenPayload, companyId: string, message = 'No tienes acceso a esta empresa'): void {
  if (!canAccessCompany(caller, companyId)) {
    throw new ForbiddenError(message)
  }
}

export function assertCanManageMembers(
  caller: Pick<TokenPayload, 'membershipRole' | 'isSuperuser'>,
  message = 'Solo el owner o un admin pueden crear o gestionar usuarios'
): void {
  if (!canManageMembers(caller)) {
    throw new ForbiddenError(message)
  }
}

export function assertCanManageCompany(
  caller: Pick<TokenPayload, 'membershipRole' | 'isSuperuser'>,
  message = 'No tienes permisos para editar esta empresa'
): void {
  if (!canManageCompany(caller)) {
    throw new ForbiddenError(message)
  }
}

export function assertOwner(
  caller: Pick<TokenPayload, 'membershipRole' | 'isSuperuser'>,
  message = 'Solo el propietario puede ejecutar esta acción'
): void {
  if (!isOwner(caller)) {
    throw new ForbiddenError(message)
  }
}

export function assertSelfOrSuperuser(
  callerId: string,
  targetUserId: string,
  isSuperuser?: boolean,
  message = 'No tienes permisos para ejecutar esta accion'
): void {
  if (callerId !== targetUserId && !isSuperuser) {
    throw new ForbiddenError(message)
  }
}
