// The world's cast. Every NPC broadcasts on the world radio, can be met on the
// road, and remembers the player through NpcRelation.affinity.

import { pickOne, pickWeighted } from './random';

export type NpcRole =
  'ALLY' | 'TRADER' | 'MEDIC' | 'MECHANIC' | 'RIVAL' | 'ANTAGONIST';

export interface NpcDef {
  id: string;
  name: string;
  handle: string; // how they sign on over the radio
  role: NpcRole;
  faction: string;
  /** Earliest chapter this NPC starts appearing. */
  fromChapter: number;
  blurb: string;
  /** Ambient radio lines. `{player}` is substituted with the player's name. */
  chatter: string[];
  /** Said when they meet the player on the road. */
  greetings: string[];
  /** Keyword triggers for replying in world chat. */
  keywords: string[];
  /** Replies when the player mentions them or their keywords. */
  replies: string[];
}

export const NPCS: NpcDef[] = [
  {
    id: 'wren',
    name: 'Wren',
    handle: 'WREN',
    role: 'ALLY',
    faction: 'Roadside Scouts',
    fromChapter: 1,
    blurb: 'Sixteen, fearless, knows every culvert between here and Vantage.',
    chatter: [
      'heads up {player}, there is a cache under the overpass at the next mile marker. i did NOT put it there. probably.',
      'whoever keeps leaving boot prints around my stash — i see you and i am unimpressed',
      '{player} if you hit a raider block just floor it, they always jump. always.',
      'traded a Convoy patch for two ration packs today. good day. great day actually.',
      'the road hums at night out here. not wind. hum. anyway sleep well everybody',
    ],
    greetings: [
      'A kid drops off an overpass onto your hood, grinning. "Wren. You are the one everybody keeps talking about on the radio, right?"',
      'Wren waves you down with a strip of reflective tape. "Take the left fork, {player}. Right fork is a toll gang pretending to be a wreck."',
    ],
    keywords: ['wren', 'cache', 'scout', 'kid'],
    replies: [
      'on it {player}, give me a mile',
      'yeah i marked that one. bring me something shiny and it is yours',
      'ha. you say that like i have not survived out here longer than you',
    ],
  },
  {
    id: 'boone',
    name: 'Boone',
    handle: 'BOONE',
    role: 'TRADER',
    faction: 'Independent',
    fromChapter: 1,
    blurb:
      'Runs a salvage bay out of a jackknifed hauler. Fair prices, no credit.',
    chatter: [
      'Trading post is open. Water, rations, fuel. No credit, no exceptions, no hard feelings.',
      'Buying Electronics and Gun Parts at premium this week. Bring me boards, I bring you EC.',
      'Somebody sold me a First Aid Kit with the seal broken. If that was you, we are going to talk.',
      '{player}. Heard your name three times today from three different channels. That is either good business or very bad news.',
    ],
    greetings: [
      'Boone raises a hand from behind a wall of sorted salvage. "{player}. You buying, selling, or bleeding? I stock for all three."',
    ],
    keywords: ['boone', 'trade', 'buy', 'sell', 'shop', 'price'],
    replies: [
      'Prices are on the board, {player}. Board does not negotiate.',
      'Bring me Electronics. I will make it worth the detour.',
      'Cash first. I have been generous exactly once and I am still paying for it.',
    ],
  },
  {
    id: 'doc_marlow',
    name: 'Doc Marlow',
    handle: 'MARLOW',
    role: 'MEDIC',
    faction: 'Mile Zero Clinic',
    fromChapter: 1,
    blurb:
      'Field medic who never stopped being one. Treats anyone. Charges nobody.',
    chatter: [
      'Reminder for the channel: boil the runoff before you drink it. I have buried four people who did not.',
      'If you are running fever out there, stop driving. The road will still be there. You might not.',
      '{player}, your vitals came up on the last clinic sweep. Eat something. That is a prescription.',
      'Clinic has beds free tonight. No charge. Never a charge.',
    ],
    greetings: [
      'A grey-haired medic flags you into a lit awning. "Marlow. Sit down before you fall down, {player}."',
    ],
    keywords: ['marlow', 'doc', 'heal', 'medic', 'hurt', 'wounded'],
    replies: [
      'Get somewhere safe and let me look at that, {player}.',
      'Bandage first, bravado second. In that order.',
      'I have stitched worse. Not much worse, but worse.',
    ],
  },
  {
    id: 'tick',
    name: 'Tick',
    handle: 'TICK',
    role: 'MECHANIC',
    faction: 'Independent',
    fromChapter: 1,
    blurb: 'Talks to engines. Engines apparently answer.',
    chatter: [
      "Your fuel system is leaking. I do not know whose. Somebody's is. It always is.",
      'Free advice: armor is weight, weight is fuel, fuel is miles. Do the maths before you bolt on plate.',
      '{player} that van of yours sounds better than it did last week. Somebody has been maintaining it. Good.',
      'I can get thirty more miles out of any tank. Cannot get thirty more out of any driver, though.',
    ],
    greetings: [
      'A mechanic slides out from under a rig, oil to the elbows. "Tick. Pop the hood, {player}, that idle is lying to you."',
    ],
    keywords: [
      'tick',
      'vehicle',
      'van',
      'engine',
      'fuel',
      'repair',
      'mechanic',
    ],
    replies: [
      'Bring it by. I will listen to it before I touch it.',
      'Scrap Metal and twenty minutes. That is all it takes, {player}.',
      'If it is knocking, stop driving. If it is screaming, stop driving faster.',
    ],
  },
  {
    id: 'sister_ada',
    name: 'Sister Ada',
    handle: 'ADA',
    role: 'ALLY',
    faction: 'The Long Broadcast',
    fromChapter: 2,
    blurb:
      'Broadcasts scripture and coordinates on the same frequency. Both useful.',
    chatter: [
      'To everyone still moving east: you are not the last. Say it back to yourself until you believe it.',
      'The Corridor takes the impatient first. Drive slow. Arrive.',
      'I read your name in the traffic tonight, {player}. The road is keeping score, and you are ahead.',
      'There were nine hundred of us at the start of the season. There are forty on this channel. Check in when you can.',
    ],
    greetings: [
      'A woman in a patched coat lowers a radio antenna and studies you. "Ada. I have been saying your name on air for two hundred miles, {player}. Good to attach a face."',
    ],
    keywords: ['ada', 'sister', 'radio', 'broadcast', 'pray'],
    replies: [
      'Keep your channel open, {player}. Silence is how people vanish.',
      'I will hold the frequency for you. Go carefully.',
      'The road is long and you are not walking it alone.',
    ],
  },
  {
    id: 'kestrel',
    name: 'Kestrel',
    handle: 'KESTREL',
    role: 'ALLY',
    faction: 'Convoy Deserter',
    fromChapter: 3,
    blurb:
      'Former Convoy outrider. Left with a bike, a rifle, and everything she knows.',
    chatter: [
      'Convoy patrol rotation changed at the 400 marker. Two riders, forty minute gap. Use it.',
      'I rode for Vane for six years. Ask me anything about him except whether he keeps his word.',
      '{player}, he has your plate number. That is not a warning, it is a fact. Plan around it.',
      'Black Ridge was not an accident. I was there. That is all I am saying on an open channel.',
    ],
    greetings: [
      'A stripped outrider bike cuts across the median and matches your speed. The rider pulls her scarf down. "Kestrel. We need to talk about Vane, {player}."',
    ],
    keywords: ['kestrel', 'convoy', 'vane', 'deserter', 'ridge', 'black ridge'],
    replies: [
      'Not on an open channel, {player}. Find me on the road.',
      'Whatever Vane offers you, he offered me first. I still left.',
      'Keep east. He is slower than he thinks he is.',
    ],
  },
  {
    id: 'marshal_vane',
    name: 'Marshal Vane',
    handle: 'VANE',
    role: 'ANTAGONIST',
    faction: 'The Convoy',
    fromChapter: 2,
    blurb:
      'Holds Highway 17 from the Corridor to Vantage. Believes he is the reason anyone survives.',
    chatter: [
      'This is Marshal Vane on the Convoy channel. The road is open to those who pay the toll and closed to those who do not. Choose accordingly.',
      'A driver east of the Corridor is running without registration. {player}. You have my attention now. Very few people enjoy that.',
      'I am told there is a story going around about Black Ridge. Stories are what people make when they cannot make order.',
      '{player}. There is a place for someone like you inside the Convoy. The alternative is the shoulder of the road, and the shoulder is crowded.',
    ],
    greetings: [
      'A line of Convoy trucks brakes across both lanes. A tall man in a clean coat steps down and spreads his hands. "{player}. Finally. Let us talk before either of us does something expensive."',
    ],
    keywords: ['vane', 'marshal', 'toll', 'convoy'],
    replies: [
      'Bold, on an open channel. I admire it. Briefly.',
      'The offer stands, {player}. It will not stand forever.',
      'You mistake the road for a place you are passing through. It is a place I own.',
    ],
  },
];

