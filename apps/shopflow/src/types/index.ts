// Local type definitions (replacing @prisma/client imports)
// These match the Prisma schema but are defined locally for the frontend

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  SUPERVISOR = 'SUPERVISOR',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum TicketType {
  TICKET = 'TICKET',
  SHEET = 'SHEET',
}

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  IMPORTANT_SALE = 'IMPORTANT_SALE',
  PENDING_TASK = 'PENDING_TASK',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  CUSTOM = 'CUSTOM',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum LoyaltyPointType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CONFIGURE = 'CONFIGURE',
}

export enum EntityType {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  CUSTOMER = 'CUSTOMER',
  SALE = 'SALE',
  INVENTORY = 'INVENTORY',
  SUPPLIER = 'SUPPLIER',
  STORE_CONFIG = 'STORE_CONFIG',
  TICKET_CONFIG = 'TICKET_CONFIG',
}

// Base types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number | null
  stock: number
  minStock: number | null
  categoryId: string | null
  categoryName?: string | null
  barcode: string | null
  sku: string | null
  supplierId?: string | null
  storeId?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description: string | null
  parentId?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  loyaltyPoints: number
  createdAt: Date
  updatedAt: Date
  lastSyncedAt?: number
  localModifiedAt?: number
}

export interface Sale {
  id: string
  customerId: string | null
  userId: string
  total: number
  subtotal: number
  tax: number
  discount: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  notes: string | null
  invoiceNumber: string | null
  paidAmount: number | null
  change: number | null
  createdAt: Date
  updatedAt: Date
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  price: number
  discount: number
  subtotal: number
  createdAt: Date
  updatedAt: Date
}

export interface StoreConfig {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  taxId: string | null
  taxRate: number
  currency: string
  logoUrl: string | null
  lowStockAlert: number
  invoicePrefix: string
  invoiceNumber: number
  allowSalesWithoutStock: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TicketConfig {
  id: string
  storeId: string | null
  ticketType: TicketType
  header: string | null
  description: string | null
  logoUrl: string | null
  footer: string | null
  defaultPrinterName: string | null
  thermalWidth: number | null
  fontSize: number
  copies: number
  autoPrint: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  id: string
  userId: string
  language: string
  theme: string
  notifications: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  contactPerson: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  message: string
  link: string | null
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreference {
  id: string
  userId: string
  emailEnabled: boolean
  inAppEnabled: boolean
  pushEnabled: boolean
  emailLowStock?: boolean
  inAppLowStock?: boolean
  pushLowStock?: boolean
  emailImportantSales?: boolean
  inAppImportantSales?: boolean
  pushImportantSales?: boolean
  emailPendingTasks?: boolean
  inAppPendingTasks?: boolean
  pushPendingTasks?: boolean
  emailSecurityAlerts?: boolean
  inAppSecurityAlerts?: boolean
  pushSecurityAlerts?: boolean
  createdAt: Date
  updatedAt: Date
}

// Extended types
export interface UserWithRole {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
}

// LoginCredentials is now defined in src/lib/validations/auth.ts as LoginInput
// Re-export for backward compatibility
export type { LoginInput as LoginCredentials } from '@/lib/validations/auth'

export interface AuthResponse {
  user: UserWithRole
  token: string
}
