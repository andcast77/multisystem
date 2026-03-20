import { describe, it, expect, vi } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireRole } from '../../core/auth-context.js'

type ReplyStub = Pick<FastifyReply, 'code' | 'send'> & {
  statusCode?: number
  payload?: unknown
  codeMock: ReturnType<typeof vi.fn>
  sendMock: ReturnType<typeof vi.fn>
}

function createReplyStub(): ReplyStub {
  const codeMock = vi.fn((statusCode: number) => {
    reply.statusCode = statusCode
    return reply as FastifyReply
  })
  const sendMock = vi.fn((payload: unknown) => {
    reply.payload = payload
    return reply as FastifyReply
  })

  const reply: ReplyStub = {
    code: codeMock as unknown as ReplyStub['code'],
    send: sendMock as unknown as ReplyStub['send'],
    codeMock,
    sendMock,
  }
  return reply
}

function baseRequest(): Partial<FastifyRequest> {
  return {
    user: {
      id: 'user-1',
      email: 'owner@acme.test',
      role: 'USER',
      companyId: 'company-1',
      isSuperuser: false,
      membershipRole: 'OWNER',
    },
    companyId: 'company-1',
    membershipRole: 'OWNER',
  }
}

describe('requireRole preHandler', () => {
  it('allows OWNER membership for requireRole(owner, admin)', async () => {
    const guard = requireRole(['owner', 'admin'])
    const request = baseRequest() as FastifyRequest
    const reply = createReplyStub() as FastifyReply & ReplyStub

    await expect(guard(request, reply)).resolves.toBeUndefined()
    expect(reply.codeMock).not.toHaveBeenCalled()
  })

  it('allows ADMIN membership for requireRole(owner, admin)', async () => {
    const guard = requireRole(['owner', 'admin'])
    const request = {
      ...baseRequest(),
      membershipRole: 'ADMIN',
      user: { ...baseRequest().user!, membershipRole: 'ADMIN' },
    } as FastifyRequest
    const reply = createReplyStub() as FastifyReply & ReplyStub

    await expect(guard(request, reply)).resolves.toBeUndefined()
    expect(reply.codeMock).not.toHaveBeenCalled()
  })

  it('denies USER membership', async () => {
    const guard = requireRole(['owner', 'admin'])
    const request = {
      ...baseRequest(),
      membershipRole: 'USER',
      user: { ...baseRequest().user!, membershipRole: 'USER' },
    } as FastifyRequest
    const reply = createReplyStub() as FastifyReply & ReplyStub

    await expect(guard(request, reply)).rejects.toThrow('Forbidden')
    expect(reply.statusCode).toBe(403)
  })

  it('allows superuser bypass even without membership role', async () => {
    const guard = requireRole(['owner', 'admin'])
    const request = {
      ...baseRequest(),
      membershipRole: null,
      user: { ...baseRequest().user!, isSuperuser: true, membershipRole: undefined },
    } as FastifyRequest
    const reply = createReplyStub() as FastifyReply & ReplyStub

    await expect(guard(request, reply)).resolves.toBeUndefined()
  })
})
