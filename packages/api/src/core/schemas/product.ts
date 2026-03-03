import { z } from 'zod'

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
