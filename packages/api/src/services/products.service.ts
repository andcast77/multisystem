import type { CompanyContext } from '../core/auth-context.js'
import { createRepositories } from '../repositories/index.js'
import { BadRequestError } from '../common/errors/app-error.js'
import type { ProductRow, UnitRow, ProductSearchQuery, ProductCreateInput, ProductUpdateInput } from '../repositories/product.repository.js'

function repos(ctx: CompanyContext) {
  return createRepositories(ctx.companyId)
}

export type { ProductRow }
export type { UnitRow }

export async function listProductUnits(ctx: CompanyContext): Promise<UnitRow[]> {
  return repos(ctx).products.listActiveUnits()
}

export async function getProductBySku(ctx: CompanyContext, sku: string): Promise<ProductRow | null> {
  return repos(ctx).products.findBySku(sku)
}

export async function getProductByBarcode(ctx: CompanyContext, barcode: string): Promise<ProductRow | null> {
  return repos(ctx).products.findByBarcode(barcode)
}

export async function getProductById(ctx: CompanyContext, id: string): Promise<ProductRow | null> {
  return repos(ctx).products.findById(id)
}

export async function listProducts(ctx: CompanyContext, query: ProductSearchQuery) {
  const result = await repos(ctx).products.search(query)
  return {
    products: result.items,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }
}

export async function createProduct(ctx: CompanyContext, body: ProductCreateInput): Promise<ProductRow> {
  try {
    return await repos(ctx).products.create(body)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_UNIT') {
      throw new BadRequestError('Unidad de medida invalida o inactiva')
    }
    throw error
  }
}

export async function getLowStock(ctx: CompanyContext, minStockThreshold?: number): Promise<ProductRow[]> {
  return repos(ctx).products.findLowStock(minStockThreshold)
}

export async function updateProduct(ctx: CompanyContext, id: string, body: ProductUpdateInput): Promise<ProductRow | null> {
  try {
    return await repos(ctx).products.update(id, body)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_UNIT') {
      throw new BadRequestError('Unidad de medida invalida o inactiva')
    }
    throw error
  }
}

export async function deleteProduct(ctx: CompanyContext, id: string): Promise<boolean> {
  return repos(ctx).products.delete(id)
}
