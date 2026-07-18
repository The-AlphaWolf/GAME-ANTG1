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

  if (!player.isAlive || player.health <= 0) {
    return { error: 'You are dead' };
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

export async function respawn() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'Unauthorized' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  // Only allow respawning when actually dead (isAlive false, or stuck at 0 hp)
  if (player.isAlive && player.health > 0) {
    return { error: 'You are still alive' };
  }

  // Death penalty: lose half your credits
  const creditsLost = Math.floor(player.credits / 2);

  try {
    await prisma.$transaction(async (tx) => {
      // Clear any lingering encounter
      await tx.activeEncounter.deleteMany({ where: { playerId: player.id } });

      await tx.player.update({
        where: { id: player.id },
        data: {
          isAlive: true,
          health: 50,
          energy: 50,
          sanity: Math.max(25, player.sanity),
          credits: player.credits - creditsLost,
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text:
              creditsLost > 0
                ? `You wake up battered by the roadside. Someone went through your pockets — ${creditsLost} EC gone. The road doesn't care.`
                : `You wake up battered by the roadside. The road doesn't care.`,
          },
        },
      });
    });
  } catch (error) {
    console.error('Failed to respawn:', error);
    return { error: 'Failed to respawn' };
  }

  revalidatePath('/');
  return { success: true };
}
