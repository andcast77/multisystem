import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the singleton after vi.resetModules so each test gets a fresh instance
async function freshManager() {
  vi.resetModules()
  const mod = await import('../../services/sse.service.js')
  return mod.sseManager
}

function makeMockRes() {
  return {
    write: vi.fn(),
    end: vi.fn(),
    writable: true,
  }
}

describe('SseManager — tenant isolation', () => {
  it('emit only delivers to clients of the matching companyId', async () => {
    const manager = await freshManager()
    const resA = makeMockRes()
    const resB = makeMockRes()

    const clientA = manager.addClient('company-A', resA as any)
    manager.addClient('company-B', resB as any)

    manager.emit('company-A', 'sale:created', { amount: 100 })

    expect(resA.write).toHaveBeenCalledOnce()
    expect(resA.write).toHaveBeenCalledWith(
      expect.stringContaining('sale:created')
    )
    expect(resB.write).not.toHaveBeenCalled()

    manager.removeClient('company-A', clientA)
  })

  it('emit to unknown companyId does nothing', async () => {
    const manager = await freshManager()
    const res = makeMockRes()
    manager.addClient('company-X', res as any)

    expect(() => manager.emit('company-UNKNOWN', 'sale:created', {})).not.toThrow()
    expect(res.write).not.toHaveBeenCalled()
  })

  it('addClient enforces per-tenant connection limit', async () => {
    const manager = await freshManager()
    const MAX = 50

    for (let i = 0; i < MAX; i++) {
      const r = { write: vi.fn(), end: vi.fn(), writable: true }
      manager.addClient('company-limited', r as any)
    }

    const extra = makeMockRes()
    expect(() => manager.addClient('company-limited', extra as any)).toThrow()
    expect(extra.end).toHaveBeenCalled()
  })

  it('removeClient cleans up and stops keepalive', async () => {
    vi.useFakeTimers()
    const manager = await freshManager()
    const res = makeMockRes()

    const client = manager.addClient('company-C', res as any)
    expect(manager.clientCount('company-C')).toBe(1)

    manager.removeClient('company-C', client)
    expect(manager.clientCount('company-C')).toBe(0)

    vi.advanceTimersByTime(60_000)
    expect(res.write).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('emitting to one tenant does not affect client count of another', async () => {
    const manager = await freshManager()
    const resA = makeMockRes()
    const resB = makeMockRes()

    manager.addClient('company-A', resA as any)
    manager.addClient('company-B', resB as any)

    manager.emit('company-A', 'stock:updated', {})

    expect(manager.clientCount('company-A')).toBe(1)
    expect(manager.clientCount('company-B')).toBe(1)
  })
})
