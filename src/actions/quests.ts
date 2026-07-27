'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { QUEST_REGISTRY, QuestType } from '@/lib/game/quests';
import { chapterForMiles } from '@/lib/game/story';
import { awardXp, grantItems, logNarrative } from '@/lib/game/engine';

export async function acceptQuest(questId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });
  if (!player) return { error: 'Player not found' };

  const quest = QUEST_REGISTRY[questId];
  if (!quest) return { error: 'Invalid quest' };

  const chapter = chapterForMiles(player.distanceTraveled).number;
  if (quest.chapter > chapter) {
    return {
      error: 'That bounty has not been posted yet. Drive further east.',
    };
  }

  try {
    const existing = await prisma.activeQuest.findUnique({
      where: { playerId_questId: { playerId: player.id, questId } },
    });
    if (existing) return { error: 'Quest already accepted or completed' };

    await prisma.activeQuest.create({
      data: { playerId: player.id, questId, progress: 0, status: 'ACTIVE' },
    });

    await prisma.eventLog.create({
      data: {
        playerId: player.id,
        eventType: 'QUEST_ACCEPTED',
        payload: {
          text: `${quest.giver} posts a bounty and you take it: ${quest.title}. ${quest.description}`,
        },
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

  const quest = QUEST_REGISTRY[questId];
  if (!quest) return { error: 'Invalid quest' };

  const active = await prisma.activeQuest.findUnique({
    where: { playerId_questId: { playerId: player.id, questId } },
  });
  if (!active || active.status !== 'ACTIVE')
    return { error: 'Quest not active' };
  if (active.progress < quest.targetQuantity)
    return { error: 'Quest objectives not met' };

  try {
    await prisma.$transaction(async (tx) => {
      // Guard against a double turn-in racing itself for the rewards.
      const closed = await tx.activeQuest.updateMany({
        where: { id: active.id, status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });
      if (closed.count === 0) throw new Error('Quest already turned in');

      if (quest.rewards.credits || quest.rewards.reputation) {
        await tx.player.update({
          where: { id: player.id },
          data: {
            ...(quest.rewards.credits && {
              credits: { increment: quest.rewards.credits },
            }),
            ...(quest.rewards.reputation && {
              reputation: { increment: quest.rewards.reputation },
            }),
          },
        });
      }

      if (quest.rewards.items?.length) {
        await grantItems(
          tx,
          player.id,
          quest.rewards.items.map((i) => ({
            baseItemId: i.itemId,
            quantity: i.quantity,
          }))
        );
      }

      const rewardParts = [
        quest.rewards.credits ? `${quest.rewards.credits} EC` : null,
        quest.rewards.xp ? `${quest.rewards.xp} XP` : null,
        quest.rewards.reputation
          ? `+${quest.rewards.reputation} standing`
          : null,
        quest.rewards.items?.length
          ? quest.rewards.items
              .map((i) => `${i.quantity}x ${i.itemId}`)
              .join(', ')
          : null,
      ].filter(Boolean);

      await logNarrative(
        tx,
        player.id,
        `${quest.giver} settles up for ${quest.title}: ${rewardParts.join(', ')}. Word gets around.`,
        'QUEST_COMPLETED'
      );

      // XP is awarded last so a level-up narrative lands after the payout.
      const xp = await awardXp(tx, player, quest.rewards.xp ?? 0);
      if (xp.narrative)
        await logNarrative(tx, player.id, xp.narrative, 'LEVEL_UP');
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to turn in quest:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to turn in quest',
    };
  }
}

/**
 * Called from combat/exploration whenever the player kills something, gathers
 * something, or covers ground. TRAVEL quests were impossible before because
 * nothing ever reported mileage.
 */
export async function progressQuests(
  playerId: string,
  type: QuestType,
  targetId: string,
  amount: number = 1
) {
  if (amount <= 0) return;

  const activeQuests = await prisma.activeQuest.findMany({
    where: { playerId, status: 'ACTIVE' },
  });

  for (const quest of activeQuests) {
    const def = QUEST_REGISTRY[quest.questId];
    if (!def || def.type !== type || def.targetId !== targetId) continue;

    const newProgress = Math.min(quest.progress + amount, def.targetQuantity);
    if (newProgress <= quest.progress) continue;

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
            text: `Objective met for "${def.title}". ${def.giver} is waiting on the Bounty Board.`,
          },
        },
      });
    }
  }
}
