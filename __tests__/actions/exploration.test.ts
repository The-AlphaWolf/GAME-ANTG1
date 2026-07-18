import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { explore } from '@/actions/exploration';
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
    vehicle: {
      update: vi.fn(),
    },
    eventLog: {
      create: vi.fn(),
    },
    playerInventory: {
      create: vi.fn(),
      update: vi.fn(),
    },
    activeEncounter: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Exploration Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails if no vehicle', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      vehicle: null,
    });

    const res = await explore();
    expect(res.error).toBe('You need a vehicle to explore');
  });

  it('fails if no fuel', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      vehicle: { fuel: 0 },
    });

    const res = await explore();
    expect(res.error).toBe('Not enough fuel to drive');
  });

  it('fails if already in combat', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      vehicle: { fuel: 10 },
      activeEncounter: { id: 'enc1' },
    });

    const res = await explore();
    expect(res.error).toBe('Cannot explore while in combat');
  });

  it('explores successfully and triggers an event', async () => {
    (auth as Mock).mockResolvedValue({ user: { name: 'test' } });
    (prisma.player.findUnique as Mock).mockResolvedValue({
      id: 'p1',
      distanceTraveled: 100,
      inventory: [],
      vehicle: { id: 'v1', fuel: 50 },
    });

    (prisma.$transaction as Mock).mockImplementation(async (cb) => {
      const tx = prisma;
      await cb(tx);
    });

    const res = await explore();
    expect(res.success).toBe(true);
    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { distanceTraveled: 110 },
    });
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { fuel: 45 },
    });
    // It should have either created an event, an encounter, or inventory
    expect(prisma.eventLog.create).toHaveBeenCalled();
  });
});
