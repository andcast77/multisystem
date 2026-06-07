import webpush from 'web-push'
import { prisma } from '../db/index.js'

let vapidReady = false

/**
 * Configures web-push VAPID details from environment variables.
 * Returns false when keys are not configured — callers skip push silently.
 * Keys are set once and reused across all subsequent calls.
 */
function ensureVapid(): boolean {
  if (vapidReady) return true
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidReady = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
}

/**
 * Sends a Web Push notification to every active subscription registered for a user.
 *
 * - Silently skips when VAPID keys are not configured (graceful degradation).
 * - Auto-removes expired subscriptions returned with HTTP 410 / 404.
 * - Never throws — all errors are logged or swallowed so callers are never blocked.
 *
 * Generate VAPID keys once with:
 *   npx web-push generate-vapid-keys
 * Then set in the API .env:
 *   VAPID_SUBJECT=mailto:you@yourdomain.com
 *   VAPID_PUBLIC_KEY=<generated>
 *   VAPID_PRIVATE_KEY=<generated>
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true },
  })

  if (subscriptions.length === 0) return

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    data: payload.data,
  })

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        )
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          // Subscription expired or unregistered — remove to avoid future attempts
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {})
        } else {
          console.warn('[push-sender] Delivery failed', {
            userId,
            endpoint: sub.endpoint.slice(0, 50),
            status,
          })
        }
      }
    }),
  )
}

/**
 * Sends a Web Push notification to all OWNER/ADMIN members of a company.
 * Convenience wrapper used by scheduled jobs.
 */
export async function sendPushToCompanyAdmins(
  companyId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureVapid()) return

  const members = await prisma.companyMember.findMany({
    where: { companyId, membershipRole: { in: ['OWNER', 'ADMIN'] } },
    select: { userId: true },
  })

  await Promise.allSettled(members.map((m) => sendPushToUser(m.userId, payload)))
}
