import { getRedis } from './redis.js'

const DEFAULT_TTL_SECONDS = 300 // 5 minutes

/**
 * Generic caching layer that falls back to no-op when Redis is unavailable.
 * All cache operations are fire-and-forget; failures never break the app.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    if (!redis) return null
    const value = await redis.get<T>(key)
    return value ?? null
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // Swallow -- cache failures must not break the app
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.del(key)
  } catch {
    // Swallow
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      const pipeline = redis.pipeline()
      for (const key of keys) {
        pipeline.del(key)
      }
      await pipeline.exec()
    }
  } catch {
    // Swallow
  }
}

/**
 * Cache-through helper: returns cached value if available,
 * otherwise calls the factory, caches the result, and returns it.
 */
export async function cacheThrough<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const value = await factory()
  await cacheSet(key, value, ttlSeconds)
  return value
}
