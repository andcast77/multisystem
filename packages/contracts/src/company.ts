export type CompanyModules = {
  workify: boolean
  shopflow: boolean
  techservices: boolean
}

export type CompanyRow = {
  id: string
  name: string
  modules: CompanyModules
  membershipRole?: string | null
}
