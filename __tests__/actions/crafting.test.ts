import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { craftItem } from '@/actions/crafting';
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
    playerInventory: {
      delete: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    eventLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Crafting Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails if not logged in', async () => {
    (auth as Mock).mockResolvedValue(null);
    const res = await craftItem('recipe_scrap_armor');
    expect(res.error).toBe('Unauthorized');
  });

  it('fails if recipe not found', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    const res = await craftItem('invalid_recipe');
    expect(res.error).toBe('Recipe not found');
  });

  it('fails if missing materials', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      inventory: [
        { instanceId: 'i1', baseItemId: 'Scrap Metal', quantity: 5 }, // Needs 10 for scrap armor
      ],
    });

    const res = await craftItem('recipe_scrap_armor');
    expect(res.error).toContain('Missing required materials');
  });

  it('crafts successfully, deletes exact material, creates new item', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      inventory: [
        { instanceId: 'i1', baseItemId: 'Scrap Metal', quantity: 10 },
      ],
    });

    (prisma.$transaction as Mock).mockImplementation(async (cb) => {
      await cb(prisma);
    });

    const res = await craftItem('recipe_scrap_armor');
    expect(res.success).toBe(true);

    // Check material deletion since it was exactly 10
    expect(prisma.playerInventory.delete).toHaveBeenCalledWith({
      where: { instanceId: 'i1' },
    });

    // Check output creation
    expect(prisma.playerInventory.create).toHaveBeenCalledWith({
      data: {
        playerId: 'p1',
        baseItemId: 'Scrap Armor',
        quantity: 1,
      },
    });

    expect(prisma.eventLog.create).toHaveBeenCalled();
  });

  it('crafts successfully, decrements material, updates existing output item', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      inventory: [
        {
          instanceId: 'i1',
          baseItemId: 'Scrap Metal',
          quantity: 15,
          rarity: 'COMMON',
          isUpgraded: false,
        },
        {
          instanceId: 'i2',
          baseItemId: 'Scrap Armor',
          quantity: 1,
          rarity: 'COMMON',
          isUpgraded: false,
        },
      ],
    });

    (prisma.$transaction as Mock).mockImplementation(async (cb) => {
      await cb(prisma);
    });

    const res = await craftItem('recipe_scrap_armor');
    expect(res.success).toBe(true);

    // Check material decrement (15 - 10 = 5)
    expect(prisma.playerInventory.update).toHaveBeenCalledWith({
      where: { instanceId: 'i1' },
      data: { quantity: 5 },
    });

    // Check output update (1 + 1 = 2)
    expect(prisma.playerInventory.update).toHaveBeenCalledWith({
      where: { instanceId: 'i2' },
      data: { quantity: 2 },
    });
  });
});
