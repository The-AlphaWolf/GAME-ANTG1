'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'Unauthorized' };
  }

  const actionText = formData.get('actionText') as string;
  if (!actionText || actionText.trim() === '') {
    return { error: 'Action text is required' };
  }

  // Get the current player
  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  // Determine mock effects (drain 2 energy per action)
  const newEnergy = Math.max(0, player.energy - 2);
  const narrativeResponse = `You tried to: "${actionText}". It echoes into the void.`;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Record Player Action Event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'PLAYER_ACTION',
          payload: { action: actionText },
        },
      });

      // 2. Update Player Projection
      await tx.player.update({
        where: { id: player.id },
        data: { energy: newEnergy },
      });

      // 3. Record System Narrative Event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: narrativeResponse },
        },
      });
    });
  } catch (error) {
    console.error('Failed to process action:', error);
    return { error: 'Failed to process action' };
  }

  // Refresh the UI
  revalidatePath('/');
  return { success: true };
}
