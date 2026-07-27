import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAction } from '@/actions/auth';
import { prisma } from '@/lib/db';
import { seedOpeningChatter } from '@/actions/npc';
import { type PrismaMock } from '../helpers/prisma-mock';

vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});
vi.mock('@/auth', () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('@/actions/npc', () => ({ seedOpeningChatter: vi.fn() }));

vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string;
    constructor(type: string) {
      super();
      this.type = type;
    }
  },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') },
}));

const db = prisma as unknown as PrismaMock;

function form() {
  const data = new FormData();
  data.append('username', 'TestUser');
  data.append('email', 'test@example.com');
  data.append('password', 'password123');
  return data;
}

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (cb: unknown) =>
      (cb as (tx: unknown) => Promise<unknown>)(db)
    );
    db.user.create.mockResolvedValue({ id: 'u1' });
    db.player.create.mockResolvedValue({ id: 'p1' });
    db.vehicle.create.mockResolvedValue({ id: 'v1' });
  });

  it('registers a user, a player and a fully-built starter vehicle', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.player.findUnique.mockResolvedValue(null);

    const result = await registerAction(form());

    expect(result).toEqual({ success: true });
    expect(db.$transaction).toHaveBeenCalled();

    // Registration used to create a bare Vehicle row with no components.
    const vehicleArgs = db.vehicle.create.mock.calls[0][0] as {
      data: { components: { create: unknown[] } };
    };
    expect(vehicleArgs.data.components.create).toHaveLength(6);

    // The new survivor's radio is seeded so it is never silent.
    expect(seedOpeningChatter).toHaveBeenCalledWith('TestUser');
  });

  it('fails if the email is taken', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1' });
    expect(await registerAction(form())).toEqual({
      error: 'Email already exists',
    });
  });

  it('fails if the username is taken', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.player.findUnique.mockResolvedValue({ id: 'p1' });
    expect(await registerAction(form())).toEqual({
      error: 'Username already exists',
    });
  });
});
