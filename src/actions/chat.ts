'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function sendMessage(message: string, channel: string = 'WORLD') {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  if (!message || message.trim().length === 0) {
    return { error: 'Message cannot be empty' };
  }

  if (message.length > 200) {
    return { error: 'Message is too long' };
  }

  try {
    await prisma.chatMessage.create({
      data: {
        channel,
        sender: session.user.name,
        message: message.trim(),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { error: 'Failed to send message' };
  }
}

export async function systemBroadcast(
  message: string,
  channel: string = 'WORLD'
) {
  try {
    await prisma.chatMessage.create({
      data: {
        channel,
        sender: 'System',
        message: message.trim(),
      },
    });

    // In a real app we might not want to revalidate on every system broadcast if it's very frequent,
    // but for our current architecture, it's fine.
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to broadcast system message:', error);
    return { error: 'Failed to broadcast' };
  }
}
