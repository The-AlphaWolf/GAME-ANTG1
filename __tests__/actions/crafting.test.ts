import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { craftItem } from '@/actions/crafting';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { makePlayer, makeItem, type PrismaMock } from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

describe('Crafting Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.playerInventory.updateMany.mockResolvedValue({ count: 1 });
    (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
  });

  it('fails if not logged in', async () => {
    (auth as Mock).mockResolvedValue(null);
    expect((await craftItem('recipe_scrap_armor')).error).toBe('Unauthorized');
  });

  it('fails on an unknown recipe', async () => {
    expect((await craftItem('recipe_nonsense')).error).toBe('Recipe not found');
  });

  it('fails when materials are short', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        inventory: [makeItem({ baseItemId: 'Scrap Metal', quantity: 1 })],
      })
    );

    const result = await craftItem('recipe_scrap_armor');
    expect(result.error).toMatch(/Missing materials/);
  });

  it('refuses recipes locked behind a later chapter', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        distanceTraveled: 0,
        inventory: [
          makeItem({ instanceId: 'a', baseItemId: 'Gun Parts', quantity: 99 }),
          makeItem({
            instanceId: 'b',
            baseItemId: 'Scrap Metal',
            quantity: 99,
          }),
          makeItem({
            instanceId: 'c',
            baseItemId: 'Electronics',
            quantity: 99,
          }),
        ],
      })
    );

    expect((await craftItem('recipe_scrap_pistol')).error).toBe(
      'You have not learned that yet.'
    );
  });

  it('consumes materials and produces the output', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        inventory: [
          makeItem({
            instanceId: 'a',
            baseItemId: 'Scrap Metal',
            quantity: 20,
          }),
          makeItem({ instanceId: 'b', baseItemId: 'Cloth', quantity: 10 }),
        ],
      })
    );

    const result = await craftItem('recipe_scrap_armor');

    expect(result.success).toBe(true);
    expect(db.playerInventory.updateMany).toHaveBeenCalledWith({
      where: { instanceId: 'a', quantity: { gte: 8 } },
      data: { quantity: { decrement: 8 } },
    });
    expect(db.playerInventory.create).toHaveBeenCalled();
  });

  it('draws a material from several stacks of differing rarity', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        inventory: [
          makeItem({ instanceId: 'a', baseItemId: 'Scrap Metal', quantity: 5 }),
          makeItem({
            instanceId: 'b',
            baseItemId: 'Scrap Metal',
            rarity: 'GOLD',
            quantity: 5,
          }),
          makeItem({ instanceId: 'c', baseItemId: 'Cloth', quantity: 10 }),
        ],
      })
    );

    const result = await craftItem('recipe_scrap_armor');

    expect(result.success).toBe(true);
    // 8 Scrap Metal needed: 5 from the first stack, 3 from the second.
    expect(db.playerInventory.updateMany).toHaveBeenCalledWith({
      where: { instanceId: 'a', quantity: { gte: 5 } },
      data: { quantity: { decrement: 5 } },
    });
    expect(db.playerInventory.updateMany).toHaveBeenCalledWith({
      where: { instanceId: 'b', quantity: { gte: 3 } },
      data: { quantity: { decrement: 3 } },
    });
  });
});