export function getNpc(id: string): NpcDef | undefined {
  return NPCS.find((n) => n.id === id);
}

export function npcsForChapter(chapter: number): NpcDef[] {
  return NPCS.filter((n) => n.fromChapter <= chapter);
}

function fill(line: string, playerName: string): string {
  return line.replaceAll('{player}', playerName);
}

export interface NpcUtterance {
  npcId: string;
  sender: string;
  message: string;
}

/** One ambient radio line from someone active in the player's chapter. */
export function rollChatter(chapter: number, playerName: string): NpcUtterance {
  const cast = npcsForChapter(chapter);
  // Vane speaks less often than the friendly cast; he is a weather event.
  const npc = pickWeighted(
    cast.map((n) => ({ value: n, weight: n.role === 'ANTAGONIST' ? 1 : 3 }))
  );
  return {
    npcId: npc.id,
    sender: npc.handle,
    message: fill(pickOne(npc.chatter), playerName),
  };
}

/** Reply to a player's world-chat message, if anyone has reason to answer. */
export function rollReply(
  playerMessage: string,
  chapter: number,
  playerName: string
): NpcUtterance | null {
  const text = playerMessage.toLowerCase();
  const cast = npcsForChapter(chapter);

  const addressed = cast.filter((npc) =>
    npc.keywords.some((keyword) => text.includes(keyword))
  );

  // Nobody was named: someone friendly answers anyway, most of the time.
  const pool =
    addressed.length > 0
      ? addressed
      : cast.filter((n) => n.role !== 'ANTAGONIST');
  if (addressed.length === 0 && Math.random() > 0.45) return null;
  if (pool.length === 0) return null;

  const npc = pickOne(pool);
  return {
    npcId: npc.id,
    sender: npc.handle,
    message: fill(pickOne(npc.replies), playerName),
  };
}

