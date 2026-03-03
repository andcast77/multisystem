import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { requireShopflowContext } from '../core/auth-context.js'
import { sendForbidden, sendServerError } from '../core/errors.js'
import { contextFromRequest } from '../core/auth-context.js'
import { validateOr400 } from '../core/validate.js'
import {
  productCreateBodySchema,
  productUpdateBodySchema,
  productInventoryBodySchema,
} from '../dto/shopflow.dto.js'
import * as shopflowService from '../services/shopflow.service.js'
import * as shopflowHelper from '../helpers/shopflow.helper.js'

function getCtx(request: FastifyRequest, requireShopflow = true) {
  return contextFromRequest(request, requireShopflow)
}

export async function listProducts(
  request: FastifyRequest<{
    Querystring: Record<string, string | undefined>
  }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const { sku, barcode, ...query } = request.query
    if (sku) {
      const product = await shopflowService.getProductBySku(ctx, sku)
      if (!product) {
        reply.code(404)
        return { success: false, error: 'Product not found' }
      }
      return { success: true, data: shopflowHelper.toProductResponse(product) }
    }
    if (barcode) {
      const product = await shopflowService.getProductByBarcode(ctx, barcode)
      if (!product) {
        reply.code(404)
        return { success: false, error: 'Product not found' }
      }
      return { success: true, data: shopflowHelper.toProductResponse(product) }
    }
    const result = await shopflowService.listProducts(ctx, request.query)
    return {
      success: true,
      data: {
        products: result.products.map(shopflowHelper.toProductResponse),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener productos')
  }
}

export async function getProductsLowStock(
  request: FastifyRequest<{ Querystring: { minStockThreshold?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const raw = request.query.minStockThreshold
    const threshold = raw != null ? parseInt(raw, 10) : undefined
    const products = await shopflowService.getLowStock(ctx, threshold)
    return { success: true, data: products.map(shopflowHelper.toProductResponse) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener productos con bajo stock')
  }
}

export async function getProductById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const product = await shopflowService.getProductById(ctx, request.params.id)
    if (!product) {
      reply.code(404)
      return { success: false, error: 'Producto no encontrado' }
    }
    return { success: true, data: shopflowHelper.toProductResponse(product) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener producto')
  }
}

export async function createProduct(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = validateOr400(reply, productCreateBodySchema, request.body)
    if (body === null) return
    const ctx = getCtx(request, true)
    const product = await shopflowService.createProduct(ctx, body)
    return { success: true, data: shopflowHelper.toProductResponse(product) }
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === '23505') {
      reply.code(409)
      return { success: false, error: 'SKU o código ya existe' }
    }
    return sendServerError(reply, error, request.log, 'Error al crear producto')
  }
}

export async function updateProduct(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const body = validateOr400(reply, productUpdateBodySchema, request.body)
    if (body === null) return
    const ctx = getCtx(request, true)
    const product = await shopflowService.updateProduct(ctx, request.params.id, body)
    if (!product) {
      reply.code(404)
      return { success: false, error: 'Producto no encontrado' }
    }
    return { success: true, data: shopflowHelper.toProductResponse(product) }
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === '23505') {
      reply.code(409)
      return { success: false, error: 'SKU o código ya existe' }
    }
    return sendServerError(reply, error, request.log, 'Error al actualizar producto')
  }
}

export async function updateProductInventory(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const body = validateOr400(reply, productInventoryBodySchema, request.body)
    if (body === null) return
    const ctx = getCtx(request, true)
    const product = await shopflowService.updateProductInventory(ctx, request.params.id, body)
    if (!product) {
      reply.code(404)
      return { success: false, error: 'Producto no encontrado' }
    }
    return { success: true, data: shopflowHelper.toProductResponse(product) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar inventario')
  }
}

export async function deleteProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const ok = await shopflowService.deleteProduct(ctx, request.params.id)
    if (!ok) {
      reply.code(404)
      return { success: false, error: 'Producto no encontrado' }
    }
    return { success: true, data: { id: request.params.id } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar producto')
  }
}

// --- Stores ---
export async function listStores(
  request: FastifyRequest<{ Querystring: { includeInactive?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const stores = await shopflowService.listStores(ctx, request.query.includeInactive)
    return { success: true, data: stores }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener tiendas')
  }
}

export async function getStoreByCode(
  request: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const code = decodeURIComponent(request.params.code)
    const store = await shopflowService.getStoreByCode(ctx, code)
    if (!store) {
      reply.code(404)
      return { success: false, error: 'Tienda no encontrada' }
    }
    return { success: true, data: store }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener tienda')
  }
}

