import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { initiateCombat, executeCombatTurn } from '@/actions/combat';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Combat Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateCombat', () => {
    it('returns error if unauthorized', async () => {
      (auth as Mock).mockResolvedValue(null);
      const res = await initiateCombat('Goblin', 50, 10);
      expect(res).toEqual({ error: 'Unauthorized' });
    });

    it('spawns an encounter and clears old ones in a transaction', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({ id: 'player-1' });

      // Mock the transaction callback behavior
      (prisma.$transaction as Mock).mockImplementation(async (cb) => {
        const tx = {
          activeEncounter: {
            deleteMany: vi.fn(),
            create: vi.fn(),
          },
          eventLog: {
            create: vi.fn(),
          },
        };
        await cb(tx);
        expect(tx.activeEncounter.deleteMany).toHaveBeenCalledWith({
          where: { playerId: 'player-1' },
        });
        expect(tx.activeEncounter.create).toHaveBeenCalledWith({
          data: {
            playerId: 'player-1',
            enemyName: 'Goblin',
            enemyHp: 50,
            enemyMaxHp: 50,
            enemyAttack: 10,
          },
        });
      });

      const res = await initiateCombat('Goblin', 50, 10);
      expect(res).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });
  });

  describe('executeCombatTurn', () => {
    it('returns error if no active encounter', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({
        id: 'player-1',
        activeEncounter: null,
      });

      const res = await executeCombatTurn('ATTACK');
      expect(res).toEqual({ error: 'No active encounter' });
    });

    it('processes attack and reduces HP', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({
        id: 'player-1',
        health: 100,
        level: 5,
        inventory: [],
        activeEncounter: {
          id: 'encounter-1',
          enemyName: 'Goblin',
          enemyHp: 50,
          enemyMaxHp: 50,
          enemyAttack: 10,
        },
      });

      (prisma.$transaction as Mock).mockImplementation(async (cb) => {
        const tx = {
          player: { update: vi.fn() },
          activeEncounter: { update: vi.fn() },
          eventLog: { create: vi.fn() },
        };
        await cb(tx);

        // Player level 5 = 15 base attack. Enemy has 50 HP.
        // Enemy attacks for 10. Player has 100 HP.
        expect(tx.activeEncounter.update).toHaveBeenCalledWith({
          where: { id: 'encounter-1' },
          data: { enemyHp: 35 },
        });

        expect(tx.player.update).toHaveBeenCalledWith({
          where: { id: 'player-1' },
          data: { health: 90 },
        });

        expect(tx.eventLog.create).toHaveBeenCalledTimes(2);
      });

      const res = await executeCombatTurn('ATTACK');
      expect(res).toEqual({ success: true });
    });
  });
});