/** Greeting used when an NPC is encountered on the road. */
export function greetingFor(npc: NpcDef, playerName: string): string {
  return fill(pickOne(npc.greetings), playerName);
}

// ------------------------------------------------------
// Road encounters with NPCs
// ------------------------------------------------------

export type NpcGiftKind = 'SUPPLIES' | 'FUEL' | 'MEDICAL' | 'INTEL' | 'CREDITS';

export interface NpcEncounterOutcome {
  npc: NpcDef;
  greeting: string;
  gift: NpcGiftKind;
  affinityGain: number;
}

const GIFT_BY_ROLE: Record<NpcRole, NpcGiftKind> = {
  ALLY: 'INTEL',
  TRADER: 'CREDITS',
  MEDIC: 'MEDICAL',
  MECHANIC: 'FUEL',
  RIVAL: 'CREDITS',
  ANTAGONIST: 'INTEL',
};

/** Pick a friendly NPC to meet on the road. Vane is never a chance meeting. */
export function rollNpcEncounter(
  chapter: number,
  playerName: string
): NpcEncounterOutcome {
  const cast = npcsForChapter(chapter).filter((n) => n.role !== 'ANTAGONIST');
  const npc = pickOne(cast);
  return {
    npc,
    greeting: greetingFor(npc, playerName),
    gift: GIFT_BY_ROLE[npc.role],
    affinityGain: 1,
  };
}
