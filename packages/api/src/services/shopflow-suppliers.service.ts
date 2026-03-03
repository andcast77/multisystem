import type { FastifyReply } from 'fastify'
import { prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'

export type SupplierBody = {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  taxId?: string | null
  notes?: string | null
  active?: boolean
}

export type SupplierQuery = {
  search?: string
  active?: string
}

export async function listSuppliers(
  ctx: CompanyContext,
  query: SupplierQuery,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const where: Parameters<typeof prisma.supplier.findMany>[0]['where'] = { companyId: ctx.companyId }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { taxId: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.active !== undefined) where.active = query.active === 'true'

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })

    return {
      success: true,
      data: suppliers.map((s) => ({
        id: s.id,
        companyId: s.companyId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        state: s.state,
        taxId: s.taxId,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        _count: { products: s._count.products },
      })),
    }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al obtener proveedores',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function getSupplierById(
  ctx: CompanyContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId: ctx.companyId },
      include: {
        products: { orderBy: { name: 'asc' }, select: { id: true, name: true, sku: true, price: true, stock: true } },
        _count: { select: { products: true } },
      },
    })
    if (!supplier) {
      reply.code(404)
      return { success: false, error: 'Proveedor no encontrado' }
    }
    return {
      success: true,
      data: {
        ...supplier,
        products: supplier.products,
        _count: supplier._count,
      },
    }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al obtener proveedor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function createSupplier(
  ctx: CompanyContext,
  body: SupplierBody,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        companyId: ctx.companyId,
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        taxId: body.taxId ?? null,
        active: body.active ?? true,
      },
      include: { _count: { select: { products: true } } },
    })
    return {
      success: true,
      data: { ...supplier, _count: supplier._count },
    }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al crear proveedor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function updateSupplier(
  ctx: CompanyContext,
  id: string,
  body: Partial<SupplierBody>,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: ctx.companyId },
    })
    if (!existing) {
      reply.code(404)
      return { success: false, error: 'Proveedor no encontrado' }
    }
    const data: Parameters<typeof prisma.supplier.update>[0]['data'] = {}
    if (body.name !== undefined) data.name = body.name
    if (body.email !== undefined) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone
    if (body.address !== undefined) data.address = body.address
    if (body.city !== undefined) data.city = body.city
    if (body.state !== undefined) data.state = body.state
    if (body.taxId !== undefined) data.taxId = body.taxId
    if (body.active !== undefined) data.active = body.active
    if (Object.keys(data).length === 0) {
      reply.code(400)
      return { success: false, error: 'No hay campos para actualizar' }
    }
    const supplier = await prisma.supplier.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    })
    return { success: true, data: { ...supplier, _count: supplier._count } }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al actualizar proveedor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function deleteSupplier(
  ctx: CompanyContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: ctx.companyId },
      include: { _count: { select: { products: true } } },
    })
    if (!existing) {
      reply.code(404)
      return { success: false, error: 'Proveedor no encontrado' }
    }
    if (existing._count.products > 0) {
      reply.code(400)
      return {
        success: false,
        error: 'No se puede eliminar un proveedor que tiene productos. Por favor reasigne o elimine los productos primero.',
      }
    }
    await prisma.supplier.delete({ where: { id } })
    return { success: true, data: { success: true } }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al eliminar proveedor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
