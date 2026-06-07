import { randomUUID } from 'crypto'
import { cacheGet, cacheSet } from '../common/cache/cache.js'

export type JobStatus = 'running' | 'success' | 'error'

export interface JobRunRecord {
  id: string
  companyId: string
  jobName: string
  status: JobStatus
  startedAt: number
  finishedAt?: number
  error?: string | null
  meta?: Record<string, unknown> | null
}

const JOB_RUN_TTL = 7 * 24 * 60 * 60  // 7 days
const JOB_IDEM_TTL = 25 * 60 * 60     // 25 hours — covers same-day idempotency window

function runKey(jobName: string, companyId: string, runId: string): string {
  return `job:run:${jobName}:${companyId}:${runId}`
}

function idemKey(jobName: string, companyId: string, date: string): string {
  return `job:idem:${jobName}:${companyId}:${date}`
}

export function createRunId(): string {
  return randomUUID()
}

export async function saveJobRun(record: JobRunRecord): Promise<void> {
  await cacheSet(runKey(record.jobName, record.companyId, record.id), record, JOB_RUN_TTL)
}

export async function isIdemSent(jobName: string, companyId: string, date: string): Promise<boolean> {
  const val = await cacheGet<{ sent: true }>(idemKey(jobName, companyId, date))
  return val !== null
}

export async function markIdemSent(jobName: string, companyId: string, date: string): Promise<void> {
  await cacheSet(idemKey(jobName, companyId, date), { sent: true }, JOB_IDEM_TTL)
}
