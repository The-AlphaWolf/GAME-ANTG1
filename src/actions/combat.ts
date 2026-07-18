'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { progressQuests } from '@/actions/quests';
import { getRarityMultiplier } from '@/lib/game/rarity';

export async function initiateCombat(
  enemyName: string,
  maxHp: number,
  attack: number
) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };

  try {
    await prisma.$transaction(async (tx) => {
      // Clear any existing encounter
      await tx.activeEncounter.deleteMany({
        where: { playerId: player.id },
      });

      // Spawn encounter
      await tx.activeEncounter.create({
        data: {
          playerId: player.id,
          enemyName,
          enemyHp: maxHp,
          enemyMaxHp: maxHp,
          enemyAttack: attack,
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: `You are attacked by ${enemyName}!` },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Initiate combat failed:', error);
    return { error: 'Failed to initiate combat' };
  }
}

export type CombatAction = 'ATTACK' | 'DEFEND' | 'FLEE';

export async function executeCombatTurn(action: CombatAction) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { activeEncounter: true, inventory: true },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (!player.activeEncounter) return { error: 'No active encounter' };

  const encounter = player.activeEncounter;

  try {
    let enemyDead = false;

    await prisma.$transaction(async (tx) => {
      let playerDamage = 0;
      let enemyDamage = 0;
      let narrativeText = '';
      let encounterEnded = false;

      // Base stats
      const equippedWeapon = player.inventory.find(
        (i) => i.equipSlot === 'WEAPON'
      );
      // Simplified damage logic: 10 base damage + level + weapon modifier
      let weaponDamage = 0;
      if (equippedWeapon) {
        weaponDamage = 15 * getRarityMultiplier(equippedWeapon.rarity);
      }
      const baseAttack = Math.floor(10 + player.level + weaponDamage);

      switch (action) {
        case 'ATTACK':
          playerDamage = baseAttack;
          enemyDamage = encounter.enemyAttack;
          narrativeText = `You attack the ${encounter.enemyName} for ${playerDamage} damage. The ${encounter.enemyName} counter-attacks for ${enemyDamage} damage!`;
          break;
        case 'DEFEND':
          playerDamage = 0;
          enemyDamage = Math.max(0, encounter.enemyAttack - 15); // Reduce damage taken
          narrativeText = `You take a defensive stance, reducing incoming damage to ${enemyDamage}.`;
          break;
        case 'FLEE':
          // Simplified flee logic: 50% chance
          const success = Math.random() > 0.5;
          if (success) {
            narrativeText = `You successfully fled from the ${encounter.enemyName}!`;
            encounterEnded = true;
          } else {
            enemyDamage = Math.floor(encounter.enemyAttack * 1.2); // Flee failure penalty
            narrativeText = `You failed to flee! The ${encounter.enemyName} strikes your exposed back for ${enemyDamage} damage!`;
          }
          break;
      }

      // Apply damage
      const newEnemyHp = Math.max(0, encounter.enemyHp - playerDamage);
      const newPlayerHp = Math.max(0, Math.floor(player.health - enemyDamage));
      const playerDied = newPlayerHp <= 0;
      let bounty = 0;

      if (newEnemyHp <= 0 && !playerDied) {
        bounty = 15 + Math.floor(Math.random() * 11); // 15-25 EC
        narrativeText += ` You defeated the ${encounter.enemyName} and loot ${bounty} EC from the wreckage!`;
        encounterEnded = true;
        enemyDead = true;
      }

      if (playerDied) {
        narrativeText += ` The blow is fatal. You collapse on the asphalt as the world fades to black...`;
        encounterEnded = true;
      }

      // Update Player
      await tx.player.update({
        where: { id: player.id },
        data: {
          health: newPlayerHp,
          isAlive: !playerDied,
          ...(bounty > 0 && { credits: { increment: bounty } }),
        },
      });

      // Log combat turn event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'COMBAT_TURN',
          payload: {
            action,
            playerDamage,
            enemyDamage,
            newEnemyHp,
            newPlayerHp,
          },
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: narrativeText },
        },
      });

      if (encounterEnded) {
        await tx.activeEncounter.delete({ where: { id: encounter.id } });
      } else {
        await tx.activeEncounter.update({
          where: { id: encounter.id },
          data: { enemyHp: newEnemyHp },
        });
      }
    });

    if (enemyDead) {
      await progressQuests(player.id, 'KILL', encounter.enemyName, 1);
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Execute combat turn failed:', error);
    return { error: 'Failed to execute combat turn' };
  }
}
