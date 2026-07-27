'use server';

import { prisma } from '@/lib/db';
import { rollChatter, rollReply, NPCS } from '@/lib/game/npcs';
import { chance } from '@/lib/game/random';

const CHATTER_ODDS = 0.35;
const CHAT_HISTORY_LIMIT = 120;

/**
 * The world radio only felt dead because nothing ever spoke on it. Every few
 * player turns someone from the current chapter's cast broadcasts a line.
 */
export async function npcChatterTick(
  playerId: string,
  playerName: string,
  chapter: number
): Promise<void> {
  if (!chance(CHATTER_ODDS)) return;

  const line = rollChatter(chapter, playerName);
  try {
    await prisma.chatMessage.create({
      data: {
        channel: 'WORLD',
        sender: line.sender,
        message: line.message,
        npcId: line.npcId,
      },
    });
    await trimChatHistory();
  } catch (error) {
    // Radio chatter is cosmetic: never fail a player's turn over it.
    console.error('NPC chatter failed:', error);
  }
  void playerId;
}

/** Someone in the current cast answers a player's world-chat message. */
export async function npcReplyTo(
  playerMessage: string,
  playerName: string,
  chapter: number
): Promise<void> {
  const reply = rollReply(playerMessage, chapter, playerName);
  if (!reply) return;

  try {
    await prisma.chatMessage.create({
      data: {
        channel: 'WORLD',
        sender: reply.sender,
        message: reply.message,
        npcId: reply.npcId,
      },
    });
    await trimChatHistory();
  } catch (error) {
    console.error('NPC reply failed:', error);
  }
}

/** World chat is a shared table with no owner, so cap it here. */
async function trimChatHistory(): Promise<void> {
  const total = await prisma.chatMessage.count();
  if (total <= CHAT_HISTORY_LIMIT) return;

  const oldest = await prisma.chatMessage.findMany({
    orderBy: { createdAt: 'asc' },
    take: total - CHAT_HISTORY_LIMIT,
    select: { id: true },
  });
  await prisma.chatMessage.deleteMany({
    where: { id: { in: oldest.map((m) => m.id) } },
  });
}

/** Seeds an opening exchange so a brand-new player never sees an empty radio. */
export async function seedOpeningChatter(playerName: string): Promise<void> {
  const opening = [
    {
      npc: 'sister_ada',
      text: `New signal on the eastbound channel. Welcome to Highway 17, ${playerName}. Check in when you can.`,
    },
    {
      npc: 'wren',
      text: `oh nice, fresh wheels. ${playerName} right? stick to the left fork at the first junction, trust me`,
    },
    {
      npc: 'boone',
      text: 'Trading post is open at the salvage bay. Water, rations, fuel. No credit.',
    },
    {
      npc: 'doc_marlow',
      text: 'Mile Zero clinic has beds free tonight. No charge, never a charge.',
    },
  ];

  try {
    for (const line of opening) {
      const def = NPCS.find((n) => n.id === line.npc);
      if (!def) continue;
      await prisma.chatMessage.create({
        data: {
          channel: 'WORLD',
          sender: def.handle,
          message: line.text,
          npcId: def.id,
        },
      });
    }
  } catch (error) {
    console.error('Opening chatter failed:', error);
  }
}
