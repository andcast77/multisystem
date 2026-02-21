export type Company = {
  id: string;
  name: string;
  parentId: string | null;
  ownerUserId: string | null;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
  } | null;
  workifyEnabled: boolean;
  shopflowEnabled: boolean;
  technicalServicesEnabled: boolean;
  isActive: boolean;
  logo: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyStats = {
  totalMembers: number;
  ownerCount: number;
  adminCount: number;
  userCount: number;
  lastMember: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    membershipRole: string;
    createdAt: string;
  } | null;
};

export type CompanyMember = {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  membershipRole: "OWNER" | "ADMIN" | "USER";
  createdAt: string;
  storeIds?: string[];
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  companyId?: string;
  membershipRole?: "OWNER" | "ADMIN" | "USER";
  isSuperuser?: boolean;
  company?: {
    id: string;
    name: string;
    workifyEnabled: boolean;
    shopflowEnabled: boolean;
    technicalServicesEnabled: boolean;
  };
};

export type UpdateCompanyInput = {
  name?: string;
  workifyEnabled?: boolean;
  shopflowEnabled?: boolean;
  technicalServicesEnabled?: boolean;
  logo?: string;
  taxId?: string;
  address?: string;
  phone?: string;
};
