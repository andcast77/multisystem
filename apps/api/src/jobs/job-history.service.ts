import { getRedis } from '../common/cache/redis.js'
import type { JobRunRecord } from './job-state.js'

/**
 * Lists the last N job run records for a given company.
 * Records are stored in Redis under `job:run:{jobName}:{companyId}:{runId}`.
 * Falls back to an empty result when Redis is unavailable.
 */
export async function listJobHistory(
  companyId: string,
  limit = 50,
): Promise<{ items: JobRunRecord[]; total: number }> {
  const redis = getRedis()
  if (!redis) return { items: [], total: 0 }

  try {
    const pattern = `job:run:*:${companyId}:*`
    const keys = await redis.keys(pattern)

    if (keys.length === 0) return { items: [], total: 0 }

    const total = keys.length
    // Fetch values for the most recent slice (keys are not ordered, so fetch all then sort)
    const values = await Promise.all(keys.map((k) => redis.get<JobRunRecord>(k)))

    const records = values
      .filter((v): v is JobRunRecord => v !== null && typeof v === 'object')
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit)

    return { items: records, total }
  } catch {
    return { items: [], total: 0 }
  }
}
