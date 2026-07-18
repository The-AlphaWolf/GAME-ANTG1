import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { repairComponent, refuel } from '@/actions/vehicle';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Vehicle Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('repairComponent', () => {
    it('repairs the component up to max durability', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({
        id: 'player-1',
        vehicle: {
          id: 'vehicle-1',
          components: [
            {
              id: 'comp-1',
              name: 'Engine',
              durability: 50,
              maxDurability: 100,
            },
          ],
        },
      });

      (prisma.$transaction as Mock).mockImplementation(async (cb) => {
        const tx = {
          vehicleComponent: { update: vi.fn() },
          eventLog: { create: vi.fn() },
        };
        await cb(tx);

        expect(tx.vehicleComponent.update).toHaveBeenCalledWith({
          where: { id: 'comp-1' },
          data: { durability: 75 }, // 50 + 25
        });
      });

      const res = await repairComponent('comp-1', 25);
      expect(res).toEqual({ success: true });
    });

    it('returns error if component already at max durability', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({
        id: 'player-1',
        vehicle: {
          id: 'vehicle-1',
          components: [
            {
              id: 'comp-1',
              name: 'Engine',
              durability: 100,
              maxDurability: 100,
            },
          ],
        },
      });

      const res = await repairComponent('comp-1', 25);
      expect(res).toEqual({
        error: 'Component is already at maximum durability',
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('refuel', () => {
    it('adds fuel up to 100', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      (prisma.player.findUnique as Mock).mockResolvedValue({
        id: 'player-1',
        vehicle: {
          id: 'vehicle-1',
          fuel: 20,
        },
      });

      (prisma.$transaction as Mock).mockImplementation(async (cb) => {
        const tx = {
          vehicle: { update: vi.fn() },
          eventLog: { create: vi.fn() },
        };
        await cb(tx);

        expect(tx.vehicle.update).toHaveBeenCalledWith({
          where: { id: 'vehicle-1' },
          data: { fuel: 70 }, // 20 + 50
        });
      });

      const res = await refuel(50);
      expect(res).toEqual({ success: true });
    });
  });
});
