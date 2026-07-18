'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { QUEST_REGISTRY, QuestType } from '@/lib/game/quests';

export async function acceptQuest(questId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });
  if (!player) return { error: 'Player not found' };

  const questDef = QUEST_REGISTRY[questId];
  if (!questDef) return { error: 'Invalid quest' };

  try {
    const existing = await prisma.activeQuest.findUnique({
      where: { playerId_questId: { playerId: player.id, questId } },
    });

    if (existing) {
      return { error: 'Quest already accepted or completed' };
    }

    await prisma.activeQuest.create({
      data: {
        playerId: player.id,
        questId,
        progress: 0,
        status: 'ACTIVE',
      },
    });

    await prisma.eventLog.create({
      data: {
        playerId: player.id,
        eventType: 'QUEST_ACCEPTED',
        payload: { text: `Accepted quest: ${questDef.title}` },
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to accept quest:', error);
    return { error: 'Failed to accept quest' };
  }
}

export async function turnInQuest(questId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });
  if (!player) return { error: 'Player not found' };

  const questDef = QUEST_REGISTRY[questId];
  if (!questDef) return { error: 'Invalid quest' };

  const activeQuest = await prisma.activeQuest.findUnique({
    where: { playerId_questId: { playerId: player.id, questId } },
  });

  if (!activeQuest || activeQuest.status !== 'ACTIVE') {
    return { error: 'Quest not active' };
  }

  if (activeQuest.progress < questDef.targetQuantity) {
    return { error: 'Quest objectives not met' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Mark as completed
      await tx.activeQuest.update({
        where: { id: activeQuest.id },
        data: { status: 'COMPLETED' },
      });

      // Grant rewards
      if (questDef.rewards.credits) {
        await tx.player.update({
          where: { id: player.id },
          data: { credits: { increment: questDef.rewards.credits } },
        });
      }

      if (questDef.rewards.xp) {
        // We'll increment level if we add an xp system later, for now just incrementing a generic stat or ignoring if we don't have xp.
        // Wait, does player have xp? Player has no 'xp' column currently. We'll skip xp or add it later.
      }

      if (questDef.rewards.items) {
        for (const item of questDef.rewards.items) {
          // Check if player has the item to stack
          const existingItem = await tx.playerInventory.findFirst({
            where: {
              playerId: player.id,
              baseItemId: item.itemId,
              equipSlot: null,
            },
          });

          if (existingItem) {
            await tx.playerInventory.update({
              where: { instanceId: existingItem.instanceId },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.playerInventory.create({
              data: {
                playerId: player.id,
                baseItemId: item.itemId,
                quantity: item.quantity,
              },
            });
          }
        }
      }

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'QUEST_COMPLETED',
          payload: {
            text: `Completed quest: ${questDef.title}! Rewarded ${questDef.rewards.credits || 0} EC.`,
          },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to turn in quest:', error);
    return { error: 'Failed to turn in quest' };
  }
}

// Utility function to be called from other actions (combat, exploration)
export async function progressQuests(
  playerId: string,
  type: QuestType,
  targetId: string,
  amount: number = 1
) {
  const activeQuests = await prisma.activeQuest.findMany({
    where: { playerId, status: 'ACTIVE' },
  });

  for (const quest of activeQuests) {
    const def = QUEST_REGISTRY[quest.questId];
    if (def && def.type === type && def.targetId === targetId) {
      const newProgress = Math.min(quest.progress + amount, def.targetQuantity);

      if (newProgress > quest.progress) {
        await prisma.activeQuest.update({
          where: { id: quest.id },
          data: { progress: newProgress },
        });

        if (newProgress === def.targetQuantity) {
          await prisma.eventLog.create({
            data: {
              playerId,
              eventType: 'QUEST_OBJECTIVE_COMPLETE',
              payload: {
                text: `Objective complete for: ${def.title}. Return to Bounty Board!`,
              },
            },
          });
        }
      }
    }
  }
}
