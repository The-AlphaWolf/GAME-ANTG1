import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { sellItem } from '@/actions/economy';
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
    playerInventory: {
      delete: vi.fn(),
      update: vi.fn(),
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

describe('Economy Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails if not logged in', async () => {
    (auth as Mock).mockResolvedValue(null);
    const res = await sellItem('inst1');
    expect(res.error).toBe('Unauthorized');
  });

  it('fails if player not found', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue(null);
    const res = await sellItem('inst1');
    expect(res.error).toBe('Player not found');
  });

  it('fails if item not found in inventory', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      credits: 0,
      inventory: [],
    });
    const res = await sellItem('inst1');
    expect(res.error).toBe('Item not found in inventory');
  });

  it('fails if item is equipped', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      credits: 0,
      inventory: [{ instanceId: 'inst1', equipSlot: 'WEAPON' }],
    });
    const res = await sellItem('inst1');
    expect(res.error).toBe('Cannot sell equipped items');
  });

  it('sells item, deletes inventory row if quantity is 1, and adds credits', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      credits: 100,
      inventory: [
        {
          instanceId: 'inst1',
          baseItemId: 'Scrap Metal',
          quantity: 1,
          equipSlot: null,
        },
      ],
    });

    (prisma.$transaction as Mock).mockImplementation(async (cb) => {
      await cb(prisma);
    });

    const res = await sellItem('inst1');
    expect(res.success).toBe(true);

    expect(prisma.playerInventory.delete).toHaveBeenCalledWith({
      where: { instanceId: 'inst1' },
    });

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { credits: 110 }, // 100 + 10 for Scrap Metal
    });

    expect(prisma.eventLog.create).toHaveBeenCalled();
  });

  it('sells item, decrements quantity if > 1, and adds credits', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      credits: 50,
      inventory: [
        {
          instanceId: 'inst2',
          baseItemId: 'Wood',
          quantity: 5,
          equipSlot: null,
        },
      ],
    });

    (prisma.$transaction as Mock).mockImplementation(async (cb) => {
      await cb(prisma);
    });

    const res = await sellItem('inst2');
    expect(res.success).toBe(true);

    expect(prisma.playerInventory.update).toHaveBeenCalledWith({
      where: { instanceId: 'inst2' },
      data: { quantity: 4 },
    });

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { credits: 55 }, // 50 + 5 for Wood
    });
  });
});
