import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { sendMessage, systemBroadcast } from '@/actions/chat';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    chatMessage: {
      create: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Chat Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('fails if not logged in', async () => {
      (auth as Mock).mockResolvedValue(null);
      const res = await sendMessage('Hello World');
      expect(res.error).toBe('Unauthorized');
    });

    it('fails if message is empty', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      const res = await sendMessage('   ');
      expect(res.error).toBe('Message cannot be empty');
    });

    it('fails if message is too long', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      const longMessage = 'a'.repeat(201);
      const res = await sendMessage(longMessage);
      expect(res.error).toBe('Message is too long');
    });

    it('creates message and revalidates path on success', async () => {
      (auth as Mock).mockResolvedValue({ user: { name: 'testuser' } });
      const res = await sendMessage('Hello World', 'WORLD');

      expect(prisma.chatMessage.create).toHaveBeenCalledWith({
        data: {
          channel: 'WORLD',
          sender: 'testuser',
          message: 'Hello World',
        },
      });
      expect(res.success).toBe(true);
    });
  });

  describe('systemBroadcast', () => {
    it('creates system message without needing auth', async () => {
      const res = await systemBroadcast('Server is rebooting', 'SYSTEM');

      expect(prisma.chatMessage.create).toHaveBeenCalledWith({
        data: {
          channel: 'SYSTEM',
          sender: 'System',
          message: 'Server is rebooting',
        },
      });
      expect(res.success).toBe(true);
    });
  });
});
