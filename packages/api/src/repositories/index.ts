import type { PrismaClient } from '@multisystem/database'
import { prisma } from '../db/index.js'
import { ProductRepository } from './product.repository.js'
import { StoreRepository } from './store.repository.js'
import { CustomerRepository } from './customer.repository.js'
import { CategoryRepository } from './category.repository.js'
import { SupplierRepository } from './supplier.repository.js'
import { StoreInventoryRepository } from './store-inventory.repository.js'

export { ProductRepository, type ProductRow, type ProductSearchQuery, type ProductCreateInput, type ProductUpdateInput } from './product.repository.js'
export { StoreRepository, type StoreRow, type StoreCreateInput } from './store.repository.js'
export { CustomerRepository, type CustomerRow } from './customer.repository.js'
export { CategoryRepository, type CategoryRow } from './category.repository.js'
export { SupplierRepository, type SupplierRow } from './supplier.repository.js'
export { StoreInventoryRepository, type StoreInventoryRow } from './store-inventory.repository.js'

export type Repositories = {
  products: ProductRepository
  stores: StoreRepository
  customers: CustomerRepository
  categories: CategoryRepository
  suppliers: SupplierRepository
  inventory: StoreInventoryRepository
}

/**
 * Create a full set of tenant-scoped repositories.
 * Use this in controllers/services after resolving the tenant context.
 * Pass a transaction client to share a single transaction across repos.
 */
export function createRepositories(tenantId: string, db?: PrismaClient): Repositories {
  const client = db ?? prisma
  return {
    products: new ProductRepository(client, tenantId),
    stores: new StoreRepository(client, tenantId),
    customers: new CustomerRepository(client, tenantId),
    categories: new CategoryRepository(client, tenantId),
    suppliers: new SupplierRepository(client, tenantId),
    inventory: new StoreInventoryRepository(client, tenantId),
  }
}
