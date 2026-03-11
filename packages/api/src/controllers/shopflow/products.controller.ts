import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import {
  productCreateBodySchema,
  productUpdateBodySchema,
  productInventoryBodySchema,
} from '../../dto/shopflow.dto.js'
import { NotFoundError } from '../../common/errors/app-error.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import * as shopflowHelper from '../../helpers/shopflow.helper.js'
import { getCtx, handle, pre } from './_shared.js'

async function listProducts(
  request: FastifyRequest<{ Querystring: Record<string, string | undefined> }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const { sku, barcode, ...query } = request.query
  if (sku) {
    const product = await shopflowService.getProductBySku(ctx, sku)
    if (!product) throw new NotFoundError('Product not found')
    return ok(shopflowHelper.toProductResponse(product))
  }
  if (barcode) {
    const product = await shopflowService.getProductByBarcode(ctx, barcode)
    if (!product) throw new NotFoundError('Product not found')
    return ok(shopflowHelper.toProductResponse(product))
  }
  const result = await shopflowService.listProducts(ctx, request.query)
  return ok({
    products: result.products.map(shopflowHelper.toProductResponse),
    pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  })
}

async function getProductsLowStock(
  request: FastifyRequest<{ Querystring: { minStockThreshold?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const raw = request.query.minStockThreshold
  const threshold = raw != null ? parseInt(raw, 10) : undefined
  const products = await shopflowService.getLowStock(ctx, threshold)
  return ok(products.map(shopflowHelper.toProductResponse))
}

async function getProductById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const product = await shopflowService.getProductById(ctx, request.params.id)
  if (!product) throw new NotFoundError('Producto no encontrado')
  return ok(shopflowHelper.toProductResponse(product))
}

async function createProduct(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(productCreateBodySchema, request.body)
  const ctx = getCtx(request, true)
  const product = await shopflowService.createProduct(ctx, body)
  return ok(shopflowHelper.toProductResponse(product))
}

async function updateProduct(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateBody(productUpdateBodySchema, request.body)
  const ctx = getCtx(request, true)
  const product = await shopflowService.updateProduct(ctx, request.params.id, body)
  if (!product) throw new NotFoundError('Producto no encontrado')
  return ok(shopflowHelper.toProductResponse(product))
}

async function updateProductInventory(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateBody(productInventoryBodySchema, request.body)
  const ctx = getCtx(request, true)
  const product = await shopflowService.updateProductInventory(ctx, request.params.id, body)
  if (!product) throw new NotFoundError('Producto no encontrado')
  return ok(shopflowHelper.toProductResponse(product))
}

async function deleteProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  await shopflowService.deleteProduct(ctx, request.params.id)
  return ok({ id: request.params.id })
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/products', { preHandler: pre }, handle(listProducts))
  fastify.get('/api/shopflow/products/low-stock', { preHandler: pre }, handle(getProductsLowStock))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/products/:id', { preHandler: pre }, handle(getProductById))
  fastify.post('/api/shopflow/products', { preHandler: pre }, handle(createProduct))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/products/:id', { preHandler: pre }, handle(updateProduct))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/products/:id/inventory', { preHandler: pre }, handle(updateProductInventory))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/products/:id', { preHandler: pre }, handle(deleteProduct))
}
