import type { FastifyReply } from 'fastify'
import { prisma, Prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'

export type CategoryBody = {
  name: string
  description?: string | null
  parentId?: string | null
}

export type CategoryQuery = {
  search?: string
  parentId?: string
  includeChildren?: string
}

export async function listCategories(
  ctx: CompanyContext,
  query: CategoryQuery,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const where: Prisma.CategoryWhereInput = { companyId: ctx.companyId }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.parentId !== undefined) {
      if (query.parentId === null || query.parentId === 'null' || query.parentId === '') where.parentId = null
      else where.parentId = query.parentId
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
    })

    const result = categories.map((c) => {
      const category: Record<string, unknown> = {
        id: c.id,
        companyId: c.companyId,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        _count: { products: c._count.products, children: c._count.children },
      }
      if (c.parent) category.parent = c.parent
      if (query.includeChildren === 'true' && c._count.children > 0) category.children = []
      return category
    })

    return { success: true, data: result }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al obtener categorías',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function getCategoryById(
  ctx: CompanyContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const category = await prisma.category.findFirst({
      where: { id, companyId: ctx.companyId },
      include: {
        parent: true,
        children: { orderBy: { name: 'asc' } },
        _count: { select: { products: true, children: true } },
      },
    })
    if (!category) {
      reply.code(404)
      return { success: false, error: 'Categoría no encontrada' }
    }
    return {
      success: true,
      data: {
        ...category,
        parent: category.parent ?? null,
        children: category.children,
        _count: category._count,
      },
    }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al obtener categoría',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function createCategory(
  ctx: CompanyContext,
  body: CategoryBody,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const { name, description, parentId } = body

    const existing = await prisma.category.findFirst({
      where: { companyId: ctx.companyId, name, parentId: parentId ?? null },
    })
    if (existing) {
      reply.code(409)
      return { success: false, error: 'Ya existe una categoría con este nombre en este nivel' }
    }

    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parentId, companyId: ctx.companyId },
      })
      if (!parent) {
        reply.code(404)
        return { success: false, error: 'Categoría padre no encontrada' }
      }
    }

    const category = await prisma.category.create({
      data: {
        companyId: ctx.companyId,
        name,
        description: description ?? null,
        parentId: parentId ?? null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    })
    return {
      success: true,
      data: {
        ...category,
        parent: category.parent ?? null,
        _count: category._count,
      },
    }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al crear categoría',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function updateCategory(
  ctx: CompanyContext,
  id: string,
  body: Partial<CategoryBody>,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const existing = await prisma.category.findFirst({
      where: { id, companyId: ctx.companyId },
      select: { id: true, name: true, parentId: true },
    })
    if (!existing) {
      reply.code(404)
      return { success: false, error: 'Categoría no encontrada' }
    }
    const { name, description, parentId } = body
    if (parentId === id) {
      reply.code(400)
      return { success: false, error: 'Una categoría no puede ser su propio padre' }
    }
    const effectiveParentId = parentId !== undefined ? parentId : existing.parentId
    if (name && name !== existing.name) {
      const sibling = await prisma.category.findFirst({
        where: {
          companyId: ctx.companyId,
          name,
          parentId: effectiveParentId ?? null,
          id: { not: id },
        },
      })
      if (sibling) {
        reply.code(409)
        return { success: false, error: 'Ya existe una categoría con este nombre en este nivel' }
      }
    }
    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parentId, companyId: ctx.companyId },
      })
      if (!parent) {
        reply.code(404)
        return { success: false, error: 'Categoría padre no encontrada' }
      }
    }
    const data: Prisma.CategoryUpdateInput = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (parentId !== undefined) {
      data.parent = parentId ? { connect: { id: parentId } } : { disconnect: true }
    }
    if (Object.keys(data).length === 0) {
      reply.code(400)
      return { success: false, error: 'No hay campos para actualizar' }
    }
    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    })
    return {
      success: true,
      data: { ...category, parent: category.parent ?? null, _count: category._count },
    }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al actualizar categoría',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

export async function deleteCategory(
  ctx: CompanyContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  try {
    const existing = await prisma.category.findFirst({
      where: { id, companyId: ctx.companyId },
      include: { _count: { select: { products: true, children: true } } },
    })
    if (!existing) {
      reply.code(404)
      return { success: false, error: 'Categoría no encontrada' }
    }
    if (existing._count.products > 0) {
      reply.code(400)
      return {
        success: false,
        error: 'No se puede eliminar una categoría que tiene productos. Por favor reasigne o elimine los productos primero.',
      }
    }
    if (existing._count.children > 0) {
      reply.code(400)
      return {
        success: false,
        error: 'No se puede eliminar una categoría que tiene subcategorías. Por favor elimine o reasigne las subcategorías primero.',
      }
    }
    await prisma.category.delete({ where: { id } })
    return { success: true, data: { success: true } }
  } catch (error) {
    reply.code(500)
    return {
      success: false,
      error: 'Error al eliminar categoría',
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
