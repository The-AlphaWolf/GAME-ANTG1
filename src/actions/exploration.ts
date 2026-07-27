'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { progressQuests } from '@/actions/quests';
import { maybePruneEventLog } from '@/lib/game/event-log';
import { chapterForMiles, crossedStoryBeats } from '@/lib/game/story';
import { instantiateEnemy, rollEnemyForTier } from '@/lib/game/enemies';
import { rollCacheFound, rollLoot } from '@/lib/game/loot';
import { rollNpcEncounter } from '@/lib/game/npcs';
import { computeVehicleBonuses } from '@/lib/game/vehicle';
import { weatherFromTurns } from '@/lib/game/world';
import { pickWeighted } from '@/lib/game/random';
import {
  advanceTurns,
  awardXp,
  describeGrants,
  grantItems,
  logNarrative,
} from '@/lib/game/engine';
import { npcChatterTick } from '@/actions/npc';

const BASE_FUEL_COST = 4;
const BASE_DISTANCE_GAIN = 10;
const SCAVENGE_ENERGY_COST = 5;
const DRIVE_XP = 6;
const SCAVENGE_XP = 4;

type DriveEvent = 'empty' | 'loot' | 'combat' | 'npc' | 'cache';

export async function explore() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: {
      vehicle: { include: { components: true } },
      activeEncounter: true,
    },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (player.activeEncounter) return { error: 'Cannot drive while in combat' };
  if (!player.vehicle) return { error: 'You need a vehicle to explore' };

  const weather = weatherFromTurns(player.turns);
  const bonuses = computeVehicleBonuses(player.vehicle.components);
  const fuelCost = Math.max(
    1,
    Math.round(BASE_FUEL_COST * weather.fuelFactor * bonuses.fuelEfficiency)
  );
  const distanceGain = BASE_DISTANCE_GAIN + bonuses.speedBonus;

  if (player.vehicle.fuel < fuelCost) {
    return { error: 'Not enough fuel to drive. Craft or buy a Fuel Canister.' };
  }

  const oldMiles = player.distanceTraveled;
  const newMiles = oldMiles + distanceGain;
  const chapter = chapterForMiles(newMiles);
  const tier = chapter.tier;

  // Weighted so most drives pay out. The old table was 45% nothing / 40%
  // scrap / 15% combat, which read as "press button, nothing happens".
  const eventType = pickWeighted<DriveEvent>([
    { value: 'loot', weight: 34 },
    { value: 'combat', weight: 24 },
    { value: 'npc', weight: 16 },
    { value: 'empty', weight: 14 },
    { value: 'cache', weight: rollCacheFound(tier) ? 12 : 0 },
  ]);

  const storyBeats = crossedStoryBeats(oldMiles, newMiles);

  try {
    let questHooks: (() => Promise<void>)[] = [];

    await prisma.$transaction(async (tx) => {
      const moved = await tx.player.updateMany({
        where: { id: player.id, isAlive: true, health: { gt: 0 } },
        data: {
          distanceTraveled: { increment: distanceGain },
          chapter: Math.max(player.chapter, chapter.number),
        },
      });
      if (moved.count === 0) throw new Error('You are dead');

      const fueled = await tx.vehicle.updateMany({
        where: { id: player.vehicle!.id, fuel: { gte: fuelCost } },
        data: { fuel: { decrement: fuelCost } },
      });
      if (fueled.count === 0) throw new Error('Not enough fuel to drive');

      switch (eventType) {
        case 'empty': {
          await logNarrative(
            tx,
            player.id,
            `You drive ${distanceGain} miles down ${chapter.zone}. ${weather.label.toLowerCase()} the whole way, and nothing on the road but you.`
          );
          break;
        }

        case 'loot': {
          const drops = rollLoot('DRIVE', tier);
          await grantItems(tx, player.id, drops);
          await logNarrative(
            tx,
            player.id,
            `You pull over at a stripped hauler and come away with ${describeGrants(drops)}.`
          );
          questHooks = drops.map(
            (drop) => () =>
              progressQuests(
                player.id,
                'GATHER',
                drop.baseItemId,
                drop.quantity
              )
          );
          break;
        }

        case 'cache': {
          const drops = rollLoot('CACHE', tier);
          await grantItems(tx, player.id, drops);
          await logNarrative(
            tx,
            player.id,
            `A sealed roadside cache, still pressurised — nobody has touched it since the collapse. Inside: ${describeGrants(drops)}.`
          );
          questHooks = drops.map(
            (drop) => () =>
              progressQuests(
                player.id,
                'GATHER',
                drop.baseItemId,
                drop.quantity
              )
          );
          break;
        }

        case 'npc': {
          const meeting = rollNpcEncounter(chapter.number, player.username);
          await tx.npcRelation.upsert({
            where: {
              playerId_npcId: { playerId: player.id, npcId: meeting.npc.id },
            },
            create: {
              playerId: player.id,
              npcId: meeting.npc.id,
              affinity: meeting.affinityGain,
              metCount: 1,
            },
            update: {
              affinity: { increment: meeting.affinityGain },
              metCount: { increment: 1 },
            },
          });

          const gift = giftForKind(meeting.gift);
          if (gift.items.length > 0) {
            await grantItems(tx, player.id, gift.items);
          }
          if (gift.credits > 0) {
            await tx.player.update({
              where: { id: player.id },
              data: { credits: { increment: gift.credits } },
            });
          }

          await logNarrative(
            tx,
            player.id,
            `${meeting.greeting} ${gift.text}`,
            'NPC_ENCOUNTER'
          );
          break;
        }

        case 'combat': {
          const def = rollEnemyForTier(tier);
          const enemy = instantiateEnemy(def, player.level);

          await tx.activeEncounter.create({
            data: {
              playerId: player.id,
              enemyName: def.name,
              enemyHp: enemy.hp,
              enemyMaxHp: enemy.hp,
              enemyAttack: enemy.attack,
            },
          });

          await logNarrative(
            tx,
            player.id,
            `AMBUSH — a ${def.name} blocks the road. ${def.description}`,
            'COMBAT_START'
          );
          break;
        }
      }

      for (const beat of storyBeats) {
        await logNarrative(
          tx,
          player.id,
          beat.text,
          beat.isWin ? 'STORY_WIN' : 'STORY_BEAT'
        );
      }

      const xp = await awardXp(tx, player, DRIVE_XP + storyBeats.length * 40);
      if (xp.narrative)
        await logNarrative(tx, player.id, xp.narrative, 'LEVEL_UP');

      const turn = await advanceTurns(tx, player, 1);
      for (const warning of turn.warnings) {
        await logNarrative(tx, player.id, warning, 'SURVIVAL_WARNING');
      }
      if (turn.died) {
        await logNarrative(
          tx,
          player.id,
          'Your body gives out before the road does. The van rolls to a stop on its own.',
          'PLAYER_DIED'
        );
      }

      await maybePruneEventLog(tx, player.id);
    });

    await progressQuests(player.id, 'TRAVEL', 'miles', distanceGain);
    for (const hook of questHooks) await hook();
    await npcChatterTick(player.id, player.username, chapter.number);

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Explore failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Exploration failed',
    };
  }
}

