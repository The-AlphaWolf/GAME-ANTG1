import { describe, it, expect, vi, beforeEach } from 'vitest';
import { equipItem, dropItem } from '@/actions/inventory';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// Mock the dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
    playerInventory: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe('Inventory Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('equipItem', () => {
    it('should fail if user is not authenticated', async () => {
      (auth as vi.Mock).mockResolvedValue(null);
      const result = await equipItem('item123', 'WEAPON');
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should successfully equip an item', async () => {
      (auth as vi.Mock).mockResolvedValue({ user: { name: 'testuser' } });

      (prisma.player.findUnique as vi.Mock).mockResolvedValue({
        id: 'player123',
      });

      (prisma.playerInventory.findUnique as vi.Mock).mockResolvedValue({
        instanceId: 'item123',
        playerId: 'player123',
        baseItemId: 'rusty_sword',
      });

      // Mock transaction implementation to just run the callback
      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      const result = await equipItem('item123', 'WEAPON');

      expect(result).toEqual({ success: true });
      expect(prisma.playerInventory.updateMany).toHaveBeenCalledWith({
        where: { playerId: 'player123', equipSlot: 'WEAPON' },
        data: { equipSlot: null },
      });
      expect(prisma.playerInventory.update).toHaveBeenCalledWith({
        where: { instanceId: 'item123' },
        data: { equipSlot: 'WEAPON' },
      });
      expect(prisma.eventLog.create).toHaveBeenCalledTimes(2); // One for ITEM_EQUIPPED, one for SYSTEM_NARRATIVE
    });
  });

  describe('dropItem', () => {
    it('should successfully drop an item', async () => {
      (auth as vi.Mock).mockResolvedValue({ user: { name: 'testuser' } });

      (prisma.player.findUnique as vi.Mock).mockResolvedValue({
        id: 'player123',
      });

      (prisma.playerInventory.findUnique as vi.Mock).mockResolvedValue({
        instanceId: 'item123',
        playerId: 'player123',
        baseItemId: 'rusty_sword',
      });

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      const result = await dropItem('item123');

      expect(result).toEqual({ success: true });
      expect(prisma.playerInventory.delete).toHaveBeenCalledWith({
        where: { instanceId: 'item123' },
      });
      expect(prisma.eventLog.create).toHaveBeenCalledTimes(2);
    });
  });
});
