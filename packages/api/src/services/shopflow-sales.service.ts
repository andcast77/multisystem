import type { FastifyReply } from 'fastify'
import { prisma } from '../db/index.js'
import type { ShopflowContext } from '../core/auth-context.js'

function num(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'object' && v !== null && 'toNumber' in v) return (v as { toNumber: () => number }).toNumber()
  return Number(v)
}

export type Sale = {
  id: string
  storeId: string | null
  customerId: string | null
  userId: string
  invoiceNumber: string | null
  total: number
  subtotal: number
  tax: number
  discount: number | null
  status: string
  paymentMethod: string | null
  paidAmount: number
  change: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type SaleItem = {
  id: string
  saleId: string
  productId: string
  quantity: number
  price: number
  discount: number
  subtotal: number
}

export type ListSalesQuery = {
  storeId?: string
  customerId?: string
  userId?: string
  status?: string
  paymentMethod?: string
  startDate?: string
  endDate?: string
  page?: string
  limit?: string
}

export type CreateSaleBody = {
  storeId?: string | null
  customerId?: string | null
  userId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
    discount?: number
  }>
  paymentMethod: string
  paidAmount: number
  discount?: number
  taxRate?: number
  notes?: string | null
}

export async function listSales(
  ctx: ShopflowContext,
  query: ListSalesQuery,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string } | null> {
  const isStoreAdmin = ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
  const effectiveStoreId = isStoreAdmin
    ? query.storeId ?? undefined
    : (query.storeId || ctx.storeId) ?? null
  if (!isStoreAdmin && !effectiveStoreId) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para listar ventas (usuario no administrador)',
    })
    return null
  }

  const pageNum = parseInt(query.page ?? '1')
  const limitNum = parseInt(query.limit ?? '20')
  const skip = (pageNum - 1) * limitNum

  const where: Parameters<typeof prisma.sale.findMany>[0]['where'] = { companyId: ctx.companyId }
  if (effectiveStoreId) where.storeId = effectiveStoreId
  if (query.customerId) where.customerId = query.customerId
  if (query.userId) where.userId = query.userId
  if (query.status) where.status = query.status as 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod as 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER'
  if (query.startDate && query.endDate) where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) }
  else if (query.startDate) where.createdAt = { gte: new Date(query.startDate) }
  else if (query.endDate) where.createdAt = { lte: new Date(query.endDate) }

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        user: { select: { id: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }),
  ])

  const salesWithRelations = sales.map((sale) => ({
    id: sale.id,
    companyId: sale.companyId,
    storeId: sale.storeId,
    customerId: sale.customerId,
    userId: sale.userId,
    invoiceNumber: sale.invoiceNumber,
    total: num(sale.total),
    subtotal: num(sale.subtotal),
    tax: num(sale.tax),
    discount: sale.discount != null ? num(sale.discount) : null,
    status: sale.status,
    paymentMethod: sale.paymentMethod,
    notes: sale.notes,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    customer: sale.customer,
    user: sale.user,
    items: sale.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: num(item.price),
      discount: item.discount != null ? num(item.discount) : null,
      subtotal: num(item.subtotal),
      product: item.product,
    })),
  }))

  return {
    success: true,
    data: {
      sales: salesWithRelations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  }
}

export async function getSaleById(
  ctx: ShopflowContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      user: { select: { id: true, email: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, barcode: true, price: true } } } },
    },
  })
  if (!sale) {
    reply.code(404)
    return { success: false, error: 'Venta no encontrada' }
  }
  const isStoreAdminId = ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
  if (!isStoreAdminId && ctx.storeId != null && sale.storeId !== ctx.storeId) {
    reply.code(404)
    return { success: false, error: 'Venta no encontrada' }
  }
  return {
    success: true,
    data: {
      ...sale,
      total: num(sale.total),
      subtotal: num(sale.subtotal),
      tax: num(sale.tax),
      discount: sale.discount != null ? num(sale.discount) : null,
      customer: sale.customer,
      user: sale.user,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: num(item.price),
        discount: item.discount != null ? num(item.discount) : null,
        subtotal: num(item.subtotal),
        product: item.product ? { ...item.product, price: num(item.product.price) } : null,
      })),
    },
  }
}

