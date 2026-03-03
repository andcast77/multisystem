import { prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'
import type { FastifyReply } from 'fastify'

export async function listCustomers(ctx: CompanyContext, query: { search?: string; email?: string; phone?: string }, reply: FastifyReply) {
  try {
    const where: Parameters<typeof prisma.customer.findMany>[0]['where'] = { companyId: ctx.companyId }
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' }
    if (query.email) where.email = query.email
    if (query.phone) where.phone = query.phone

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { sales: true } } },
    })
    return {
      success: true as const,
      data: customers.map((c) => ({
        id: c.id,
        companyId: c.companyId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        _count: { sales: c._count.sales },
      })),
    }
  } catch (error) {
    reply.code(500)
    return { success: false as const, error: 'Error al obtener clientes', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function getCustomerById(ctx: CompanyContext, id: string, reply: FastifyReply) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id, companyId: ctx.companyId },
      include: {
        _count: { select: { sales: true } },
        sales: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, invoiceNumber: true, total: true, status: true, createdAt: true } },
      },
    })
    if (!customer) {
      reply.code(404)
      return { success: false as const, error: 'Cliente no encontrado' }
    }
    return {
      success: true as const,
      data: {
        id: customer.id,
        companyId: customer.companyId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        _count: { sales: customer._count.sales },
        sales: customer.sales.map((s) => ({ id: s.id, invoiceNumber: s.invoiceNumber, total: s.total, status: s.status, createdAt: s.createdAt })),
      },
    }
  } catch (error) {
    reply.code(500)
    return { success: false as const, error: 'Error al obtener cliente', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function createCustomer(ctx: CompanyContext, body: { name: string; email?: string | null; phone?: string | null; address?: string | null }, reply: FastifyReply) {
  try {
    const customer = await prisma.customer.create({
      data: {
        companyId: ctx.companyId,
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
      },
      include: { _count: { select: { sales: true } } },
    })
    return {
      success: true as const,
      data: {
        id: customer.id,
        companyId: customer.companyId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        _count: { sales: customer._count.sales },
      },
    }
  } catch (error) {
    reply.code(500)
    return { success: false as const, error: 'Error al crear cliente', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function updateCustomer(ctx: CompanyContext, id: string, body: Partial<{ name: string; email: string | null; phone: string | null; address: string | null }>, reply: FastifyReply) {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id, companyId: ctx.companyId },
      select: { id: true },
    })
    if (!existing) {
      reply.code(404)
      return { success: false as const, error: 'Cliente no encontrado' }
    }
    const data: Parameters<typeof prisma.customer.update>[0]['data'] = {}
    if (body.name !== undefined) data.name = body.name
    if (body.email !== undefined) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone
    if (body.address !== undefined) data.address = body.address
    if (Object.keys(data).length === 0) {
      reply.code(400)
      return { success: false as const, error: 'No hay campos para actualizar' }
    }
    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: { _count: { select: { sales: true } } },
    })
    return {
      success: true as const,
      data: {
        id: customer.id,
        companyId: customer.companyId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        _count: { sales: customer._count.sales },
      },
    }
  } catch (error) {
    reply.code(500)
    return { success: false as const, error: 'Error al actualizar cliente', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function deleteCustomer(ctx: CompanyContext, id: string, reply: FastifyReply) {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id, companyId: ctx.companyId },
      include: { _count: { select: { sales: true } } },
    })
    if (!existing) {
      reply.code(404)
      return { success: false as const, error: 'Cliente no encontrado' }
    }
    if (existing._count.sales > 0) {
      reply.code(400)
      return { success: false as const, error: 'No se puede eliminar un cliente que tiene ventas. Las ventas se preservan para registros históricos.' }
    }
    await prisma.customer.delete({ where: { id } })
    return { success: true as const, data: { success: true } }
  } catch (error) {
    reply.code(500)
    return { success: false as const, error: 'Error al eliminar cliente', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
