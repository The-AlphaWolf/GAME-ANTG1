import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { sendMessage, systemBroadcast } from '@/actions/chat';
import { npcReplyTo } from '@/actions/npc';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { type PrismaMock } from '../helpers/prisma-mock';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/actions/npc', () => ({ npcReplyTo: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('../helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

const db = prisma as unknown as PrismaMock;

describe('Chat Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('fails if not logged in', async () => {
      (auth as Mock).mockResolvedValue(null);
      expect((await sendMessage('Hello')).error).toBe('Unauthorized');
    });

    it('fails if the message is empty', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
      expect((await sendMessage('   ')).error).toBe('Message cannot be empty');
    });

    it('fails if the message is too long', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
      expect((await sendMessage('a'.repeat(201))).error).toBe(
        'Message is too long'
      );
    });

    it('stores the message and gives an NPC a chance to answer', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'Tester' } });
      db.player.findUnique.mockResolvedValue({
        username: 'Tester',
        distanceTraveled: 0,
      });

      const result = await sendMessage('Anyone seen Boone?', 'WORLD');

      expect(db.chatMessage.create).toHaveBeenCalledWith({
        data: {
          channel: 'WORLD',
          sender: 'Tester',
          message: 'Anyone seen Boone?',
        },
      });
      expect(npcReplyTo).toHaveBeenCalledWith(
        'Anyone seen Boone?',
        'Tester',
        1
      );
      expect(result.success).toBe(true);
    });
  });

  describe('systemBroadcast', () => {
    it('creates a system message without auth', async () => {
      const result = await systemBroadcast('Server is rebooting', 'SYSTEM');

      expect(db.chatMessage.create).toHaveBeenCalledWith({
        data: {
          channel: 'SYSTEM',
          sender: 'System',
          message: 'Server is rebooting',
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
