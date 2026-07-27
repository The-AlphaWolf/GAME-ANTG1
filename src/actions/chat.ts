'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { chapterForMiles } from '@/lib/game/story';
import { npcReplyTo } from '@/actions/npc';

export async function sendMessage(message: string, channel: string = 'WORLD') {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const trimmed = message?.trim() ?? '';
  if (trimmed.length === 0) return { error: 'Message cannot be empty' };
  if (trimmed.length > 200) return { error: 'Message is too long' };

  try {
    await prisma.chatMessage.create({
      data: { channel, sender: session.user.name, message: trimmed },
    });

    // Somebody on the channel answers. The radio used to be a write-only
    // box that said "Radio silence..." forever.
    const player = await prisma.player.findUnique({
      where: { username: session.user.name },
      select: { distanceTraveled: true, username: true },
    });
    if (player) {
      const chapter = chapterForMiles(player.distanceTraveled).number;
      await npcReplyTo(trimmed, player.username, chapter);
    }

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
      data: { channel, sender: 'System', message: message.trim() },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to broadcast system message:', error);
    return { error: 'Failed to broadcast' };
  }
}
