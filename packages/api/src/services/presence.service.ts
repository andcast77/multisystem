import type { WebSocket } from '@fastify/websocket'

const MAX_CLIENTS_PER_TENANT = 100

export interface PresenceUser {
  userId: string
  name: string
  connectedAt: string
}

interface PresenceClient {
  userId: string
  name: string
  connectedAt: string
  ws: WebSocket
}

class PresenceService {
  private tenants = new Map<string, Map<string, PresenceClient>>()

  join(companyId: string, userId: string, name: string, ws: WebSocket): boolean {
    let users = this.tenants.get(companyId)
    if (!users) {
      users = new Map()
      this.tenants.set(companyId, users)
    }

    if (users.size >= MAX_CLIENTS_PER_TENANT && !users.has(userId)) {
      return false
    }

    users.set(userId, { userId, name, connectedAt: new Date().toISOString(), ws })
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
    const users = this.tenants.get(companyId)
    if (!users) return

    const payload = JSON.stringify({ event, data })
    const dead: string[] = []

    for (const [uid, client] of users) {
      if (uid === excludeUserId) continue
      try {
        if (client.ws.readyState === client.ws.OPEN) {
          client.ws.send(payload)
        } else {
          dead.push(uid)
        }
      } catch {
        dead.push(uid)
      }
    }

    for (const uid of dead) {
      users.delete(uid)
    }
    if (users.size === 0) {
      this.tenants.delete(companyId)
    }
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
