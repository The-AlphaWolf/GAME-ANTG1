import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAction } from '../../src/actions/auth';
import { prisma } from '../../src/lib/db';
// removed bcrypt import

vi.mock('../../src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

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
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user and player successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.user.findUnique as any).mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.player.findUnique as any).mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback({
        user: { create: vi.fn().mockResolvedValue({ id: 'user-1' }) },
        player: { create: vi.fn().mockResolvedValue({ id: 'player-1' }) },
        eventLog: { create: vi.fn() },
      });
    });

    const formData = new FormData();
    formData.append('username', 'TestUser');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');

    const result = await registerAction(formData);

    expect(result).toEqual({ success: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prisma.player.findUnique).toHaveBeenCalledWith({
      where: { username: 'TestUser' },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should fail if email already exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1' });

    const formData = new FormData();
    formData.append('username', 'TestUser');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');

    const result = await registerAction(formData);

    expect(result).toEqual({ error: 'Email already exists' });
  });
});
