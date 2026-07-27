import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { acceptQuest, turnInQuest, progressQuests } from '@/actions/quests';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { QUEST_REGISTRY } from '@/lib/game/quests';
import { makePlayer, type PrismaMock } from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

// A chapter-1 kill bounty that exists in the registry.
const QUEST_ID = 'q_clear_the_shoulder';
const QUEST = QUEST_REGISTRY[QUEST_ID];

describe('Quest Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.activeQuest.updateMany.mockResolvedValue({ count: 1 });
    (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
  });

  describe('acceptQuest', () => {
    it('rejects an unknown quest id', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      expect((await acceptQuest('nope')).error).toBe('Invalid quest');
    });

    it('refuses a bounty from a later chapter', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ distanceTraveled: 0 })
      );
      const lateQuest = 'q_ridge_walkers'; // chapter 4
      expect((await acceptQuest(lateQuest)).error).toMatch(/not been posted/);
    });

    it('creates the active quest row', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.activeQuest.findUnique.mockResolvedValue(null);

      const result = await acceptQuest(QUEST_ID);

      expect(result.success).toBe(true);
      expect(db.activeQuest.create).toHaveBeenCalledWith({
        data: {
          playerId: 'p1',
          questId: QUEST_ID,
          progress: 0,
          status: 'ACTIVE',
        },
      });
    });

    it('refuses a quest already taken', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.activeQuest.findUnique.mockResolvedValue({ id: 'aq1' });
      expect((await acceptQuest(QUEST_ID)).error).toMatch(/already/);
    });
  });

  describe('progressQuests', () => {
    it('increments progress and caps at the target', async () => {
      db.activeQuest.findMany.mockResolvedValue([
        { id: 'aq1', questId: QUEST_ID, progress: 0, status: 'ACTIVE' },
      ]);

      await progressQuests('p1', 'KILL', QUEST.targetId, 99);

      expect(db.activeQuest.update).toHaveBeenCalledWith({
        where: { id: 'aq1' },
        data: { progress: QUEST.targetQuantity },
      });
    });

    it('ignores quests whose target does not match', async () => {
      db.activeQuest.findMany.mockResolvedValue([
        { id: 'aq1', questId: QUEST_ID, progress: 0, status: 'ACTIVE' },
      ]);

      await progressQuests('p1', 'KILL', 'Something Else', 1);

      expect(db.activeQuest.update).not.toHaveBeenCalled();
    });

    it('credits mileage toward TRAVEL bounties', async () => {
      db.activeQuest.findMany.mockResolvedValue([
        {
          id: 'aq2',
          questId: 'q_first_hundred',
          progress: 0,
          status: 'ACTIVE',
        },
      ]);

      await progressQuests('p1', 'TRAVEL', 'miles', 10);

      expect(db.activeQuest.update).toHaveBeenCalledWith({
        where: { id: 'aq2' },
        data: { progress: 10 },
      });
    });
  });

  describe('turnInQuest', () => {
    it('fails when objectives are unmet', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.activeQuest.findUnique.mockResolvedValue({
        id: 'aq1',
        questId: QUEST_ID,
        progress: 1,
        status: 'ACTIVE',
      });

      expect((await turnInQuest(QUEST_ID)).error).toBe(
        'Quest objectives not met'
      );
    });

    it('closes the quest and pays out credits, items and XP', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.activeQuest.findUnique.mockResolvedValue({
        id: 'aq1',
        questId: QUEST_ID,
        progress: QUEST.targetQuantity,
        status: 'ACTIVE',
      });

      const result = await turnInQuest(QUEST_ID);

      expect(result.success).toBe(true);
      expect(db.activeQuest.updateMany).toHaveBeenCalledWith({
        where: { id: 'aq1', status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });
      // Credits/reputation payout, then the XP write.
      expect(db.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            credits: { increment: QUEST.rewards.credits },
          }),
        })
      );
      expect(db.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ xp: expect.any(Number) }),
        })
      );
      expect(db.playerInventory.create).toHaveBeenCalled();
    });
  });
});
