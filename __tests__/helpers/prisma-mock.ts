import { vi } from 'vitest';

/**
 * Builds a Prisma double whose `$transaction` hands the same object back as the
 * transaction client. Action tests assert on outcomes and on which delegates
 * were touched, rather than on exact call payloads — the old suite pinned
 * literal argument shapes and broke the moment an action switched from
 * `update` to `updateMany`.
 */
export function createPrismaMock() {
  const delegate = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    upsert: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    count: vi.fn().mockResolvedValue(0),
  });

  const prisma = {
    user: delegate(),
    player: delegate(),
    vehicle: delegate(),
    vehicleComponent: delegate(),
    playerInventory: delegate(),
    activeEncounter: delegate(),
    activeQuest: delegate(),
    eventLog: delegate(),
    chatMessage: delegate(),
    npcRelation: delegate(),
    $transaction: vi.fn(),
  };

  prisma.$transaction.mockImplementation(async (cb: unknown) =>
    typeof cb === 'function'
      ? (cb as (tx: typeof prisma) => Promise<unknown>)(prisma)
      : undefined
  );

  return prisma;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

/** A fully-populated player row for actions that read many fields. */
export function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    userId: 'u1',
    username: 'Tester',
    level: 1,
    xp: 0,
    health: 100,
    maxHealth: 100,
    energy: 100,
    hunger: 0,
    thirst: 0,
    fatigue: 0,
    sanity: 100,
    isAlive: true,
    distanceTraveled: 0,
    credits: 500,
    turns: 0,
    chapter: 1,
    reputation: 0,
    skillPoints: 0,
    upgradeCharges: 6,
    lastUpgradeReset: new Date(),
    storyFlags: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    inventory: [],
    quests: [],
    activeEncounter: null,
    vehicle: null,
    ...overrides,
  };
}

export function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    playerId: 'p1',
    type: 'Common Van',
    level: 1,
    armor: 40,
    fuel: 100,
    components: [],
    ...overrides,
  };
}

export function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    instanceId: 'i1',
    playerId: 'p1',
    baseItemId: 'Scrap Metal',
    rarity: 'COMMON',
    quantity: 5,
    currentDurability: 100,
    isUpgraded: false,
    upgradeCount: 0,
    equipSlot: null,
    ...overrides,
  };
}
