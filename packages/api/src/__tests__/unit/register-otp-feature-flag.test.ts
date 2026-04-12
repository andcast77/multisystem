import { describe, expect, it, vi } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'

vi.mock('../../core/config.js', () => ({
  getConfig: () => ({
    REGISTRATION_OTP_ENABLED: false,
  }),
}))

import { registerOtpSend, registerOtpVerify } from '../../controllers/v1/auth.controller.js'

describe('REGISTRATION_OTP_ENABLED guard', () => {
  it('registerOtpSend rejects when OTP registration is disabled', async () => {
    await expect(
      registerOtpSend({} as FastifyRequest, {} as FastifyReply),
    ).rejects.toMatchObject({
      code: 'REGISTRATION_OTP_DISABLED',
      statusCode: 403,
    })
  })

  it('registerOtpVerify rejects when OTP registration is disabled', async () => {
    await expect(
      registerOtpVerify({} as FastifyRequest, {} as FastifyReply),
    ).rejects.toMatchObject({
      code: 'REGISTRATION_OTP_DISABLED',
      statusCode: 403,
    })
  })
})
