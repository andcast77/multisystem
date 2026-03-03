import { prisma } from '../db/index.js'
import { findModulesByKeys, getCompanyModules } from '../core/modules.js'
import type { TokenPayload } from '../core/auth.js'
import type { UpdateCompanyBody } from '../dto/companies.dto.js'
import { canAccessCompany, isOwner, canManageCompany } from '../core/permissions.js'

/** Returns company with owner, or null if not found. Caller access must be checked by controller. */
export async function getById(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: { owner: true },
  })
}

/** Caller access must be checked by controller. */
export async function getStats(companyId: string) {
  const [totalMembers, ownerCount, adminCount, userCount, lastMember] = await Promise.all([
    prisma.companyMember.count({ where: { companyId } }),
    prisma.companyMember.count({ where: { companyId, membershipRole: 'OWNER' } }),
    prisma.companyMember.count({ where: { companyId, membershipRole: 'ADMIN' } }),
    prisma.companyMember.count({ where: { companyId, membershipRole: 'USER' } }),
    prisma.companyMember.findFirst({
      where: { companyId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return { totalMembers, ownerCount, adminCount, userCount, lastMember }
}

export async function update(companyId: string, caller: TokenPayload, body: UpdateCompanyBody) {
  if (!canAccessCompany(caller, companyId)) {
    return { error: 'No tienes acceso a esta empresa', code: 403 as const }
  }
  if (
    (body.workifyEnabled !== undefined || body.shopflowEnabled !== undefined || body.technicalServicesEnabled !== undefined) &&
    !isOwner(caller)
  ) {
    return { error: 'Solo el propietario puede activar/desactivar módulos', code: 403 as const }
  }
  if (!canManageCompany(caller)) {
    return { error: 'No tienes permisos para editar esta empresa', code: 403 as const }
  }

  const companyUpdate: Record<string, unknown> = {}
  if (body.name !== undefined) companyUpdate.name = body.name
  if (body.logo !== undefined) companyUpdate.logo = body.logo
  if (body.taxId !== undefined) companyUpdate.taxId = body.taxId
  if (body.address !== undefined) companyUpdate.address = body.address
  if (body.phone !== undefined) companyUpdate.phone = body.phone

  if (Object.keys(companyUpdate).length > 0) {
    await prisma.company.update({ where: { id: companyId }, data: companyUpdate })
  }

  if (
    body.workifyEnabled !== undefined ||
    body.shopflowEnabled !== undefined ||
    body.technicalServicesEnabled !== undefined
  ) {
    const modulesMap = await findModulesByKeys(['workify', 'shopflow', 'techservices'])
    const workifyMod = modulesMap.get('workify')
    const shopflowMod = modulesMap.get('shopflow')
    const techservicesMod = modulesMap.get('techservices')
    const updates: { moduleId: string; enabled: boolean }[] = []
    if (body.workifyEnabled !== undefined && workifyMod) updates.push({ moduleId: workifyMod.id, enabled: body.workifyEnabled })
    if (body.shopflowEnabled !== undefined && shopflowMod) updates.push({ moduleId: shopflowMod.id, enabled: body.shopflowEnabled })
    if (body.technicalServicesEnabled !== undefined && techservicesMod) updates.push({ moduleId: techservicesMod.id, enabled: body.technicalServicesEnabled })
    for (const { moduleId, enabled } of updates) {
      await prisma.companyModule.upsert({
        where: { companyId_moduleId: { companyId, moduleId } },
        create: { companyId, moduleId, enabled },
        update: { enabled },
      })
    }
  }

  const updated = await prisma.company.findUnique({ where: { id: companyId } })
  if (!updated) return { error: 'Empresa no encontrada', code: 404 as const }
  const modules = await getCompanyModules(updated.id)
  return { id: updated.id, name: updated.name, updatedAt: updated.updatedAt, modules }
}

export async function remove(companyId: string, caller: TokenPayload) {
  if (!canAccessCompany(caller, companyId)) {
    return { error: 'No tienes acceso a esta empresa', code: 403 as const }
  }
  if (!isOwner(caller)) {
    return { error: 'Solo el propietario puede eliminar la empresa', code: 403 as const }
  }
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } })
  if (!company) return { error: 'Empresa no encontrada', code: 404 as const }
  await prisma.company.delete({ where: { id: companyId } })
  return { success: true as const }
}
