import type { ProductResponse } from '../dto/shopflow.dto.js'

type ProductRow = {
  id: string
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  price: number
  cost: number | null
  categoryId: string | null
  supplierId: string | null
  active: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export function toProductResponse(row: ProductRow): ProductResponse {
  return { ...row }
}
