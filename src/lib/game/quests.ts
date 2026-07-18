export type QuestType = 'KILL' | 'GATHER';

export interface QuestReward {
  credits?: number;
  xp?: number;
  items?: { itemId: string; quantity: number }[];
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  targetId: string; // The enemy name or the item ID
  targetQuantity: number;
  rewards: QuestReward;
}

export const QUEST_REGISTRY: Record<string, QuestTemplate> = {
  q_kill_wolves: {
    id: 'q_kill_wolves',
    title: 'Wolf Cull',
    description:
      'The mutated wolves are getting too close to the settlement. Thin their numbers.',
    type: 'KILL',
    targetId: 'Mutated Wolf',
    targetQuantity: 5,
    rewards: {
      credits: 100,
      xp: 50,
      items: [{ itemId: 'Bandage', quantity: 2 }],
    },
  },
  q_gather_wood: {
    id: 'q_gather_wood',
    title: 'Firewood Needed',
    description:
      'We need wood for the upcoming winter. Scavenge the nearby area.',
    type: 'GATHER',
    targetId: 'Wood',
    targetQuantity: 10,
    rewards: {
      credits: 50,
      xp: 20,
    },
  },
  q_kill_raiders: {
    id: 'q_kill_raiders',
    title: 'Raider Threat',
    description:
      'A gang of raiders has been ambushing scavengers. Eliminate them.',
    type: 'KILL',
    targetId: 'Scavenger',
    targetQuantity: 3,
    rewards: {
      credits: 200,
      xp: 100,
      items: [{ itemId: '9mm Ammo', quantity: 10 }],
    },
  },
};
