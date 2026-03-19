import { TenantScopedRepository } from '../common/database/index.js'

export type StoreRow = {
  id: string
  companyId: string
  name: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  taxId: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type StoreCreateInput = {
  name: string
  code: string
  address?: string | null
  phone?: string | null
  email?: string | null
  taxId?: string | null
}

export class StoreRepository extends TenantScopedRepository {

  async findAll(opts?: { includeInactive?: boolean; userId?: string; fullAccess?: boolean }): Promise<StoreRow[]> {
    const activeFilter = opts?.includeInactive ? {} : { active: true }
    const userFilter = opts?.fullAccess ? {} : { userStores: { some: { userId: opts?.userId } } }

    return this.db.store.findMany({
      where: { ...this.tenantWhere, ...activeFilter, ...userFilter },
      orderBy: { name: 'asc' },
    }) as Promise<StoreRow[]>
  }

  async findById(id: string, opts?: { userId?: string; fullAccess?: boolean }): Promise<StoreRow | null> {
    const userFilter = opts?.fullAccess ? {} : { userStores: { some: { userId: opts?.userId } } }
    return this.db.store.findFirst({
      where: { ...this.tenantWhere, id, ...userFilter },
    }) as Promise<StoreRow | null>
  }

  async findByCode(code: string, opts?: { userId?: string; fullAccess?: boolean }): Promise<StoreRow | null> {
    const userFilter = opts?.fullAccess ? {} : { userStores: { some: { userId: opts?.userId } } }
    return this.db.store.findFirst({
      where: { ...this.tenantWhere, code, ...userFilter },
    }) as Promise<StoreRow | null>
  }

  async create(input: StoreCreateInput): Promise<StoreRow> {
    return this.db.store.create({
      data: { companyId: this.tenantId, ...input },
    }) as Promise<StoreRow>
  }

  async update(id: string, input: Partial<StoreCreateInput & { active: boolean }>): Promise<StoreRow | null> {
    const existing = await this.db.store.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null
    return this.db.store.update({ where: { id }, data: input }) as Promise<StoreRow>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.store.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    await this.db.store.delete({ where: { id } })
    return true
  }

  async findLatestConfig() {
    return this.db.storeConfig.findFirst({
      where: { ...this.tenantWhere },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createConfig(input: {
    name: string
    currency: 'USD'
    taxRate: number
    lowStockAlert: number
    invoicePrefix: string
    invoiceNumber: number
    allowSalesWithoutStock: boolean
    address?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
  }) {
    return this.db.storeConfig.create({
      data: {
        companyId: this.tenantId,
        name: input.name,
        currency: input.currency,
        taxRate: input.taxRate,
        lowStockAlert: input.lowStockAlert,
        invoicePrefix: input.invoicePrefix,
        invoiceNumber: input.invoiceNumber,
        allowSalesWithoutStock: input.allowSalesWithoutStock,
        address: input.address ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        taxId: input.taxId ?? null,
      },
    })
  }

  async updateConfigById(id: string, data: Record<string, unknown>) {
    return this.db.storeConfig.update({
      where: { id },
      // Prisma accepts partial update input and keeps this tenant-scoped by fetched id.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })
  }

  async incrementInvoiceNumberAndGet(configId: string) {
    const [result] = await this.db.$queryRaw<[{ invoicePrefix: string; invoiceNumber: number }]>`
      UPDATE store_configs
      SET "invoiceNumber" = "invoiceNumber" + 1, "updatedAt" = NOW()
      WHERE id = ${configId}
      RETURNING "invoicePrefix", "invoiceNumber"
    `
    return result
  }

  async findLatestTicketConfig(storeId?: string) {
    return this.db.ticketConfig.findFirst({
      where: { ...this.tenantWhere, storeId: storeId ?? null },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createTicketConfig(input: {
    storeId: string | null
    ticketType: 'TICKET'
    thermalWidth: number
    fontSize: number
    copies: number
    autoPrint: boolean
    header?: string | null
    description?: string | null
    logoUrl?: string | null
    footer?: string | null
    defaultPrinterName?: string | null
  }) {
    return this.db.ticketConfig.create({
      data: {
        companyId: this.tenantId,
        storeId: input.storeId,
        ticketType: input.ticketType,
        thermalWidth: input.thermalWidth,
        fontSize: input.fontSize,
        copies: input.copies,
        autoPrint: input.autoPrint,
        header: input.header ?? null,
        description: input.description ?? null,
        logoUrl: input.logoUrl ?? null,
        footer: input.footer ?? null,
        defaultPrinterName: input.defaultPrinterName ?? null,
      },
    })
  }

  async updateTicketConfigById(id: string, data: Record<string, unknown>) {
    return this.db.ticketConfig.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })
  }
}
