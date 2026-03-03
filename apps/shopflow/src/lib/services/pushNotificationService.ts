import { shopflowApi } from '@/lib/api/client'
import type { NotificationType, NotificationPriority } from '@/types'

type WebPushModule = {
  setVapidDetails: (a: string, b: string, c: string) => void
  sendNotification: (sub: unknown, payload: string) => Promise<unknown>
}
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@shopflow.com'

let webpush: WebPushModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webpush = require('web-push') as WebPushModule
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  }
} catch {
  // web-push not installed
}

export interface PushNotificationPayload {
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  actionUrl?: string
  data?: Record<string, unknown>
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Send push notification to a user's subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionInput,
  payload: PushNotificationPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured. Push notifications are disabled.')
  }

  if (!webpush) {
    throw new Error('web-push is not available')
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    message: payload.message,
    type: payload.type,
    priority: payload.priority || 'MEDIUM',
    actionUrl: payload.actionUrl,
    data: payload.data,
    timestamp: new Date().toISOString(),
  })

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      notificationPayload
    )
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode
      if (statusCode === 410 || statusCode === 404) {
        try {
          await shopflowApi.delete(`/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`)
        } catch {
          // ignore
        }
        throw new Error('Subscription expired')
      }
    }
    throw error
  }
}

interface NotificationPreferenceResponse {
  pushEnabled?: boolean
  pushLowStock?: boolean
  pushImportantSales?: boolean
  pushPendingTasks?: boolean
  pushSecurityAlerts?: boolean
}

interface PushSubscriptionResponse {
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send push notification to all user's subscriptions (via API for preferences/subscriptions)
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<number> {
  const prefsResponse = await shopflowApi.get<{ success: boolean; data?: NotificationPreferenceResponse }>(
    `/users/${userId}/notification-preferences`
  )
  const preferences = prefsResponse.success ? prefsResponse.data : null

  if (!preferences || !preferences.pushEnabled) {
    return 0
  }

  const typeEnabled: boolean | undefined = {
    LOW_STOCK: preferences.pushLowStock,
    LOW_STOCK_ALERT: preferences.pushLowStock,
    IMPORTANT_SALE: preferences.pushImportantSales,
    PENDING_TASK: preferences.pushPendingTasks,
    SECURITY_ALERT: preferences.pushSecurityAlerts,
    SYSTEM_MAINTENANCE: preferences.pushSecurityAlerts,
    SYSTEM: preferences.pushEnabled,
    CUSTOM: preferences.pushEnabled,
  }[payload.type]

  if (!typeEnabled) {
    return 0
  }

  const subsResponse = await shopflowApi.get<{ success: boolean; data?: PushSubscriptionResponse[] }>(
    `/users/${userId}/push-subscriptions`
  )
  const subscriptions = subsResponse.success && subsResponse.data ? subsResponse.data : []

  if (subscriptions.length === 0) {
    return 0
  }

  let sentCount = 0
  const errors: Error[] = []

  for (const sub of subscriptions) {
    try {
      await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      )
      sentCount++
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)))
    }
  }

  if (errors.length > 0 && process.env.NODE_ENV === 'development') {
    console.error('Failed to send some push notifications:', errors)
  }

  return sentCount
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<number> {
  let totalSent = 0

  for (const userId of userIds) {
    try {
      const sent = await sendPushNotificationToUser(userId, payload)
      totalSent += sent
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to send push to user ${userId}:`, error)
      }
    }
  }

  return totalSent
}