export async function createSale(
  ctx: ShopflowContext,
  body: CreateSaleBody,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string } | void> {
  const { storeId: bodyStoreId, customerId, userId, items, paymentMethod, paidAmount, discount = 0, taxRate, notes } = body
  const effectiveStoreId = bodyStoreId ?? ctx.storeId ?? null
  const isStoreAdmin = ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
  if (!isStoreAdmin && effectiveStoreId == null) {
    reply.code(400).send({
      success: false,
      error: 'Envía storeId en el body o el header X-Store-Id con el id del local de venta para registrar la venta',
    })
    return
  }
  if (!isStoreAdmin && ctx.storeId != null && effectiveStoreId !== ctx.storeId) {
    reply.code(403).send({
      success: false,
      error: 'Solo puedes registrar ventas en tu local de venta asignado',
    })
    return
  }
  if (effectiveStoreId) {
    const storeCheck = await prisma.store.findFirst({
      where: { id: effectiveStoreId, companyId: ctx.companyId },
    })
    if (!storeCheck) {
      reply.code(400).send({ success: false, error: 'Local de venta no encontrado o no pertenece a la empresa' })
      return
    }
  }

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, companyId: ctx.companyId },
      select: { id: true, name: true, stock: true, active: true },
    })
    if (!product) {
      reply.code(404)
      return { success: false, error: `Producto con ID ${item.productId} no encontrado` }
    }
    if (!product.active) {
      reply.code(400)
      return { success: false, error: `El producto ${product.name} no está activo` }
    }
    if (product.stock < item.quantity) {
      reply.code(400)
      return {
        success: false,
        error: `Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
      }
    }
  }

  if (customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId: ctx.companyId },
    })
    if (!customer) {
      reply.code(404)
      return { success: false, error: 'Cliente no encontrado' }
    }
  }

  const storeConfig = await prisma.storeConfig.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
    select: { taxRate: true, invoicePrefix: true, invoiceNumber: true, id: true },
  })
  const configTaxRate = storeConfig ? num(storeConfig.taxRate) : 0
  const finalTaxRate = taxRate ?? configTaxRate

  let subtotal = 0
  const saleItems = items.map((item) => {
    const itemSubtotal = item.price * item.quantity - (item.discount || 0)
    subtotal += itemSubtotal
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      subtotal: itemSubtotal,
    }
  })
  const subtotalAfterDiscount = subtotal - discount
  const tax = subtotalAfterDiscount * finalTaxRate
  const total = subtotalAfterDiscount + tax

  if (paidAmount < total) {
    reply.code(400)
    return { success: false, error: `El monto pagado (${paidAmount}) es menor que el total (${total})` }
  }

  const created = await prisma.$transaction(async (tx) => {
    const nextInvoice = storeConfig
      ? await tx.storeConfig.update({
          where: { id: storeConfig.id },
          data: { invoiceNumber: storeConfig.invoiceNumber + 1 },
          select: { invoicePrefix: true, invoiceNumber: true },
        })
      : null
    const invoiceNumber = nextInvoice
      ? `${nextInvoice.invoicePrefix}${nextInvoice.invoiceNumber.toString().padStart(6, '0')}`
      : null

    const sale = await tx.sale.create({
      data: {
        companyId: ctx.companyId,
        storeId: effectiveStoreId,
        customerId: customerId ?? null,
        userId,
        invoiceNumber,
        total,
        subtotal,
        tax,
        discount: discount ?? null,
        status: 'COMPLETED',
        paymentMethod: paymentMethod as 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER',
        notes: notes ?? null,
      },
    })

    for (const item of saleItems) {
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.subtotal,
        },
      })
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        user: { select: { id: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    })
  })

  if (!created) return { success: false, error: 'Error al crear venta' }
  return {
    success: true,
    data: {
      ...created,
      total: num(created.total),
      subtotal: num(created.subtotal),
      tax: num(created.tax),
      discount: created.discount != null ? num(created.discount) : null,
      customer: created.customer,
      user: created.user,
      items: created.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: num(item.price),
        discount: item.discount != null ? num(item.discount) : null,
        subtotal: num(item.subtotal),
        product: item.product,
      })),
    },
  }
}

export async function cancelSale(
  ctx: ShopflowContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, status: true },
    include: { items: { select: { productId: true, quantity: true } } },
  })
  if (!sale) {
    reply.code(404)
    return { success: false, error: 'Venta no encontrada' }
  }
  if (sale.status === 'CANCELLED') {
    reply.code(400)
    return { success: false, error: 'La venta ya está cancelada' }
  }
  if (sale.status === 'REFUNDED') {
    reply.code(400)
    return { success: false, error: 'No se puede cancelar una venta reembolsada' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
  })

  const updatedSale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
  })
  if (!updatedSale) return { success: true, data: null }
  return {
    success: true,
    data: {
      ...updatedSale,
      total: num(updatedSale.total),
      subtotal: num(updatedSale.subtotal),
      tax: num(updatedSale.tax),
      discount: updatedSale.discount != null ? num(updatedSale.discount) : null,
    },
  }
}

export async function refundSale(
  ctx: ShopflowContext,
  id: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, status: true },
    include: { items: { select: { productId: true, quantity: true } } },
  })
  if (!sale) {
    reply.code(404)
    return { success: false, error: 'Venta no encontrada' }
  }
  if (sale.status === 'REFUNDED') {
    reply.code(400)
    return { success: false, error: 'La venta ya está reembolsada' }
  }
  if (sale.status === 'CANCELLED') {
    reply.code(400)
    return { success: false, error: 'No se puede reembolsar una venta cancelada' }
  }
  if (sale.status !== 'COMPLETED') {
    reply.code(400)
    return {
      success: false,
      error: `No se puede reembolsar una venta con estado ${sale.status}. Solo las ventas completadas pueden ser reembolsadas.`,
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: { status: 'REFUNDED' },
    })
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
  })

  const updatedSale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
  })
  if (!updatedSale) return { success: true, data: null }
  return {
    success: true,
    data: {
      ...updatedSale,
      total: num(updatedSale.total),
      subtotal: num(updatedSale.subtotal),
      tax: num(updatedSale.tax),
      discount: updatedSale.discount != null ? num(updatedSale.discount) : null,
    },
  }
}
