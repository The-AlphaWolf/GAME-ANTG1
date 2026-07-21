import { Prisma } from '@prisma/client';

const RETENTION_DAYS = 30;
const PRUNE_SAMPLE_RATE = 0.05;

/**
 * EventLog is write-only and never replayed, so it grows forever. Rather than
 * a cron job, prune opportunistically: a small fraction of actions sweep this
 * player's own events older than the retention window.
 */
export async function maybePruneEventLog(
  tx: Prisma.TransactionClient,
  playerId: string
): Promise<void> {
  if (Math.random() >= PRUNE_SAMPLE_RATE) return;

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await tx.eventLog.deleteMany({
    where: { playerId, timestamp: { lt: cutoff } },
  });
}