export async function scavenge() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { activeEncounter: true },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (player.activeEncounter)
    return { error: 'Cannot scavenge while in combat' };
  if (player.energy < SCAVENGE_ENERGY_COST)
    return { error: 'Too exhausted to scavenge. Rest first.' };

  const chapter = chapterForMiles(player.distanceTraveled);
  const tier = chapter.tier;

  const eventType = pickWeighted<DriveEvent>([
    { value: 'loot', weight: 52 },
    { value: 'empty', weight: 18 },
    { value: 'combat', weight: 18 },
    { value: 'cache', weight: 12 },
  ]);

  try {
    let questHooks: (() => Promise<void>)[] = [];

    await prisma.$transaction(async (tx) => {
      const spent = await tx.player.updateMany({
        where: {
          id: player.id,
          isAlive: true,
          health: { gt: 0 },
          energy: { gte: SCAVENGE_ENERGY_COST },
        },
        data: { energy: { decrement: SCAVENGE_ENERGY_COST } },
      });
      if (spent.count === 0) throw new Error('Too exhausted to scavenge');

      switch (eventType) {
        case 'empty': {
          await logNarrative(
            tx,
            player.id,
            'You comb the wreckage line for twenty minutes and come back with grazed knuckles and nothing else.'
          );
          break;
        }
        case 'loot': {
          const drops = rollLoot('SCAVENGE', tier);
          await grantItems(tx, player.id, drops);
          await logNarrative(
            tx,
            player.id,
            `You work the debris field and salvage ${describeGrants(drops)}.`
          );
          questHooks = drops.map(
            (drop) => () =>
              progressQuests(
                player.id,
                'GATHER',
                drop.baseItemId,
                drop.quantity
              )
          );
          break;
        }
        case 'cache': {
          const drops = rollLoot('CACHE', tier);
          await grantItems(tx, player.id, drops);
          await logNarrative(
            tx,
            player.id,
            `Under a collapsed awning: a supply drop nobody ever came back for. ${describeGrants(drops)}.`
          );
          questHooks = drops.map(
            (drop) => () =>
              progressQuests(
                player.id,
                'GATHER',
                drop.baseItemId,
                drop.quantity
              )
          );
          break;
        }
        case 'combat': {
          const def = rollEnemyForTier(tier);
          const enemy = instantiateEnemy(def, player.level);
          await tx.activeEncounter.create({
            data: {
              playerId: player.id,
              enemyName: def.name,
              enemyHp: enemy.hp,
              enemyMaxHp: enemy.hp,
              enemyAttack: enemy.attack,
            },
          });
          await logNarrative(
            tx,
            player.id,
            `A ${def.name} was waiting inside the wreck and comes out fast. ${def.description}`,
            'COMBAT_START'
          );
          break;
        }
      }

      const xp = await awardXp(tx, player, SCAVENGE_XP);
      if (xp.narrative)
        await logNarrative(tx, player.id, xp.narrative, 'LEVEL_UP');

      const turn = await advanceTurns(tx, player, 1);
      for (const warning of turn.warnings) {
        await logNarrative(tx, player.id, warning, 'SURVIVAL_WARNING');
      }

      await maybePruneEventLog(tx, player.id);
    });

    for (const hook of questHooks) await hook();
    await npcChatterTick(player.id, player.username, chapter.number);

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Scavenge failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Scavenging failed',
    };
  }
}

