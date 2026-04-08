import { describe, it, expect, vi, beforeEach } from 'vitest'

const emitMock = vi.fn()

vi.mock('../../services/sse.service.js', () => ({
  presenceSseManager: {
    emit: (...args: unknown[]) => emitMock(...args),
  },
}))

async function freshService() {
  vi.resetModules()
  emitMock.mockClear()
  const mod = await import('../../services/presence.service.js')
  return mod.presenceService
}

describe('PresenceService — tenant isolation', () => {
  beforeEach(() => {
    emitMock.mockClear()
  })

  it('broadcast only targets the matching company via SSE emit', async () => {
    const service = await freshService()

    service.join('company-A', 'user-1', 'Alice')
    service.join('company-B', 'user-2', 'Bob')

    service.broadcast('company-A', 'user:joined', { userId: 'user-1', name: 'Alice' })

    expect(emitMock).toHaveBeenCalledTimes(1)
    expect(emitMock).toHaveBeenCalledWith('company-A', 'user:joined', { userId: 'user-1', name: 'Alice' }, undefined)
  })

  it('broadcast excludes the sender (excludeUserId)', async () => {
    const service = await freshService()

    service.join('company-A', 'user-1', 'Alice')
    service.join('company-A', 'user-2', 'Bob')

    service.broadcast('company-A', 'user:joined', { userId: 'user-1' }, 'user-1')

    expect(emitMock).toHaveBeenCalledWith('company-A', 'user:joined', { userId: 'user-1' }, 'user-1')
  })

  it('getPresence returns only users in the requested tenant', async () => {
    const service = await freshService()

    service.join('company-A', 'user-1', 'Alice')
    service.join('company-B', 'user-2', 'Bob')

    const presence = service.getPresence('company-A')
    expect(presence).toHaveLength(1)
    expect(presence[0].userId).toBe('user-1')
    expect(presence[0].name).toBe('Alice')
  })

  it('leave removes user; subsequent broadcast does not include them in state', async () => {
    const service = await freshService()

    service.join('company-A', 'user-1', 'Alice')
    service.join('company-A', 'user-2', 'Bob')

    service.leave('company-A', 'user-1')
    service.broadcast('company-A', 'user:left', { userId: 'user-1' })

    expect(emitMock).toHaveBeenCalledWith('company-A', 'user:left', { userId: 'user-1' }, undefined)
    expect(service.getPresence('company-A')).toHaveLength(1)
    expect(service.getPresence('company-A')[0].userId).toBe('user-2')
  })

  it('join enforces per-tenant connection limit', async () => {
    const service = await freshService()
    const MAX = 100

    for (let i = 0; i < MAX; i++) {
      const joined = service.join('company-limited', `user-${i}`, `User ${i}`)
      expect(joined).toBe(true)
    }

    const joined = service.join('company-limited', 'user-overflow', 'Overflow')
    expect(joined).toBe(false)
  })

  it('join allows re-joining with the same userId (reconnect replaces slot)', async () => {
    const service = await freshService()

    service.join('company-A', 'user-1', 'Alice')
    const joined = service.join('company-A', 'user-1', 'Alice')

    expect(joined).toBe(true)
    expect(service.getPresence('company-A')).toHaveLength(1)
  })

  it('broadcast to unknown companyId does not throw', async () => {
    const service = await freshService()
    expect(() =>
      service.broadcast('company-UNKNOWN', 'user:joined', { userId: 'x' })
    ).not.toThrow()
    expect(emitMock).toHaveBeenCalledWith('company-UNKNOWN', 'user:joined', { userId: 'x' }, undefined)
  })
})
