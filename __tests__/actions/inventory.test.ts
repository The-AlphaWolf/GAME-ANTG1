import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { equipItem, dropItem, consumeItem } from '@/actions/inventory';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import {
  makePlayer,
  makeItem,
  makeVehicle,
  type PrismaMock,
} from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

describe('Inventory Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.playerInventory.updateMany.mockResolvedValue({ count: 1 });
    (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
  });

  describe('equipItem', () => {
    it('fails when unauthenticated', async () => {
      (auth as Mock).mockResolvedValue(null);
      expect(await equipItem('i1', 'WEAPON')).toEqual({
        error: 'Unauthorized',
      });
    });

    it('equips gear into the slot the item registry defines', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ baseItemId: 'Nail Bat', quantity: 1 })
      );

      const result = await equipItem('i1', 'WEAPON');

      expect(result).toEqual({ success: true });
      expect(db.playerInventory.updateMany).toHaveBeenCalledWith({
        where: { playerId: 'p1', equipSlot: 'WEAPON' },
        data: { equipSlot: null },
      });
      expect(db.playerInventory.update).toHaveBeenCalledWith({
        where: { instanceId: 'i1' },
        data: { equipSlot: 'WEAPON' },
      });
    });

    it('refuses to equip something that is not gear', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ baseItemId: 'Scrap Metal' })
      );

      expect((await equipItem('i1', 'WEAPON')).error).toBe(
        'That item cannot be equipped'
      );
    });

    it('ignores a client-supplied slot that does not match the item', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ baseItemId: 'Welder Helm', quantity: 1 })
      );

      await equipItem('i1', 'WEAPON');

      // Welder Helm is a HEAD item; the registry wins over the request.
      expect(db.playerInventory.update).toHaveBeenCalledWith({
        where: { instanceId: 'i1' },
        data: { equipSlot: 'HEAD' },
      });
    });
  });

  describe('consumeItem', () => {
    it('heals from a First Aid Kit', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ health: 40 }));
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ baseItemId: 'First Aid Kit', quantity: 2 })
      );

      const result = await consumeItem('i1');

      expect(result.success).toBe(true);
      expect(db.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ health: 95 }),
        })
      );
    });

    it('pours fuel into the tank', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ vehicle: makeVehicle({ fuel: 20 }) })
      );
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ baseItemId: 'Fuel Canister', quantity: 1 })
      );

      const result = await consumeItem('i1');

      expect(result.success).toBe(true);
      expect(db.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { fuel: 60 } })
      );
    });

    it('rejects an item with no effects', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ baseItemId: 'Scrap Metal' })
      );

      expect((await consumeItem('i1')).error).toBe('That item cannot be used');
    });
  });

  describe('dropItem', () => {
    it('deletes the row and logs it', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(makeItem());

      const result = await dropItem('i1');

      expect(result).toEqual({ success: true });
      expect(db.playerInventory.delete).toHaveBeenCalledWith({
        where: { instanceId: 'i1' },
      });
      expect(db.eventLog.create).toHaveBeenCalled();
    });

    it('refuses to drop equipped gear', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ equipSlot: 'WEAPON' })
      );

      expect((await dropItem('i1')).error).toBe('Unequip it first');
    });
  });
});
