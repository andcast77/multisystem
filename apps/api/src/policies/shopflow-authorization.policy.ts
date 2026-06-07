import { prisma } from '../db/index.js'
import type { ShopflowContext } from '../core/auth-context.js'
import { createRepositories } from '../repositories/index.js'
import { ForbiddenError, BadRequestError } from '../common/errors/app-error.js'
import { canManageMembers } from '../core/permissions.js'

const STORE_REQUIRED_MSG = 'Envia el parametro storeId (query/body) o el header X-Store-Id con el id del local de venta (usuario no administrador)'

export function hasFullStoreAccess(ctx: Pick<ShopflowContext, 'membershipRole' | 'isSuperuser'>): boolean {
  return ctx.isSuperuser || ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
}

export async function assertUserInCompany(companyId: string, userId: string, message: string): Promise<void> {
  const hasMembership = await createRepositories(companyId).companyMembers.existsUserMembership(userId)
  if (!hasMembership) {
    throw new ForbiddenError(message)
  }
}

export async function canAccessUserPreferences(
  callerId: string,
  callerIsSuperuser: boolean,
  companyId: string,
  callerMembershipRole: string | null,
  targetUserId: string
): Promise<boolean> {
  if (callerId === targetUserId || callerIsSuperuser) return true
  if (!canManageMembers({ membershipRole: callerMembershipRole ?? undefined, isSuperuser: callerIsSuperuser })) return false
  return createRepositories(companyId).companyMembers.existsUserMembership(targetUserId)
}

export async function resolveEffectiveStoreIdForScopedUser(
  ctx: ShopflowContext,
  candidateStoreId?: string | null
): Promise<string | undefined> {
  if (hasFullStoreAccess(ctx)) {
    return candidateStoreId ?? undefined
  }

  const effective = candidateStoreId ?? ctx.storeId ?? null
  if (!effective) {
    throw new ForbiddenError(STORE_REQUIRED_MSG)
  }
  return effective
}

export function assertStoreMatchForScopedUser(
  ctx: ShopflowContext,
  targetStoreId: string,
  message = 'Solo puedes operar en tu local de venta asignado'
): void {
  if (!hasFullStoreAccess(ctx) && ctx.storeId != null && targetStoreId !== ctx.storeId) {
    throw new ForbiddenError(message)
  }
}

export async function assertStoreBelongsToCompany(companyId: string, storeId: string): Promise<void> {
  const store = await prisma.store.findFirst({
    where: { id: storeId, companyId },
    select: { id: true },
  })
  if (!store) {
    throw new BadRequestError('Local de venta no encontrado o no pertenece a la empresa')
  }
}