export async function getStoreById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const store = await shopflowService.getStoreById(ctx, request.params.id)
    if (!store) {
      reply.code(404)
      return { success: false, error: 'Tienda no encontrada' }
    }
    return { success: true, data: store }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener tienda')
  }
}

export async function createStore(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    const body = request.body as { name: string; code: string; address?: string | null; phone?: string | null; email?: string | null; taxId?: string | null }
    const store = await shopflowService.createStore(ctx, body)
    return { success: true, data: store }
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2002') {
      reply.code(409)
      return { success: false, error: 'El código de tienda ya existe' }
    }
    return sendServerError(reply, error, request.log, 'Error al crear tienda')
  }
}

export async function updateStore(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    const body = request.body as Partial<{ name: string; code: string; address: string | null; phone: string | null; email: string | null; taxId: string | null; active: boolean }>
    const store = await shopflowService.updateStore(ctx, request.params.id, body)
    if (!store) {
      reply.code(404)
      return { success: false, error: 'Tienda no encontrada' }
    }
    return { success: true, data: store }
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2002') {
      reply.code(409)
      return { success: false, error: 'El código de tienda ya existe' }
    }
    return sendServerError(reply, error, request.log, 'Error al actualizar tienda')
  }
}

export async function deleteStore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    const ok = await shopflowService.deleteStore(ctx, request.params.id)
    if (!ok) {
      reply.code(404)
      return { success: false, error: 'Tienda no encontrada' }
    }
    return { success: true, data: { id: request.params.id } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar tienda')
  }
}

// --- Store config ---
export async function getStoreConfig(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getStoreConfig(ctx, reply)
}

export async function updateStoreConfig(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.updateStoreConfig(ctx, (request.body as Record<string, unknown>) ?? {}, reply)
}

export async function nextInvoiceNumber(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.nextInvoiceNumber(ctx, reply)
}

