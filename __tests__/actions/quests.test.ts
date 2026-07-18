import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { acceptQuest, turnInQuest, progressQuests } from '@/actions/quests';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    activeQuest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    eventLog: {
      create: vi.fn(),
    },
    playerInventory: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Quest Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('acceptQuest', () => {
    it('fails if not logged in', async () => {
      (auth as Mock).mockResolvedValue(null);
      const res = await acceptQuest('q_kill_wolves');
      expect(res.error).toBe('Unauthorized');
    });

    it('fails if player not found', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue(null);
      const res = await acceptQuest('q_kill_wolves');
      expect(res.error).toBe('Player not found');
    });

    it('fails if quest invalid', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({ id: 'p1' });
      const res = await acceptQuest('q_invalid');
      expect(res.error).toBe('Invalid quest');
    });

    it('creates active quest', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({ id: 'p1' });
      (prisma.activeQuest.findUnique as Mock).mockResolvedValue(null);

      const res = await acceptQuest('q_kill_wolves');
      expect(prisma.activeQuest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            questId: 'q_kill_wolves',
            status: 'ACTIVE',
          }),
        })
      );
      expect(res.success).toBe(true);
    });
  });

  describe('progressQuests', () => {
    it('increments progress and caps at target', async () => {
      (prisma.activeQuest.findMany as Mock).mockResolvedValue([
        { id: 'aq1', questId: 'q_kill_wolves', progress: 3 },
      ]);

      await progressQuests('p1', 'KILL', 'Mutated Wolf', 5);

      expect(prisma.activeQuest.update).toHaveBeenCalledWith({
        where: { id: 'aq1' },
        data: { progress: 5 }, // Capped at targetQuantity (which is 5 for q_kill_wolves)
      });

      // Should create an event log since it hit the target
      expect(prisma.eventLog.create).toHaveBeenCalled();
    });
  });

  describe('turnInQuest', () => {
    it('fails if quest not complete', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({ id: 'p1' });
      (prisma.activeQuest.findUnique as Mock).mockResolvedValue({
        id: 'aq1',
        questId: 'q_kill_wolves',
        status: 'ACTIVE',
        progress: 1,
      });

      const res = await turnInQuest('q_kill_wolves');
      expect(res.error).toBe('Quest objectives not met');
    });

    it('completes quest and gives rewards', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({
        id: 'p1',
        credits: 0,
      });
      (prisma.activeQuest.findUnique as Mock).mockResolvedValue({
        id: 'aq1',
        questId: 'q_kill_wolves',
        status: 'ACTIVE',
        progress: 5,
      });

      (prisma.$transaction as Mock).mockImplementation(async (cb) => {
        await cb(prisma);
      });

      const res = await turnInQuest('q_kill_wolves');

      expect(prisma.activeQuest.update).toHaveBeenCalledWith({
        where: { id: 'aq1' },
        data: { status: 'COMPLETED' },
      });

      // q_kill_wolves gives 100 credits
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { credits: { increment: 100 } },
      });

      expect(res.success).toBe(true);
    });
  });
});
