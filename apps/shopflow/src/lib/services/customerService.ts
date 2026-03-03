import { shopflowApi, type ApiResult } from '@/lib/api/client'
import { ApiError, ErrorCodes } from '@/lib/utils/errors'
import type { CreateCustomerInput, UpdateCustomerInput, CustomerQueryInput } from '@/lib/validations/customer'

export async function getCustomers(query: CustomerQueryInput = {}) {
  const { search, email, phone } = query

  // Build query parameters
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (email) params.append('email', email)
  if (phone) params.append('phone', phone)

  const response = await shopflowApi.get<ApiResult<any[]>>(
    `/customers?${params.toString()}`
  )

  if (!response.success) {
    throw new ApiError(500, response.error || 'Error al obtener clientes', ErrorCodes.INTERNAL_ERROR)
  }

  return response.data
}

export async function getCustomerById(id: string) {
  const response = await shopflowApi.get<ApiResult<any>>(
    `/customers/${id}`
  )

  if (!response.success) {
    throw new ApiError(404, response.error || 'Customer not found', ErrorCodes.NOT_FOUND)
  }

  return response.data
}

export async function searchCustomers(searchTerm: string, limit = 10) {
  const params = new URLSearchParams({ search: searchTerm })
  const response = await shopflowApi.get<ApiResult<any[]>>(
    `/customers?${params.toString()}`
  )

  if (!response.success) {
    throw new ApiError(500, response.error || 'Error al buscar clientes', ErrorCodes.INTERNAL_ERROR)
  }

  // Limit results on client side since API doesn't support limit parameter yet
  return response.data.slice(0, limit).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
  }))
}

export async function createCustomer(data: CreateCustomerInput) {
  const response = await shopflowApi.post<ApiResult<any>>(
    '/customers',
    data
  )

  if (!response.success) {
    throw new ApiError(400, response.error || 'Error al crear cliente', ErrorCodes.VALIDATION_ERROR)
  }

  return response.data
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const response = await shopflowApi.put<ApiResult<any>>(
    `/customers/${id}`,
    data
  )

  if (!response.success) {
    if (response.error?.includes('no encontrado')) {
      throw new ApiError(404, 'Customer not found', ErrorCodes.NOT_FOUND)
    }
    throw new ApiError(400, response.error || 'Error al actualizar cliente', ErrorCodes.VALIDATION_ERROR)
  }

  return response.data
}

export async function deleteCustomer(id: string) {
  const response = await shopflowApi.delete<ApiResult<any>>(
    `/customers/${id}`
  )

  if (!response.success) {
    if (response.error?.includes('no encontrado')) {
      throw new ApiError(404, 'Customer not found', ErrorCodes.NOT_FOUND)
    }
    if (response.error?.includes('tiene ventas')) {
      throw new ApiError(
        400,
        'Cannot delete customer that has sales. Sales are preserved for historical records.',
        ErrorCodes.VALIDATION_ERROR
      )
    }
    throw new ApiError(400, response.error || 'Error al eliminar cliente', ErrorCodes.VALIDATION_ERROR)
  }

  return response.data || { success: true }
}