// --- Ticket config ---
export async function getTicketConfig(request: FastifyRequest<{ Querystring: { storeId?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getTicketConfig(ctx, request.query.storeId, reply)
}

export async function updateTicketConfig(request: FastifyRequest<{ Querystring: { storeId?: string }; Body: unknown }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.updateTicketConfig(ctx, (request.query as { storeId?: string }).storeId, (request.body as Record<string, unknown>) ?? {}, reply)
}

// --- Loyalty ---
export async function getLoyaltyConfig(request: FastifyRequest, reply: FastifyReply) {
  return shopflowService.getLoyaltyConfig(reply)
}

export async function updateLoyaltyConfig(request: FastifyRequest, reply: FastifyReply) {
  return shopflowService.updateLoyaltyConfig((request.body as Record<string, unknown>) ?? {}, reply)
}

export async function getCustomerPoints(request: FastifyRequest<{ Params: { customerId: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getCustomerPoints(ctx, request.params.customerId, reply)
}

export async function awardLoyaltyPoints(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const body = request.body as { customerId: string; purchaseAmount: number; saleId: string }
  return shopflowService.awardLoyaltyPoints(ctx, body, reply)
}

// --- Export ---
export async function exportJson(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.exportJson(ctx, reply, request.log)
}

export async function exportCsv(request: FastifyRequest<{ Querystring: { table?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.exportCsv(ctx, request.query.table, reply)
}

// --- User preferences ---
export async function getUserPreferences(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, false)
    const result = await shopflowService.getUserPreferences(ctx, request.params.userId, reply)
    if ('forbidden' in result) return sendForbidden(reply, result.error)
    return result
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener preferencias de usuario')
  }
}

export async function updateUserPreferences(request: FastifyRequest<{ Params: { userId: string }; Body: unknown }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, false)
    const body = (request.body as { language?: string }) ?? {}
    const result = await shopflowService.updateUserPreferences(ctx, request.params.userId, body, reply)
    if ('forbidden' in result) return sendForbidden(reply, result.error)
    return result
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar preferencias de usuario')
  }
}

// --- Push subscriptions ---
export async function listPushSubscriptions(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.listPushSubscriptions(ctx, request.params.userId, reply)
}

export async function createPushSubscription(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const body = request.body as { userId?: string; endpoint: string; p256dh: string; auth: string }
  return shopflowService.createPushSubscription(ctx, body, reply)
}

export async function deletePushSubscription(request: FastifyRequest<{ Querystring: { endpoint?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.deletePushSubscription(ctx, request.query.endpoint ?? '', reply)
}

// --- Inventory transfers ---
export async function listInventoryTransfers(request: FastifyRequest<{ Querystring: { fromStoreId?: string; toStoreId?: string; productId?: string; status?: string; page?: string; limit?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.listInventoryTransfers(ctx, request.query, reply)
}

export async function createInventoryTransfer(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const body = request.body as { fromStoreId: string; toStoreId: string; productId: string; quantity: number; notes?: string | null; createdById: string }
  return shopflowService.createInventoryTransfer(ctx, body, reply)
}

export async function completeInventoryTransfer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.completeInventoryTransfer(ctx, request.params.id, reply)
}

export async function cancelInventoryTransfer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.cancelInventoryTransfer(ctx, request.params.id, reply)
}

// --- Categories ---
export async function listCategories(
  request: FastifyRequest<{ Querystring: { search?: string; parentId?: string; includeChildren?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  return shopflowService.listCategories(ctx, request.query, reply)
}

export async function getCategoryById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getCategoryById(ctx, request.params.id, reply)
}

export async function createCategory(request: FastifyRequest<{ Body: { name: string; description?: string | null; parentId?: string | null } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.createCategory(ctx, request.body, reply)
}

export async function updateCategory(
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<{ name: string; description?: string | null; parentId?: string | null }> }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  return shopflowService.updateCategory(ctx, request.params.id, request.body, reply)
}

export async function deleteCategory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.deleteCategory(ctx, request.params.id, reply)
}

// --- Suppliers ---
export async function listSuppliers(
  request: FastifyRequest<{ Querystring: { search?: string; active?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  return shopflowService.listSuppliers(ctx, request.query, reply)
}

export async function getSupplierById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getSupplierById(ctx, request.params.id, reply)
}

export async function createSupplier(request: FastifyRequest<{ Body: Record<string, unknown> }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.createSupplier(ctx, request.body as Parameters<typeof shopflowService.createSupplier>[1], reply)
}

export async function updateSupplier(
  request: FastifyRequest<{ Params: { id: string }; Body: Record<string, unknown> }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  return shopflowService.updateSupplier(ctx, request.params.id, request.body, reply)
}

export async function deleteSupplier(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.deleteSupplier(ctx, request.params.id, reply)
}

// --- Customers ---
export async function listCustomers(request: FastifyRequest<{ Querystring: { search?: string; email?: string; phone?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.listCustomers(ctx, request.query, reply)
}

export async function getCustomerById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getCustomerById(ctx, request.params.id, reply)
}

export async function createCustomer(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const body = request.body as { name: string; email?: string | null; phone?: string | null; address?: string | null }
  return shopflowService.createCustomer(ctx, body, reply)
}

export async function updateCustomer(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.updateCustomer(ctx, request.params.id, (request.body as Record<string, unknown>) ?? {}, reply)
}

export async function deleteCustomer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.deleteCustomer(ctx, request.params.id, reply)
}

// --- Action history ---
export async function createActionHistory(request: FastifyRequest, reply: FastifyReply) {
  return shopflowService.createAction((request.body as Record<string, unknown>) ?? {}, reply)
}

export async function listActionHistory(request: FastifyRequest<{ Querystring: Record<string, string | undefined> }>, reply: FastifyReply) {
  return shopflowService.listActions((request.query ?? {}) as Record<string, string>, reply)
}

export async function getActionHistoryByUser(request: FastifyRequest<{ Params: { userId: string }; Querystring: Record<string, string | undefined> }>, reply: FastifyReply) {
  const query = { ...(request.query ?? {}), userId: request.params.userId }
  return shopflowService.listActions(query, reply)
}

export async function getActionHistoryByEntity(request: FastifyRequest<{ Params: { entityType: string; entityId: string }; Querystring: Record<string, string | undefined> }>, reply: FastifyReply) {
  const query = { ...(request.query ?? {}), entityType: request.params.entityType, entityId: request.params.entityId }
  return shopflowService.listActions(query, reply)
}

// --- Sales ---
export async function listSales(
  request: FastifyRequest<{
    Querystring: {
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
  }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    const result = await shopflowService.listSales(ctx, request.query, reply)
    if (result === null) return null
    if (!result.success) return result
    return result
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener ventas')
  }
}

export async function getSaleById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getSaleById(ctx, request.params.id, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener venta')
  }
}

export async function createSale(request: FastifyRequest<{ Body: Parameters<typeof shopflowService.createSale>[1] }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    const result = await shopflowService.createSale(ctx, request.body, reply)
    if (result !== undefined) return result
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear venta')
  }
}

export async function cancelSale(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.cancelSale(ctx, request.params.id, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al cancelar venta')
  }
}

export async function refundSale(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.refundSale(ctx, request.params.id, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al reembolsar venta')
  }
}

// --- Reports ---
export async function getStats(
  request: FastifyRequest<{ Querystring: { storeId?: string; startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getStats(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas')
  }
}

export async function getDaily(
  request: FastifyRequest<{ Querystring: { storeId?: string; days?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getDaily(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener ventas diarias')
  }
}

export async function getTopProducts(
  request: FastifyRequest<{
    Querystring: { storeId?: string; limit?: string; startDate?: string; endDate?: string; categoryId?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getTopProducts(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener productos más vendidos')
  }
}

export async function getPaymentMethods(
  request: FastifyRequest<{ Querystring: { storeId?: string; startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getPaymentMethods(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas de métodos de pago')
  }
}

export async function getInventoryReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getInventory(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas de inventario')
  }
}

export async function getTodayReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getToday(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas del día')
  }
}

export async function getWeekReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getWeek(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas de la semana')
  }
}

export async function getMonthReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getMonth(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas del mes')
  }
}

export async function getReportByUser(
  request: FastifyRequest<{
    Params: { userId: string }
    Querystring: { startDate?: string; endDate?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getByUser(ctx, request.params, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas por usuario')
  }
}

// --- Notifications ---
export async function createNotification(request: FastifyRequest<{ Body: Parameters<typeof shopflowService.createNotification>[1] }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.createNotification(ctx, request.body, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear notificación')
  }
}

export async function listNotifications(
  request: FastifyRequest<{
    Querystring: { userId?: string; type?: string; status?: string; priority?: string; page?: string; limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.listNotifications(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener notificaciones')
  }
}

export async function markNotificationAsRead(
  request: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.markNotificationAsRead(ctx, request.params.id, request.body, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al marcar notificación como leída')
  }
}

export async function markNotificationAsUnread(
  request: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.markNotificationAsUnread(ctx, request.params.id, request.body, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al marcar notificación como no leída')
  }
}

export async function markAllNotificationsRead(request: FastifyRequest<{ Body: { userId: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.markAllNotificationsRead(ctx, request.body, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al marcar todas las notificaciones como leídas')
  }
}

export async function deleteNotification(
  request: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.deleteNotification(ctx, request.params.id, request.body, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar notificación')
  }
}

export async function getUnreadNotificationCount(
  request: FastifyRequest<{ Querystring: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getUnreadCount(ctx, request.query, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener contador de no leídas')
  }
}

export async function getNotificationPreferences(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  try {
    const ctx = getCtx(request, true)
    return shopflowService.getNotificationPreferences(ctx, request.params.userId, reply)
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener preferencias de notificaciones')
  }
}

const pre = [requireAuth, requireShopflowContext]

export async function registerRoutes(fastify: FastifyInstance) {
  type Req = FastifyRequest
  type Rep = FastifyReply
  // Products
  fastify.get('/api/shopflow/products', { preHandler: pre }, (req: Req, rep: Rep) => listProducts(req, rep))
  fastify.get('/api/shopflow/products/low-stock', { preHandler: pre }, (req: Req, rep: Rep) => getProductsLowStock(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/products/:id', { preHandler: pre }, (req: Req, rep: Rep) => getProductById(req, rep))
  fastify.post('/api/shopflow/products', { preHandler: pre }, (req: Req, rep: Rep) => createProduct(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/products/:id', { preHandler: pre }, (req: Req, rep: Rep) => updateProduct(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/products/:id/inventory', { preHandler: pre }, (req: Req, rep: Rep) => updateProductInventory(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/products/:id', { preHandler: pre }, (req: Req, rep: Rep) => deleteProduct(req, rep))
  // Stores
  fastify.get('/api/shopflow/stores', { preHandler: pre }, (req: Req, rep: Rep) => listStores(req, rep))
  fastify.get<{ Params: { code: string } }>('/api/shopflow/stores/by-code/:code', { preHandler: pre }, (req: Req, rep: Rep) => getStoreByCode(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/stores/:id', { preHandler: pre }, (req: Req, rep: Rep) => getStoreById(req, rep))
  fastify.post('/api/shopflow/stores', { preHandler: pre }, (req: Req, rep: Rep) => createStore(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/stores/:id', { preHandler: pre }, (req: Req, rep: Rep) => updateStore(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/stores/:id', { preHandler: pre }, (req: Req, rep: Rep) => deleteStore(req, rep))
  // Store config
  fastify.get('/api/shopflow/store-config', { preHandler: pre }, (req: Req, rep: Rep) => getStoreConfig(req, rep))
  fastify.put('/api/shopflow/store-config', { preHandler: pre }, (req: Req, rep: Rep) => updateStoreConfig(req, rep))
  fastify.post('/api/shopflow/store-config/next-invoice-number', { preHandler: pre }, (req: Req, rep: Rep) => nextInvoiceNumber(req, rep))
  // Ticket config
  fastify.get('/api/shopflow/ticket-config', { preHandler: pre }, (req: Req, rep: Rep) => getTicketConfig(req, rep))
  fastify.put('/api/shopflow/ticket-config', { preHandler: pre }, (req: Req, rep: Rep) => updateTicketConfig(req, rep))
  // Loyalty
  fastify.get('/api/shopflow/loyalty/config', { preHandler: pre }, (req: Req, rep: Rep) => getLoyaltyConfig(req, rep))
  fastify.put('/api/shopflow/loyalty/config', { preHandler: pre }, (req: Req, rep: Rep) => updateLoyaltyConfig(req, rep))
  fastify.get<{ Params: { customerId: string } }>('/api/shopflow/loyalty/points/:customerId', { preHandler: pre }, (req: Req, rep: Rep) => getCustomerPoints(req, rep))
  fastify.post('/api/shopflow/loyalty/points/award', { preHandler: pre }, (req: Req, rep: Rep) => awardLoyaltyPoints(req, rep))
  // Customers
  fastify.get('/api/shopflow/customers', { preHandler: pre }, (req: Req, rep: Rep) => listCustomers(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/customers/:id', { preHandler: pre }, (req: Req, rep: Rep) => getCustomerById(req, rep))
  fastify.post('/api/shopflow/customers', { preHandler: pre }, (req: Req, rep: Rep) => createCustomer(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/customers/:id', { preHandler: pre }, (req: Req, rep: Rep) => updateCustomer(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/customers/:id', { preHandler: pre }, (req: Req, rep: Rep) => deleteCustomer(req, rep))
  // Categories
  fastify.get('/api/shopflow/categories', { preHandler: pre }, (req: Req, rep: Rep) => listCategories(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/categories/:id', { preHandler: pre }, (req: Req, rep: Rep) => getCategoryById(req, rep))
  fastify.post('/api/shopflow/categories', { preHandler: pre }, (req: Req, rep: Rep) => createCategory(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/categories/:id', { preHandler: pre }, (req: Req, rep: Rep) => updateCategory(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/categories/:id', { preHandler: pre }, (req: Req, rep: Rep) => deleteCategory(req, rep))
  // Suppliers
  fastify.get('/api/shopflow/suppliers', { preHandler: pre }, (req: Req, rep: Rep) => listSuppliers(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/suppliers/:id', { preHandler: pre }, (req: Req, rep: Rep) => getSupplierById(req, rep))
  fastify.post('/api/shopflow/suppliers', { preHandler: pre }, (req: Req, rep: Rep) => createSupplier(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/suppliers/:id', { preHandler: pre }, (req: Req, rep: Rep) => updateSupplier(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/suppliers/:id', { preHandler: pre }, (req: Req, rep: Rep) => deleteSupplier(req, rep))
  // Sales
  fastify.get('/api/shopflow/sales', { preHandler: pre }, (req: Req, rep: Rep) => listSales(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/sales/:id', { preHandler: pre }, (req: Req, rep: Rep) => getSaleById(req, rep))
  fastify.post('/api/shopflow/sales', { preHandler: pre }, (req: Req, rep: Rep) => createSale(req, rep))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/sales/:id/cancel', { preHandler: pre }, (req: Req, rep: Rep) => cancelSale(req, rep))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/sales/:id/refund', { preHandler: pre }, (req: Req, rep: Rep) => refundSale(req, rep))
  // Reports
  fastify.get('/api/shopflow/reports/stats', { preHandler: pre }, (req: Req, rep: Rep) => getStats(req, rep))
  fastify.get('/api/shopflow/reports/daily', { preHandler: pre }, (req: Req, rep: Rep) => getDaily(req, rep))
  fastify.get('/api/shopflow/reports/top-products', { preHandler: pre }, (req: Req, rep: Rep) => getTopProducts(req, rep))
  fastify.get('/api/shopflow/reports/payment-methods', { preHandler: pre }, (req: Req, rep: Rep) => getPaymentMethods(req, rep))
  fastify.get('/api/shopflow/reports/inventory', { preHandler: pre }, (req: Req, rep: Rep) => getInventoryReport(req, rep))
  fastify.get('/api/shopflow/reports/today', { preHandler: pre }, (req: Req, rep: Rep) => getTodayReport(req, rep))
  fastify.get('/api/shopflow/reports/week', { preHandler: pre }, (req: Req, rep: Rep) => getWeekReport(req, rep))
  fastify.get('/api/shopflow/reports/month', { preHandler: pre }, (req: Req, rep: Rep) => getMonthReport(req, rep))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/reports/by-user/:userId', { preHandler: pre }, (req: Req, rep: Rep) => getReportByUser(req, rep))
  // Notifications
  fastify.post('/api/shopflow/notifications', { preHandler: pre }, (req: Req, rep: Rep) => createNotification(req, rep))
  fastify.get('/api/shopflow/notifications', { preHandler: pre }, (req: Req, rep: Rep) => listNotifications(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/notifications/:id/read', { preHandler: pre }, (req: Req, rep: Rep) => markNotificationAsRead(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/notifications/:id/unread', { preHandler: pre }, (req: Req, rep: Rep) => markNotificationAsUnread(req, rep))
  fastify.put('/api/shopflow/notifications/read-all', { preHandler: pre }, (req: Req, rep: Rep) => markAllNotificationsRead(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/notifications/:id', { preHandler: pre }, (req: Req, rep: Rep) => deleteNotification(req, rep))
  fastify.get<{ Querystring: { userId: string } }>('/api/shopflow/notifications/unread-count', { preHandler: pre }, (req: Req, rep: Rep) => getUnreadNotificationCount(req, rep))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/notifications/preferences/:userId', { preHandler: pre }, (req: Req, rep: Rep) => getNotificationPreferences(req, rep))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/users/:userId/notification-preferences', { preHandler: pre }, (req: Req, rep: Rep) => getNotificationPreferences(req, rep))
  // Action history (no auth in original)
  fastify.post('/api/shopflow/action-history', (req: Req, rep: Rep) => createActionHistory(req, rep))
  fastify.get('/api/shopflow/action-history', (req: Req, rep: Rep) => listActionHistory(req, rep))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/action-history/user/:userId', (req: Req, rep: Rep) => getActionHistoryByUser(req, rep))
  fastify.get<{ Params: { entityType: string; entityId: string } }>('/api/shopflow/action-history/entity/:entityType/:entityId', (req: Req, rep: Rep) => getActionHistoryByEntity(req, rep))
  // Export
  fastify.get('/api/shopflow/export/json', { preHandler: pre }, (req: Req, rep: Rep) => exportJson(req, rep))
  fastify.get('/api/shopflow/export/csv', { preHandler: pre }, (req: Req, rep: Rep) => exportCsv(req, rep))
  // User preferences
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/user-preferences/:userId', { preHandler: pre }, (req: Req, rep: Rep) => getUserPreferences(req, rep))
  fastify.put<{ Params: { userId: string } }>('/api/shopflow/user-preferences/:userId', { preHandler: pre }, (req: Req, rep: Rep) => updateUserPreferences(req, rep))
  // Push subscriptions
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/users/:userId/push-subscriptions', { preHandler: pre }, (req: Req, rep: Rep) => listPushSubscriptions(req, rep))
  fastify.post('/api/shopflow/push-subscriptions', { preHandler: pre }, (req: Req, rep: Rep) => createPushSubscription(req, rep))
  fastify.delete('/api/shopflow/push-subscriptions', { preHandler: pre }, (req: Req, rep: Rep) => deletePushSubscription(req, rep))
  // Inventory transfers
  fastify.get('/api/shopflow/inventory-transfers', { preHandler: pre }, (req: Req, rep: Rep) => listInventoryTransfers(req, rep))
  fastify.post('/api/shopflow/inventory-transfers', { preHandler: pre }, (req: Req, rep: Rep) => createInventoryTransfer(req, rep))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/inventory-transfers/:id/complete', { preHandler: pre }, (req: Req, rep: Rep) => completeInventoryTransfer(req, rep))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/inventory-transfers/:id/cancel', { preHandler: pre }, (req: Req, rep: Rep) => cancelInventoryTransfer(req, rep))
}
