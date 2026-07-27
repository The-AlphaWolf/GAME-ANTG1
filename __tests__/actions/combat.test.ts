import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { executeCombatTurn } from '@/actions/combat';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { makePlayer, makeItem, type PrismaMock } from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/actions/quests', () => ({ progressQuests: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

const encounter = {
  id: 'enc1',
  playerId: 'p1',
  enemyName: 'Feral Scavenger',
  enemyHp: 26,
  enemyMaxHp: 26,
  enemyAttack: 5,
};

describe('Combat Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.player.updateMany.mockResolvedValue({ count: 1 });
    db.activeEncounter.updateMany.mockResolvedValue({ count: 1 });
    db.activeEncounter.deleteMany.mockResolvedValue({ count: 1 });
    (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
  });

  it('rejects an unauthenticated caller', async () => {
    (auth as Mock).mockResolvedValue(null);
    expect(await executeCombatTurn('ATTACK')).toEqual({
      error: 'Unauthorized',
    });
  });

  it('errors when there is no encounter', async () => {
    db.player.findUnique.mockResolvedValue(makePlayer());
    expect(await executeCombatTurn('ATTACK')).toEqual({
      error: 'No active encounter',
    });
  });

  it('errors when the player is dead', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({ isAlive: false, health: 0, activeEncounter: encounter })
    );
    expect(await executeCombatTurn('ATTACK')).toEqual({
      error: 'You are dead',
    });
  });

  it('applies damage to both sides and revalidates', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({ activeEncounter: encounter })
    );

    const result = await executeCombatTurn('ATTACK');

    expect(result).toEqual({ success: true });
    expect(db.player.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ health: 100, isAlive: true }),
      })
    );
    expect(db.eventLog.create).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('an equipped weapon increases damage dealt', async () => {
    const readEnemyHp = () => {
      const call = db.activeEncounter.updateMany.mock.calls.at(-1);
      const deleted = db.activeEncounter.deleteMany.mock.calls.length > 0;
      // A kill deletes the encounter rather than writing 0 HP.
      if (deleted) return 0;
      return (call?.[0] as { data: { enemyHp: number } }).data.enemyHp;
    };

    // Beefed-up enemy so a single unarmed swing cannot end the fight.
    const tanky = { ...encounter, enemyHp: 400, enemyMaxHp: 400 };

    db.player.findUnique.mockResolvedValue(
      makePlayer({ activeEncounter: tanky })
    );
    await executeCombatTurn('ATTACK');
    const unarmedRemaining = readEnemyHp();

    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.player.updateMany.mockResolvedValue({ count: 1 });
    db.activeEncounter.updateMany.mockResolvedValue({ count: 1 });
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        activeEncounter: tanky,
        inventory: [
          makeItem({
            baseItemId: 'Convoy Carbine',
            equipSlot: 'WEAPON',
            rarity: 'GOLD',
            quantity: 1,
          }),
        ],
      })
    );
    await executeCombatTurn('ATTACK');
    const armedRemaining = readEnemyHp();

    expect(armedRemaining).toBeLessThan(unarmedRemaining);
  });

  it('defending still deals damage rather than stalling', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({
        activeEncounter: { ...encounter, enemyHp: 400, enemyMaxHp: 400 },
      })
    );

    await executeCombatTurn('DEFEND');

    const call = db.activeEncounter.updateMany.mock.calls.at(-1);
    const remaining = (call?.[0] as { data: { enemyHp: number } }).data.enemyHp;
    expect(remaining).toBeLessThan(400);
  });

  it('ends the encounter when the player flees successfully', async () => {
    db.player.findUnique.mockResolvedValue(
      makePlayer({ health: 5, activeEncounter: encounter })
    );

    // At 5/100 HP the desperation bonus makes escape near-certain; run a few
    // attempts so the assertion is not a coin flip.
    let escaped = false;
    for (let i = 0; i < 15 && !escaped; i++) {
      vi.clearAllMocks();
      db.$transaction.mockImplementation(async (cb: unknown) =>
        (cb as (tx: unknown) => Promise<unknown>)(db)
      );
      db.player.updateMany.mockResolvedValue({ count: 1 });
      db.activeEncounter.deleteMany.mockResolvedValue({ count: 1 });
      db.activeEncounter.updateMany.mockResolvedValue({ count: 1 });
      db.player.findUnique.mockResolvedValue(
        makePlayer({ health: 5, activeEncounter: encounter })
      );

      await executeCombatTurn('FLEE');
      escaped = db.activeEncounter.deleteMany.mock.calls.length > 0;
    }

    expect(escaped).toBe(true);
  });
});
