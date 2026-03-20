import { prisma, Prisma } from '../db/index.js'
import type { ShopflowContext } from '../core/auth-context.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../common/errors/index.js'
import { parsePagination, toNumber } from '../common/database/index.js'
import {
  assertStoreBelongsToCompany,
  assertStoreMatchForScopedUser,
  hasFullStoreAccess,
  resolveEffectiveStoreIdForScopedUser,
} from '../policies/shopflow-authorization.policy.js'

const num = toNumber

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
) {
  const effectiveStoreId = await resolveEffectiveStoreIdForScopedUser(ctx, query.storeId)

  const { page: pageNum, limit: limitNum, skip } = parsePagination(query)

  const where: Prisma.SaleWhereInput = { companyId: ctx.companyId }
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
) {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      user: { select: { id: true, email: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, barcode: true, price: true } } } },
    },
  })
  if (!sale) {
    throw new NotFoundError('Venta no encontrada')
  }
  if (!hasFullStoreAccess(ctx) && ctx.storeId != null && sale.storeId !== ctx.storeId) {
    throw new NotFoundError('Venta no encontrada')
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
) {
  const { storeId: bodyStoreId, customerId, userId, items, paymentMethod, paidAmount, discount = 0, taxRate, notes } = body
  const effectiveStoreId = bodyStoreId ?? ctx.storeId ?? null
  if (effectiveStoreId == null) {
    throw new BadRequestError('Envía storeId en el body o el header X-Store-Id con el id del local de venta para registrar la venta')
  }
  assertStoreMatchForScopedUser(ctx, effectiveStoreId, 'Solo puedes registrar ventas en tu local de venta asignado')
  await assertStoreBelongsToCompany(ctx.companyId, effectiveStoreId)

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, companyId: ctx.companyId },
      select: { id: true, name: true, active: true },
    })
    if (!product) {
      throw new NotFoundError(`Producto con ID ${item.productId} no encontrado`)
    }
    if (!product.active) {
      throw new BadRequestError(`El producto ${product.name} no está activo`)
    }
    const inventory = await prisma.storeInventory.findUnique({
      where: { storeId_productId: { storeId: effectiveStoreId, productId: item.productId } },
    })
    const available = inventory?.quantity ?? 0
    if (available < item.quantity) {
      throw new BadRequestError(
        `Stock insuficiente para el producto ${product.name}. Disponible: ${available}, Solicitado: ${item.quantity}`,
      )
    }
  }

  if (customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId: ctx.companyId },
    })
    if (!customer) {
      throw new NotFoundError('Cliente no encontrado')
    }
  }

  const storeConfig = await prisma.storeConfig.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
    select: { taxRate: true, invoicePrefix: true, id: true },
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
    throw new BadRequestError(`El monto pagado (${paidAmount}) es menor que el total (${total})`)
  }

  const created = await prisma.$transaction(async (tx) => {
    let invoiceNumber: string | null = null
    if (storeConfig) {
      const [result] = await tx.$queryRaw<[{ invoicePrefix: string; invoiceNumber: number }]>(
        Prisma.sql`UPDATE store_configs SET "invoiceNumber" = "invoiceNumber" + 1, "updatedAt" = NOW() WHERE id = ${storeConfig.id} RETURNING "invoicePrefix", "invoiceNumber"`
      )
      invoiceNumber = `${result.invoicePrefix}${result.invoiceNumber.toString().padStart(6, '0')}`
    }

    const sale = await tx.sale.create({
      data: {
        companyId: ctx.companyId,
        storeId: effectiveStoreId,
        customerId: customerId != null ? customerId : undefined,
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
      await tx.storeInventory.update({
        where: { storeId_productId: { storeId: effectiveStoreId, productId: item.productId } },
        data: { quantity: { decrement: item.quantity } },
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
) {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, storeId: true, status: true, items: { select: { productId: true, quantity: true } } },
  })
  if (!sale) throw new NotFoundError('Venta no encontrada')
  if (sale.status === 'CANCELLED') throw new BadRequestError('La venta ya está cancelada')
  if (sale.status === 'REFUNDED') throw new BadRequestError('No se puede cancelar una venta reembolsada')

  await prisma.$transaction(async (tx) => {
    const updated = await tx.sale.updateMany({
      where: { id, companyId: ctx.companyId },
      data: { status: 'CANCELLED' },
    })
    if (updated.count === 0) throw new NotFoundError('Venta no encontrada')
    for (const item of sale.items) {
      await tx.storeInventory.upsert({
        where: { storeId_productId: { storeId: sale.storeId, productId: item.productId } },
        create: { companyId: ctx.companyId, storeId: sale.storeId, productId: item.productId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
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
) {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, storeId: true, status: true, items: { select: { productId: true, quantity: true } } },
  })
  if (!sale) throw new NotFoundError('Venta no encontrada')
  if (sale.status === 'REFUNDED') throw new BadRequestError('La venta ya está reembolsada')
  if (sale.status === 'CANCELLED') throw new BadRequestError('No se puede reembolsar una venta cancelada')
  if (sale.status !== 'COMPLETED') {
    throw new BadRequestError(
      `No se puede reembolsar una venta con estado ${sale.status}. Solo las ventas completadas pueden ser reembolsadas.`,
    )
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.sale.updateMany({
      where: { id, companyId: ctx.companyId },
      data: { status: 'REFUNDED' },
    })
    if (updated.count === 0) throw new NotFoundError('Venta no encontrada')
    for (const item of sale.items) {
      await tx.storeInventory.upsert({
        where: { storeId_productId: { storeId: sale.storeId, productId: item.productId } },
        create: { companyId: ctx.companyId, storeId: sale.storeId, productId: item.productId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
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
