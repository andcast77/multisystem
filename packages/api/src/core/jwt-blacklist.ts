import { getRedis } from '../common/cache/redis.js'

const KEY_PREFIX = 'blacklist:jwt:'

export async function blacklistJti(jti: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis()
  if (!redis || ttlSeconds <= 0) return
  const key = `${KEY_PREFIX}${jti}`
  await redis.set(key, '1', { ex: ttlSeconds })
}

export async function isJtiBlacklisted(jti: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  const v = await redis.get(`${KEY_PREFIX}${jti}`)
  return v != null
}

export async function blacklistJtis(jtis: (string | null | undefined)[], ttlSeconds: number): Promise<void> {
  const unique = [...new Set(jtis.filter((x): x is string => typeof x === 'string' && x.length > 0))]
  await Promise.all(unique.map((jti) => blacklistJti(jti, ttlSeconds)))
}
