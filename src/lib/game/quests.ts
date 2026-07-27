// Bounty board. The old registry targeted "Mutated Wolf", "Scavenger" and
// "Wood" — none of which the game could ever produce, so every quest was
// permanently unfinishable. Every target below is a real enemy name from
// enemies.ts or a real item id from items.ts.

export type QuestType = 'KILL' | 'GATHER' | 'TRAVEL';

export interface QuestReward {
  credits?: number;
  xp?: number;
  items?: { itemId: string; quantity: number }[];
  reputation?: number;
}

export interface QuestTemplate {
  id: string;
  title: string;
  giver: string; // npc handle
  description: string;
  type: QuestType;
  /** Enemy name, item id, or mile total depending on `type`. */
  targetId: string;
  targetQuantity: number;
  /** Chapter the quest becomes available in. */
  chapter: number;
  rewards: QuestReward;
}

export const QUEST_REGISTRY: Record<string, QuestTemplate> = {
  q_clear_the_shoulder: {
    id: 'q_clear_the_shoulder',
    title: 'Clear the Shoulder',
    giver: 'WREN',
    description:
      'Wren cannot run her stash line while raiders are camped on the shoulder. Put three Highway Raiders down.',
    type: 'KILL',
    targetId: 'Highway Raider',
    targetQuantity: 3,
    chapter: 1,
    rewards: {
      credits: 120,
      xp: 90,
      reputation: 2,
      items: [{ itemId: 'Bandage', quantity: 2 }],
    },
  },
  q_scrap_for_boone: {
    id: 'q_scrap_for_boone',
    title: 'Boone Pays for Scrap',
    giver: 'BOONE',
    description:
      'Boone is rebuilding his salvage bay wall. Bring him 20 Scrap Metal and he will make it worth the trip.',
    type: 'GATHER',
    targetId: 'Scrap Metal',
    targetQuantity: 20,
    chapter: 1,
    rewards: {
      credits: 180,
      xp: 70,
      items: [{ itemId: 'Fuel Canister', quantity: 1 }],
    },
  },
  q_marlow_supplies: {
    id: 'q_marlow_supplies',
    title: 'Clinic Restock',
    giver: 'MARLOW',
    description:
      'The Mile Zero clinic is out of clean water. Marlow needs 8 bottles and will not ask twice.',
    type: 'GATHER',
    targetId: 'Clean Water',
    targetQuantity: 8,
    chapter: 1,
    rewards: {
      credits: 140,
      xp: 80,
      reputation: 3,
      items: [{ itemId: 'First Aid Kit', quantity: 2 }],
    },
  },
  q_first_hundred: {
    id: 'q_first_hundred',
    title: 'The First Hundred',
    giver: 'ADA',
    description:
      'Ada is counting who is still moving. Put 100 miles behind you and check in on the channel.',
    type: 'TRAVEL',
    targetId: 'miles',
    targetQuantity: 100,
    chapter: 1,
    rewards: { credits: 100, xp: 120, reputation: 2 },
  },
  q_corridor_toll: {
    id: 'q_corridor_toll',
    title: 'Break the Toll',
    giver: 'KESTREL',
    description:
      'The Corridor Toll Gang answers to Vane. Break two of their crews and the Corridor opens up.',
    type: 'KILL',
    targetId: 'Corridor Toll Gang',
    targetQuantity: 2,
    chapter: 2,
    rewards: {
      credits: 320,
      xp: 240,
      reputation: 4,
      items: [{ itemId: 'Scrap Cleaver', quantity: 1 }],
    },
  },
  q_tick_electronics: {
    id: 'q_tick_electronics',
    title: 'Boards for Tick',
    giver: 'TICK',
    description:
      'Tick can rebuild your fuel system if you bring him 6 Electronics off dead dashboards.',
    type: 'GATHER',
    targetId: 'Electronics',
    targetQuantity: 6,
    chapter: 2,
    rewards: {
      credits: 260,
      xp: 180,
      items: [
        { itemId: 'Repair Kit', quantity: 1 },
        { itemId: 'Fuel Canister', quantity: 2 },
      ],
    },
  },
  q_outriders: {
    id: 'q_outriders',
    title: "Vane's Eyes",
    giver: 'KESTREL',
    description:
      'Convoy Outriders are how Vane tracks you. Take four off the road and he goes blind for a while.',
    type: 'KILL',
    targetId: 'Convoy Outrider',
    targetQuantity: 4,
    chapter: 3,
    rewards: {
      credits: 600,
      xp: 500,
      reputation: 6,
      items: [{ itemId: 'Riot Vest', quantity: 1 }],
    },
  },
  q_the_long_haul: {
    id: 'q_the_long_haul',
    title: 'The Long Haul',
    giver: 'ADA',
    description:
      'Five hundred miles east. Ada says nobody on her channel has managed it this season.',
    type: 'TRAVEL',
    targetId: 'miles',
    targetQuantity: 500,
    chapter: 3,
    rewards: {
      credits: 700,
      xp: 650,
      reputation: 5,
      items: [{ itemId: 'Scrap Pistol', quantity: 1 }],
    },
  },
  q_ridge_walkers: {
    id: 'q_ridge_walkers',
    title: 'What Walks the Ridge',
    giver: 'ADA',
    description:
      'Three Slag Walkers still patrol the burn at Black Ridge. Ada wants them put to rest.',
    type: 'KILL',
    targetId: 'Slag Walker',
    targetQuantity: 3,
    chapter: 4,
    rewards: {
      credits: 1100,
      xp: 1000,
      reputation: 8,
      items: [{ itemId: 'Convoy Carbine', quantity: 1 }],
    },
  },
};

export const ALL_QUESTS = Object.values(QUEST_REGISTRY);

export function questsForChapter(chapter: number): QuestTemplate[] {
  return ALL_QUESTS.filter((q) => q.chapter <= chapter);
}
