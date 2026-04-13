import { getConfig } from '../core/config.js'
import { BadRequestError, CaptchaFailedError } from '../common/errors/app-error.js'

/**
 * Verifies Cloudflare Turnstile token (server-side).
 * In development, if TURNSTILE_SECRET_KEY is empty, verification is skipped (local only).
 */
export async function verifyTurnstileToken(token: string, _remoteip?: string): Promise<void> {
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
  // No enviar `remoteip`: es opcional en siteverify y una IP errónea (p. ej. sin trustProxy en Vercel)
  // hace fallar la validación aunque el token y el secret sean correctos.

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  type SiteverifyJson = { success?: boolean; 'error-codes'?: string[] }
  let json: SiteverifyJson
  try {
    json = (await res.json()) as SiteverifyJson
  } catch {
    throw new CaptchaFailedError('Captcha inválido')
  }
  if (!json.success) {
    const codes = json['error-codes']
    if (codes?.length) {
      console.warn('[turnstile] siteverify failed', { errorCodes: codes })
    }
    throw new CaptchaFailedError('Captcha inválido', codes)
  }
}
