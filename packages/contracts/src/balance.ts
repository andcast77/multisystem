export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
export type AccountNature = 'DEBIT' | 'CREDIT'
export type EntryStatus = 'DRAFT' | 'POSTED'
export type FiscalPeriodStatus = 'OPEN' | 'CLOSED'

export type AccountDto = {
  id: string
  code: string
  name: string
  category: AccountCategory
  nature: AccountNature
  level: number
  parentId: string | null
  children?: AccountDto[]
  isActive: boolean
  description: string | null
  companyId: string
  balance?: string
}

export type CreateAccountInput = {
  code: string
  name: string
  category: AccountCategory
  nature: AccountNature
  level: number
  parentId?: string
  description?: string
}

export type UpdateAccountInput = Partial<CreateAccountInput> & {
  isActive?: boolean
}

export type CostCenterDto = {
  id: string
  code: string
  name: string
  isActive: boolean
  companyId: string
}

export type CreateCostCenterInput = {
  code: string
  name: string
}

export type UpdateCostCenterInput = Partial<CreateCostCenterInput> & {
  isActive?: boolean
}

export type JournalEntryLineDto = {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  debitAmount: string
  creditAmount: string
  description: string | null
  costCenterId: string | null
}

export type JournalEntryDto = {
  id: string
  date: string
  description: string
  reference: string | null
  fiscalPeriodId: string | null
  status: EntryStatus
  lines: JournalEntryLineDto[]
  createdById: string
  createdByName?: string
  approvedById: string | null
  approvedBy?: string | null
  approvedAt: string | null
  companyId: string
  createdAt: string
  updatedAt: string
}

export type CreateJournalEntryInput = {
  date: string
  description: string
  reference?: string
  fiscalPeriodId?: string
  lines: {
    accountId: string
    debitAmount: number
    creditAmount: number
    description?: string
    costCenterId?: string
  }[]
}

export type FiscalYearDto = {
  id: string
  year: number
  isActive: boolean
  periods: FiscalPeriodDto[]
}

export type FiscalPeriodDto = {
  id: string
  fiscalYearId: string
  month: number
  year: number
  status: FiscalPeriodStatus
  closedAt: string | null
}

export type TrialBalanceEntry = {
  accountId: string
  accountCode: string
  accountName: string
  category: AccountCategory
  debitAmount: string
  creditAmount: string
  balance: string
}

export type BalanceSheetEntry = {
  accountId: string
  accountCode: string
  accountName: string
  category: AccountCategory
  balance: string
}

export type IncomeStatementEntry = {
  accountId: string
  accountCode: string
  accountName: string
  category: AccountCategory
  balance: string
}