// ------------------------------------------------------
// NPC road-meeting gifts
// ------------------------------------------------------

function giftForKind(kind: string): {
  items: { baseItemId: string; quantity: number }[];
  credits: number;
  text: string;
} {
  switch (kind) {
    case 'MEDICAL':
      return {
        items: [
          { baseItemId: 'First Aid Kit', quantity: 1 },
          { baseItemId: 'Bandage', quantity: 2 },
        ],
        credits: 0,
        text: 'They push a medical bundle through your window and refuse payment.',
      };
    case 'FUEL':
      return {
        items: [{ baseItemId: 'Fuel Canister', quantity: 2 }],
        credits: 0,
        text: 'Two canisters go in the back before you can argue about it.',
      };
    case 'CREDITS':
      return {
        items: [],
        credits: 120,
        text: 'They buy the scrap off your roof rack on the spot — 120 EC, no haggling.',
      };
    case 'SUPPLIES':
      return {
        items: [
          { baseItemId: 'Small Rations', quantity: 2 },
          { baseItemId: 'Clean Water', quantity: 2 },
        ],
        credits: 0,
        text: 'You leave with food and water you did not have to bleed for.',
      };
    case 'INTEL':
    default:
      return {
        items: [
          { baseItemId: 'Clean Water', quantity: 1 },
          { baseItemId: 'Small Rations', quantity: 1 },
        ],
        credits: 60,
        text: 'They mark two safe pull-offs on your map and split their rations with you.',
      };
  }
}
