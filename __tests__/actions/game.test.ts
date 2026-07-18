/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitAction } from '../../src/actions/game';
import { prisma } from '../../src/lib/db';
import { auth } from '../../src/auth';
import { revalidatePath } from 'next/cache';

vi.mock('../../src/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('submitAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error if unauthorized', async () => {
    (auth as any).mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append('actionText', 'test action');

    const result = await submitAction(formData);

    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('should return error if actionText is empty', async () => {
    (auth as any).mockResolvedValueOnce({
      user: { email: 'test_action@example.com', name: 'test_action_user' },
    });

    const formData = new FormData();
    formData.append('actionText', '   ');

    const result = await submitAction(formData);

    expect(result).toEqual({ error: 'Action text is required' });
  });

  it('should create events and update player stats on success', async () => {
    (auth as any).mockResolvedValueOnce({
      user: { email: 'test_action@example.com', name: 'test_action_user' },
    });

    (prisma.player.findUnique as any).mockResolvedValueOnce({
      id: 'player-1',
      energy: 100,
    });

    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback({
        eventLog: { create: vi.fn() },
        player: { update: vi.fn() },
      });
    });

    const formData = new FormData();
    formData.append('actionText', 'Search the glovebox');

    const result = await submitAction(formData);

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
