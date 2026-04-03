import type { ServerResponse } from 'http'

const MAX_CLIENTS_PER_TENANT = 50

interface SseClient {
  res: ServerResponse
  keepaliveTimer: ReturnType<typeof setInterval>
}

class SseManager {
  private clients = new Map<string, Set<SseClient>>()

  addClient(companyId: string, res: ServerResponse): SseClient {
    const set = this.clients.get(companyId) ?? new Set<SseClient>()
    if (!this.clients.has(companyId)) {
      this.clients.set(companyId, set)
    }

    if (set.size >= MAX_CLIENTS_PER_TENANT) {
      res.end()
      throw new Error(`SSE connection limit reached for tenant ${companyId}`)
    }

    const client: SseClient = {
      res,
      keepaliveTimer: setInterval(() => {
        try {
          res.write(': keepalive\n\n')
        } catch {
          this.removeClient(companyId, client)
        }
      }, 30_000),
    }

    set.add(client)
    return client
  }

  removeClient(companyId: string, client: SseClient): void {
    clearInterval(client.keepaliveTimer)
    const set = this.clients.get(companyId)
    if (set) {
      set.delete(client)
      if (set.size === 0) {
        this.clients.delete(companyId)
      }
    }
  }

  emit(companyId: string, event: string, data: unknown): void {
    const set = this.clients.get(companyId)
    if (!set || set.size === 0) return

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const dead: SseClient[] = []

    for (const client of set) {
      try {
        client.res.write(payload)
      } catch {
        dead.push(client)
      }
    }

    for (const client of dead) {
      this.removeClient(companyId, client)
    }
  }

  clientCount(companyId: string): number {
    return this.clients.get(companyId)?.size ?? 0
  }
}

export const sseManager = new SseManager()
