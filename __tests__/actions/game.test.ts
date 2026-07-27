import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { submitAction, respawn, restartGame } from '@/actions/game';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
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

function action(text: string) {
  const data = new FormData();
  data.append('actionText', text);
  return data;
}

function resetTransaction() {
  db.$transaction.mockImplementation(async (cb: unknown) =>
    (cb as (tx: unknown) => Promise<unknown>)(db)
  );
  db.player.updateMany.mockResolvedValue({ count: 1 });
  db.playerInventory.updateMany.mockResolvedValue({ count: 1 });
  (auth as Mock).mockResolvedValue({
    user: { email: 'a@b.c', name: 'Tester' },
  });
}

describe('submitAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTransaction();
  });

  it('rejects an unauthenticated caller', async () => {
    (auth as Mock).mockResolvedValue(null);
    expect((await submitAction(action('rest'))).error).toBe('Unauthorized');
  });

  it('rejects an empty action', async () => {
    expect((await submitAction(action('   '))).error).toBe(
      'Action text is required'
    );
  });

  it('rejects a dead player', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({ isAlive: false, health: 0 })
    );
    expect((await submitAction(action('rest'))).error).toBe('You are dead');
  });

  it('resting restores energy and clears fatigue', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({ energy: 20, fatigue: 80 })
    );

    const result = await submitAction(action('rest for a while'));

    expect(result).toEqual({ success: true });
    expect(db.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ energy: 65, fatigue: 25 }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('eating consumes food and reduces hunger', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        hunger: 60,
        inventory: [makeItem({ baseItemId: 'Small Rations', quantity: 2 })],
      })
    );

    const result = await submitAction(action('eat something'));

    expect(result).toEqual({ success: true });
    expect(db.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hunger: 25 }),
      })
    );
  });

  it('eating with an empty larder reports why', async () => {
    db.player.findUnique.mockResolvedValue(makePlayer({ inventory: [] }));
    expect((await submitAction(action('eat'))).error).toBe(
      'No food in the van.'
    );
  });

  it('refuelling pours a canister into the tank', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        vehicle: makeVehicle({ fuel: 30 }),
        inventory: [makeItem({ baseItemId: 'Fuel Canister', quantity: 1 })],
      })
    );

    const result = await submitAction(action('refuel the van'));

    expect(result).toEqual({ success: true });
    expect(db.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { fuel: { increment: 40 } } })
    );
  });

  it('unrecognised input still produces a narrative rather than a dead end', async () => {
    db.player.findUnique.mockResolvedValue(makePlayer());

    const result = await submitAction(action('juggle three rocks'));

    expect(result).toEqual({ success: true });
    expect(db.eventLog.create).toHaveBeenCalled();
  });
});

describe('respawn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTransaction();
  });

  it('refuses when the player is alive', async () => {
    db.player.findUnique.mockResolvedValue(makePlayer());
    expect((await respawn()).error).toBe('You are still alive');
  });

  it('revives at 60% max HP and takes a quarter of the EC', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({ isAlive: false, health: 0, credits: 400, maxHealth: 120 })
    );

    const result = await respawn();

    expect(result).toEqual({ success: true });
    expect(db.player.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isAlive: true,
          health: 72,
          credits: { decrement: 100 },
        }),
      })
    );
  });
});

describe('restartGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTransaction();
  });

  it('wipes progress and rebuilds a fully-componented starter vehicle', async () => {
    db.player.findUnique.mockResolvedValue(makePlayer());
    db.vehicle.create.mockResolvedValue({ id: 'v2' });

    const result = await restartGame();

    expect(result).toEqual({ success: true });
    expect(db.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          level: 1,
          xp: 0,
          turns: 0,
          chapter: 1,
          distanceTraveled: 0,
        }),
      })
    );
    const vehicleArgs = db.vehicle.create.mock.calls[0][0] as {
      data: { components: { create: unknown[] } };
    };
    expect(vehicleArgs.data.components.create).toHaveLength(6);
  });
});
