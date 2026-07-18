import { describe, it, expect, vi } from 'vitest';
import { PlayerRepository } from '../../src/lib/repositories/player.repository';
import { prisma } from '../../src/lib/db';

vi.mock('../../src/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('PlayerRepository', () => {
  it('should get player by username', async () => {
    const mockPlayer = {
      id: 'player-1',
      username: 'AlphaWolf',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.player.findUnique as any).mockResolvedValue(mockPlayer);

    const result = await PlayerRepository.getPlayerByUsername('AlphaWolf');

    expect(prisma.player.findUnique).toHaveBeenCalledWith({
      where: { username: 'AlphaWolf' },
      include: { vehicle: true },
    });
    expect(result).toEqual(mockPlayer);
  });
});
