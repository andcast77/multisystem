import { describe, it, expect, vi, beforeEach } from 'vitest'

async function freshService() {
  vi.resetModules()
  const mod = await import('../../services/presence.service.js')
  return mod.presenceService
}

const OPEN = 1

function makeMockWs() {
  return {
    readyState: OPEN,
    send: vi.fn(),
    close: vi.fn(),
    OPEN,
  }
}

describe('PresenceService — tenant isolation', () => {
  it('broadcast only delivers to clients of the matching companyId', async () => {
    const service = await freshService()
    const wsA = makeMockWs()
    const wsB = makeMockWs()

    service.join('company-A', 'user-1', 'Alice', wsA as any)
    service.join('company-B', 'user-2', 'Bob', wsB as any)

    service.broadcast('company-A', 'user:joined', { userId: 'user-1', name: 'Alice' })

    expect(wsA.send).toHaveBeenCalledOnce()
    expect(wsA.send).toHaveBeenCalledWith(expect.stringContaining('user:joined'))
    expect(wsB.send).not.toHaveBeenCalled()
  })

  it('broadcast excludes the sender (excludeUserId)', async () => {
    const service = await freshService()
    const ws1 = makeMockWs()
    const ws2 = makeMockWs()

    service.join('company-A', 'user-1', 'Alice', ws1 as any)
    service.join('company-A', 'user-2', 'Bob', ws2 as any)

    service.broadcast('company-A', 'user:joined', { userId: 'user-1' }, 'user-1')

    expect(ws1.send).not.toHaveBeenCalled()
    expect(ws2.send).toHaveBeenCalledOnce()
  })

  it('getPresence returns only users in the requested tenant', async () => {
    const service = await freshService()
    const wsA = makeMockWs()
    const wsB = makeMockWs()

    service.join('company-A', 'user-1', 'Alice', wsA as any)
    service.join('company-B', 'user-2', 'Bob', wsB as any)

    const presence = service.getPresence('company-A')
    expect(presence).toHaveLength(1)
    expect(presence[0].userId).toBe('user-1')
    expect(presence[0].name).toBe('Alice')
  })

  it('leave removes user and broadcast of user:left does not include them', async () => {
    const service = await freshService()
    const ws1 = makeMockWs()
    const ws2 = makeMockWs()

    service.join('company-A', 'user-1', 'Alice', ws1 as any)
    service.join('company-A', 'user-2', 'Bob', ws2 as any)

    service.leave('company-A', 'user-1')
    service.broadcast('company-A', 'user:left', { userId: 'user-1' })

    // user-1 is gone; only user-2 receives the broadcast
    expect(ws1.send).not.toHaveBeenCalled()
    expect(ws2.send).toHaveBeenCalledOnce()
  })

  it('join enforces per-tenant connection limit', async () => {
    const service = await freshService()
    const MAX = 100

    for (let i = 0; i < MAX; i++) {
      const ws = makeMockWs()
      const joined = service.join('company-limited', `user-${i}`, `User ${i}`, ws as any)
      expect(joined).toBe(true)
    }

    const wsExtra = makeMockWs()
    const joined = service.join('company-limited', 'user-overflow', 'Overflow', wsExtra as any)
    expect(joined).toBe(false)
  })

  it('join allows re-joining with the same userId (reconnect replaces slot)', async () => {
    const service = await freshService()
    const ws1 = makeMockWs()
    const ws2 = makeMockWs()

    service.join('company-A', 'user-1', 'Alice', ws1 as any)
    const joined = service.join('company-A', 'user-1', 'Alice', ws2 as any)

    expect(joined).toBe(true)
    expect(service.getPresence('company-A')).toHaveLength(1)
  })

  it('broadcast to unknown companyId does nothing', async () => {
    const service = await freshService()
    expect(() =>
      service.broadcast('company-UNKNOWN', 'user:joined', { userId: 'x' })
    ).not.toThrow()
  })
})
