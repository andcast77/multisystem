import { prisma } from '../db/index.js'
import type { TokenPayload } from '../core/auth.js'
import { ForbiddenError, NotFoundError, BadRequestError } from '../common/errors/app-error.js'
import { assertCanManageMembers, assertCompanyAccess } from '../policies/company-authorization.policy.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemberModuleItem = {
  moduleId: string
  key: string
  name: string
  enabled: boolean
}

export type MemberRoleItem = {
  roleId: string
  name: string
  description: string | null
  assigned: boolean
}

export type UpdateMemberModulesBody = {
  modules: { moduleId: string; enabled: boolean }[]
}

export type UpdateMemberRolesBody = {
  roleIds: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveMember(companyId: string, memberId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { id: memberId, companyId },
    select: { id: true, userId: true, membershipRole: true },
  })
  if (!member) throw new NotFoundError('Miembro no encontrado en esta empresa')
  return member
}

// ---------------------------------------------------------------------------
// getMemberModules
// ---------------------------------------------------------------------------

export async function getMemberModules(
  companyId: string,
  memberId: string,
  caller: TokenPayload
): Promise<MemberModuleItem[]> {
  assertCompanyAccess(caller, companyId)
  assertCanManageMembers(caller)

  await resolveMember(companyId, memberId)

  const companyModules = await prisma.companyModule.findMany({
    where: { companyId },
    include: { module: true },
  })

  const memberModules = await prisma.companyMemberModule.findMany({
    where: { companyMemberId: memberId },
    select: { moduleId: true, enabled: true },
  })
  const memberModuleMap = new Map(memberModules.map((m) => [m.moduleId, m.enabled]))

  return companyModules.map((cm) => ({
    moduleId: cm.moduleId,
    key: cm.module.key,
    name: cm.module.name,
    // Per-member override if exists; otherwise falls back to company-level enabled state
    enabled: memberModuleMap.has(cm.moduleId)
      ? (memberModuleMap.get(cm.moduleId) ?? false)
      : cm.enabled,
  }))
}

// ---------------------------------------------------------------------------
// updateMemberModules
// ---------------------------------------------------------------------------

export async function updateMemberModules(
  companyId: string,
  memberId: string,
  body: UpdateMemberModulesBody,
  caller: TokenPayload
): Promise<MemberModuleItem[]> {
  assertCompanyAccess(caller, companyId)
  assertCanManageMembers(caller)

  const member = await resolveMember(companyId, memberId)

  // Prevent disabling all modules for the owner
  if (member.membershipRole === 'OWNER' && body.modules.every((m) => !m.enabled)) {
    throw new BadRequestError('No puedes deshabilitar todos los módulos para el propietario')
  }

  // Validate all moduleIds belong to this company
  const companyModuleIds = (
    await prisma.companyModule.findMany({
      where: { companyId },
      select: { moduleId: true },
    })
  ).map((cm) => cm.moduleId)

  const invalid = body.modules.filter((m) => !companyModuleIds.includes(m.moduleId))
  if (invalid.length > 0) {
    throw new BadRequestError('Uno o más módulos no pertenecen a esta empresa')
  }

  // Upsert each module override
  await Promise.all(
    body.modules.map((m) =>
      prisma.companyMemberModule.upsert({
        where: { companyMemberId_moduleId: { companyMemberId: memberId, moduleId: m.moduleId } },
        create: { companyMemberId: memberId, moduleId: m.moduleId, enabled: m.enabled },
        update: { enabled: m.enabled },
      })
    )
  )

  return getMemberModules(companyId, memberId, caller)
}

// ---------------------------------------------------------------------------
// getMemberRoles
// ---------------------------------------------------------------------------

export async function getMemberRoles(
  companyId: string,
  memberId: string,
  caller: TokenPayload
): Promise<MemberRoleItem[]> {
  assertCompanyAccess(caller, companyId)
  assertCanManageMembers(caller)

  const member = await resolveMember(companyId, memberId)

  const companyRoles = await prisma.role.findMany({
    where: { companyId },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  })

  const assignedRoles = await prisma.userRoleAssignment.findMany({
    where: { userId: member.userId, companyId },
    select: { roleId: true },
  })
  const assignedSet = new Set(assignedRoles.map((r) => r.roleId))

  return companyRoles.map((role) => ({
    roleId: role.id,
    name: role.name,
    description: role.description,
    assigned: assignedSet.has(role.id),
  }))
}

// ---------------------------------------------------------------------------
// updateMemberRoles
// ---------------------------------------------------------------------------

export async function updateMemberRoles(
  companyId: string,
  memberId: string,
  body: UpdateMemberRolesBody,
  caller: TokenPayload
): Promise<MemberRoleItem[]> {
  assertCompanyAccess(caller, companyId)
  assertCanManageMembers(caller)

  const member = await resolveMember(companyId, memberId)

  // Prevent self privilege escalation: a non-superuser cannot assign roles to themselves
  if (!caller.isSuperuser && caller.id === member.userId) {
    throw new ForbiddenError('No puedes modificar tus propios roles')
  }

  // Validate all roleIds belong to this company
  const companyRoles = await prisma.role.findMany({
    where: { companyId },
    select: { id: true },
  })
  const validRoleIds = new Set(companyRoles.map((r) => r.id))

  const invalid = body.roleIds.filter((id) => !validRoleIds.has(id))
  if (invalid.length > 0) {
    throw new BadRequestError('Uno o más roles no pertenecen a esta empresa')
  }

  // Replace all current role assignments for this user in this company
  await prisma.$transaction([
    prisma.userRoleAssignment.deleteMany({ where: { userId: member.userId, companyId } }),
    ...(body.roleIds.length > 0
      ? [
          prisma.userRoleAssignment.createMany({
            data: body.roleIds.map((roleId) => ({ userId: member.userId, roleId, companyId })),
          }),
        ]
      : []),
  ])

  return getMemberRoles(companyId, memberId, caller)
}
