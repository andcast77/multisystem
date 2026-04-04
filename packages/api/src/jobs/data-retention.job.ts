import { prisma } from '../db/index.js'

/**
 * Data retention policy (see docs/security/DATA-INVENTORY.md):
 *   - Sessions / tokens : expired sessions are cleaned up immediately
 *   - Audit logs        : active for 12 months; deleted after that threshold
 *   - Action history    : active for 12 months; deleted after that threshold
 *
 * This job runs daily and is idempotent.
 */
export async function runDataRetentionJob(): Promise<void> {
  const now = new Date()

  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const [deletedSessions, deletedAuditLogs, deletedActionHistory] = await Promise.all([
    // Remove all sessions that have already expired
    prisma.session.deleteMany({
      where: { expiresAt: { lte: now } },
    }),

    // Audit logs older than 12 months are past the active-retention window
    prisma.auditLog.deleteMany({
      where: { createdAt: { lt: twelveMonthsAgo } },
    }),

    // Action history older than 12 months
    prisma.actionHistory.deleteMany({
      where: { createdAt: { lt: twelveMonthsAgo } },
    }),
  ])

  console.log('[data-retention] Completed', {
    deletedSessions: deletedSessions.count,
    deletedAuditLogs: deletedAuditLogs.count,
    deletedActionHistory: deletedActionHistory.count,
    ranAt: now.toISOString(),
  })
}
