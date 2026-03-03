import { z } from 'zod'

/** Product: create body (re-export / align with core/schemas/product) */
export const productCreateBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  price: z.number(),
  cost: z.number().nullable().optional(),
  stock: z.number().optional(),
  minStock: z.number().nullable().optional(),
  maxStock: z.number().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  storeId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
})
export type ProductCreateBody = z.infer<typeof productCreateBodySchema>

/** Product: update body (partial) */
export const productUpdateBodySchema = productCreateBodySchema.partial()
export type ProductUpdateBody = z.infer<typeof productUpdateBodySchema>

/** Product: update inventory */
export const productInventoryBodySchema = z.object({
  stock: z.number(),
  minStock: z.number().optional(),
})
export type ProductInventoryBody = z.infer<typeof productInventoryBodySchema>

/** Product list response shape (for consistency) */
export type ProductResponse = {
  id: string
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  price: number
  cost: number | null
  stock: number
  minStock: number | null
  maxStock: number | null
  categoryId: string | null
  supplierId: string | null
  storeId: string | null
  active: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}
