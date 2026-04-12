import { getConfig } from '../core/config.js'
import { BadRequestError } from '../common/errors/app-error.js'

/**
 * Verifies Cloudflare Turnstile token (server-side).
 * In development, if TURNSTILE_SECRET_KEY is empty, verification is skipped (local only).
 */
export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<void> {
  const config = getConfig()
  const secret = config.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) {
    if (config.NODE_ENV === 'production') {
      throw new BadRequestError('Captcha no configurado en el servidor', 'CAPTCHA_NOT_CONFIGURED')
    }
    return
  }
  if (!token || token.trim() === '') {
    throw new BadRequestError('Captcha requerido', 'CAPTCHA_FAILED')
  }
  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token.trim())
  if (remoteip) body.set('remoteip', remoteip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  let json: { success?: boolean }
  try {
    json = (await res.json()) as { success?: boolean }
  } catch {
    throw new BadRequestError('Captcha inválido', 'CAPTCHA_FAILED')
  }
  if (!json.success) {
    throw new BadRequestError('Captcha inválido', 'CAPTCHA_FAILED')
  }
}
