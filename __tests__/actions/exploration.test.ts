import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { explore, scavenge } from '@/actions/exploration';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import {
  makePlayer,
  makeVehicle,
  type PrismaMock,
} from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/actions/quests', () => ({ progressQuests: vi.fn() }));
vi.mock('@/actions/npc', () => ({ npcChatterTick: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

describe('Exploration Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.player.updateMany.mockResolvedValue({ count: 1 });
    db.vehicle.updateMany.mockResolvedValue({ count: 1 });
    (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
  });

  describe('explore', () => {
    it('rejects an unauthenticated caller', async () => {
      (auth as Mock).mockResolvedValue(null);
      expect((await explore()).error).toBe('Unauthorized');
    });

    it('fails without a vehicle', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ vehicle: null }));
      expect((await explore()).error).toBe('You need a vehicle to explore');
    });

    it('fails when the tank is empty', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ vehicle: makeVehicle({ fuel: 0 }) })
      );
      expect((await explore()).error).toMatch(/Not enough fuel/);
    });

    it('fails while an encounter is live', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({
          vehicle: makeVehicle(),
          activeEncounter: { id: 'enc1' },
        })
      );
      expect((await explore()).error).toBe('Cannot drive while in combat');
    });

    it('fails when dead', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ isAlive: false, health: 0, vehicle: makeVehicle() })
      );
      expect((await explore()).error).toBe('You are dead');
    });

    it('advances distance, burns fuel and logs a narrative', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ vehicle: makeVehicle() })
      );

      const result = await explore();

      expect(result.success).toBe(true);
      expect(db.player.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            distanceTraveled: { increment: expect.any(Number) },
          }),
        })
      );
      expect(db.vehicle.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fuel: { decrement: expect.any(Number) },
          }),
        })
      );
      expect(db.eventLog.create).toHaveBeenCalled();
    });

    it('always resolves to a known encounter type', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ vehicle: makeVehicle() })
      );

      for (let i = 0; i < 25; i++) {
        const result = await explore();
        expect(['empty', 'loot', 'combat', 'npc', 'cache']).toContain(
          result.eventType
        );
      }
    });
  });

  describe('scavenge', () => {
    it('fails when out of energy', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ energy: 1 }));
      expect((await scavenge()).error).toMatch(/Too exhausted/);
    });

    it('spends energy and logs an outcome', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());

      const result = await scavenge();

      expect(result.success).toBe(true);
      expect(db.player.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ energy: { decrement: 5 } }),
        })
      );
      expect(db.eventLog.create).toHaveBeenCalled();
    });
  });
});
