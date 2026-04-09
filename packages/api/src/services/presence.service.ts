import { presenceSseManager } from './sse.service.js'

const MAX_USERS_PER_TENANT = 100

export interface PresenceUser {
  userId: string
  name: string
  connectedAt: string
}

interface PresenceEntry {
  userId: string
  name: string
  connectedAt: string
}

class PresenceService {
  private tenants = new Map<string, Map<string, PresenceEntry>>()

  join(companyId: string, userId: string, name: string): boolean {
    let users = this.tenants.get(companyId)
    if (!users) {
      users = new Map()
      this.tenants.set(companyId, users)
    }

    if (users.size >= MAX_USERS_PER_TENANT && !users.has(userId)) {
      return false
    }

    users.set(userId, { userId, name, connectedAt: new Date().toISOString() })
    return true
  }

  leave(companyId: string, userId: string): void {
    const users = this.tenants.get(companyId)
    if (!users) return
    users.delete(userId)
    if (users.size === 0) {
      this.tenants.delete(companyId)
    }
  }

  broadcast(companyId: string, event: string, data: unknown, excludeUserId?: string): void {
    presenceSseManager.emit(companyId, event, data, excludeUserId)
  }

  getPresence(companyId: string): PresenceUser[] {
    const users = this.tenants.get(companyId)
    if (!users) return []
    return Array.from(users.values()).map(({ userId, name, connectedAt }) => ({
      userId,
      name,
      connectedAt,
    }))
  }
}

export const presenceService = new PresenceService()
