import { shopflowApi, type ApiResult } from '@/lib/api/client'
import { ApiError, ErrorCodes } from '@/lib/utils/errors'
import type { CreateSaleInput, SaleQueryInput, SaleItemInput } from '@/lib/validations/sale'
import { getStoreConfig, getNextInvoiceNumber } from './storeConfigService'
import { getProductById } from './productService'
import { awardPointsForPurchase } from './loyaltyService'
import { SaleStatus } from '@/types'

export async function getSales(query: SaleQueryInput = { page: 1, limit: 20 }) {
  const {
    storeId,
    customerId,
    userId,
    status,
    paymentMethod,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = query

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (storeId) params.append('storeId', storeId)
  if (customerId) params.append('customerId', customerId)
  if (userId) params.append('userId', userId)
  if (status) params.append('status', status)
  if (paymentMethod) params.append('paymentMethod', paymentMethod)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const response = await shopflowApi.get<ApiResult<{ sales: any[]; pagination: any }>>(
    `/sales?${params.toString()}`
  )

  if (!response.success) {
    throw new ApiError(500, response.error || 'Error al obtener ventas', ErrorCodes.INTERNAL_ERROR)
  }

  return response.data
}

export async function getSaleById(id: string) {
  const response = await shopflowApi.get<{ success: boolean; data: any; error?: string }>(
    `/sales/${id}`
  )

  if (!response.success) {
    throw new ApiError(404, response.error || 'Sale not found', ErrorCodes.NOT_FOUND)
  }

  return response.data
}

export async function createSale(userId: string, data: CreateSaleInput) {
  // Validate all products exist and have enough stock
  const productChecks = await Promise.all(
    data.items.map(async (item: SaleItemInput) => {
      const product = await getProductById(item.productId) as { active: boolean; name: string; stock: number }
      if (!product.active) {
        throw new ApiError(400, `Product ${product.name} is not active`, ErrorCodes.VALIDATION_ERROR)
      }
      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          ErrorCodes.VALIDATION_ERROR
        )
      }
      return { product, item }
    })
  )

  // Validate customer exists (if provided)
  if (data.customerId) {
    const { getCustomerById } = await import('./customerService')
    try {
      await getCustomerById(data.customerId)
    } catch {
      throw new ApiError(404, 'Customer not found', ErrorCodes.NOT_FOUND)
    }
  }

  // Get store config for tax rate and invoice number
  const storeConfig = await getStoreConfig()
  const taxRate = data.taxRate ?? storeConfig.taxRate

  // Calculate totals
  let subtotal = 0
  productChecks.map(({ product, item }) => {
    const itemSubtotal = (item.price * item.quantity) - (item.discount || 0)
    subtotal += itemSubtotal
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      subtotal: itemSubtotal,
      product,
    }
  })

  // Apply global discount
  const discount = data.discount || 0
  const subtotalAfterDiscount = subtotal - discount

  // Calculate tax (taxRate is stored as decimal, e.g., 0.1 = 10%)
  const tax = subtotalAfterDiscount * taxRate

  // Calculate total
  const total = subtotalAfterDiscount + tax

  // Validate payment
  if (data.paidAmount < total) {
    throw new ApiError(
      400,
      `Paid amount (${data.paidAmount}) is less than total (${total})`,
      ErrorCodes.VALIDATION_ERROR
    )
  }

  // Reserve next invoice number (API may use it when creating the sale)
  await getNextInvoiceNumber()

  // Create sale via API (X-Store-Id is sent by client from StoreContext when set)
  const response = await shopflowApi.post<ApiResult<any>>(
    '/sales',
    {
      storeId: data.storeId ?? null,
      customerId: data.customerId ?? null,
      userId,
      items: data.items,
      paymentMethod: data.paymentMethod,
      paidAmount: data.paidAmount,
      discount,
      taxRate,
      notes: data.notes ?? null,
    }
  )

  if (!response.success) {
    throw new ApiError(400, response.error || 'Error al crear venta', ErrorCodes.VALIDATION_ERROR)
  }

  const sale = response.data

  // Award loyalty points if customer exists and sale was successful
  if (sale.customerId) {
    try {
      await awardPointsForPurchase(sale.customerId, sale.total, sale.id)
    } catch (error) {
      // Log error but don't fail the sale if points awarding fails
      console.error('Failed to award loyalty points:', error)
    }
  }

  return sale
}

export async function cancelSale(id: string) {
  const sale = await getSaleById(id)

  if (sale.status === SaleStatus.CANCELLED) {
    throw new ApiError(400, 'Sale is already cancelled', ErrorCodes.VALIDATION_ERROR)
  }

  if (sale.status === SaleStatus.REFUNDED) {
    throw new ApiError(400, 'Cannot cancel a refunded sale', ErrorCodes.VALIDATION_ERROR)
  }

  const response = await shopflowApi.post<{ success: boolean; data: any; error?: string }>(
    `/sales/${id}/cancel`,
    {}
  )

  if (!response.success) {
    throw new ApiError(400, response.error || 'Error al cancelar venta', ErrorCodes.VALIDATION_ERROR)
  }

  return response.data
}

export async function refundSale(id: string) {
  const sale = await getSaleById(id)

  if (sale.status === SaleStatus.REFUNDED) {
    throw new ApiError(400, 'Sale is already refunded', ErrorCodes.VALIDATION_ERROR)
  }

  if (sale.status === SaleStatus.CANCELLED) {
    throw new ApiError(400, 'Cannot refund a cancelled sale', ErrorCodes.VALIDATION_ERROR)
  }

  if (sale.status !== SaleStatus.COMPLETED) {
    throw new ApiError(
      400,
      `Cannot refund a sale with status ${sale.status}. Only completed sales can be refunded.`,
      ErrorCodes.VALIDATION_ERROR
    )
  }

  const response = await shopflowApi.post<{ success: boolean; data: any; error?: string }>(
    `/sales/${id}/refund`,
    {}
  )

  if (!response.success) {
    throw new ApiError(400, response.error || 'Error al reembolsar venta', ErrorCodes.VALIDATION_ERROR)
  }

  return response.data
}
