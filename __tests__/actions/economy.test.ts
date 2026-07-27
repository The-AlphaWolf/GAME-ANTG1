import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { sellItem, buyItem } from '@/actions/economy';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getItemPrice, getShopBuyPrice } from '@/lib/game/economy';
import { makePlayer, makeItem, type PrismaMock } from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

describe('Economy Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.playerInventory.updateMany.mockResolvedValue({ count: 1 });
    db.player.updateMany.mockResolvedValue({ count: 1 });
    (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
  });

  describe('sellItem', () => {
    it('fails when unauthenticated', async () => {
      (auth as Mock).mockResolvedValue(null);
      expect((await sellItem('i1')).error).toBe('Unauthorized');
    });

    it('fails when the item is not in the inventory', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(null);
      expect((await sellItem('i1')).error).toBe('Item not found in inventory');
    });

    it('refuses to sell equipped gear', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ equipSlot: 'WEAPON' })
      );
      expect((await sellItem('i1')).error).toBe('Cannot sell equipped items');
    });

    it('credits the base value for one unit', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(makeItem());

      const result = await sellItem('i1');

      expect(result.success).toBe(true);
      expect(db.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { credits: { increment: getItemPrice('Scrap Metal') } },
        })
      );
    });

    it('scales the payout by rarity and quantity', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      db.playerInventory.findUnique.mockResolvedValue(
        makeItem({ rarity: 'GOLD', quantity: 3 })
      );

      await sellItem('i1', 3);

      expect(db.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            credits: { increment: getItemPrice('Scrap Metal', 'GOLD') * 3 },
          },
        })
      );
    });
  });

  describe('buyItem', () => {
    it('rejects items the trader does not stock', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      expect((await buyItem('Convoy Keycard')).error).toBe(
        'Item not sold here'
      );
    });

    it('rejects stock gated behind a later chapter', async () => {
      db.player.findUnique.mockResolvedValue(
        makePlayer({ distanceTraveled: 0 })
      );
      expect((await buyItem('Riot Vest')).error).toMatch(/does not stock/);
    });

    it('rejects a purchase the player cannot afford', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ credits: 0 }));
      expect((await buyItem('Clean Water')).error).toBe('Not enough EC');
    });

    it('debits EC and grants the item', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ credits: 1000 }));

      const result = await buyItem('Clean Water', 2);

      expect(result.success).toBe(true);
      expect(db.player.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            credits: { decrement: getShopBuyPrice('Clean Water') * 2 },
          },
        })
      );
      expect(db.playerInventory.create).toHaveBeenCalled();
    });
  });
});
