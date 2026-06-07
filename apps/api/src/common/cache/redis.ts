import { Redis } from '@upstash/redis'

let redisInstance: Redis | null = null

/**
 * Get the Redis client singleton.
 * Returns null if UPSTASH_REDIS_REST_URL is not configured,
 * allowing the app to work without Redis in development.
 */
export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  redisInstance = new Redis({ url, token })
  return redisInstance
}
