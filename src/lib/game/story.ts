// The road story. Progress is measured in miles, but the player experiences it
// as five acts with named people who react to them by name. The old build had
// three flavour strings and a mile-1000 win line; this replaces it with an arc
// the player is visibly the protagonist of.

export interface Chapter {
  number: number;
  title: string;
  zone: string;
  startMile: number;
  /** Zone tier drives enemy pools, loot quality and threat display. */
  tier: number;
  /** Shown when the chapter opens. */
  opening: string;
  /** One-line objective shown in the HUD. */
  objective: string;
}

export const WIN_DISTANCE = 1000;

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: 'The Easy Stretch',
    zone: 'Highway 17',
    startMile: 0,
    tier: 1,
    opening:
      'Highway 17 runs east out of nothing and keeps going. Your van is loaded, the tank is full, and the evac port at Vantage is a thousand miles of bad road away. Someone on the radio says your name like they already know it.',
    objective: 'Drive east. Reach the Dust Corridor at mile 150.',
  },
  {
    number: 2,
    title: 'The Dust Corridor',
    zone: 'The Dust Corridor',
    startMile: 150,
    tier: 2,
    opening:
      'Mile 150. The wrecks along the shoulder stop looking like accidents and start looking like a message. Painted on a flipped tanker, ten feet high: THE ROAD BELONGS TO THE CONVOY. Marshal Vane owns this stretch, and Vane has started asking who you are.',
    objective: 'Survive the Corridor tolls. Push through to mile 400.',
  },
  {
    number: 3,
    title: 'Broken Interstates',
    zone: 'Broken Interstates',
    startMile: 400,
    tier: 3,
    opening:
      'Mile 400. The interstate buckles into sinkholes wide enough to swallow the van whole. Kestrel breaks radio silence to tell you what she deserted over: the Convoy did not survive the fire at Black Ridge. The Convoy started it.',
    objective: 'Get the truth about Black Ridge. Reach mile 650.',
  },
  {
    number: 4,
    title: 'Black Ridge',
    zone: 'Black Ridge',
    startMile: 650,
    tier: 4,
    opening:
      'Mile 650. The ridge is scorched glass and standing chimneys. Whatever burned here burned recently and burned on purpose. Vane broadcasts on every channel now, and he uses your name.',
    objective: 'Cross the burn. Reach Vantage at mile 900.',
  },
  {
    number: 5,
    title: 'Vantage',
    zone: 'Vantage Approach',
    startMile: 900,
    tier: 4,
    opening:
      'Mile 900. Through the haze, the evac port towers rise — and the whole Convoy is parked between you and them. Vane is waiting on the tarmac. He wants to talk first. He always wants to talk first.',
    objective: 'Finish it. Reach the evac port at mile 1000.',
  },
];

export function chapterForMiles(miles: number): Chapter {
  let current = CHAPTERS[0];
  for (const chapter of CHAPTERS) {
    if (miles >= chapter.startMile) current = chapter;
  }
  return current;
}

export function tierForMiles(miles: number): number {
  return chapterForMiles(miles).tier;
}

// ------------------------------------------------------
// Beats crossed between two mileage readings
// ------------------------------------------------------

export interface StoryBeat {
  text: string;
  /** Chapter this beat opens, if any. */
  chapter?: number;
  isWin?: boolean;
}

interface MilestoneBeat {
  mile: number;
  text: string;
}

// Between-chapter texture so the road keeps talking on quiet miles.
const MILESTONE_BEATS: MilestoneBeat[] = [
  {
    mile: 60,
    text: 'A hand-painted sign leans in the ditch: VANTAGE — 940 MI. IF YOU ARE READING THIS YOU ARE STILL ALIVE. Someone scratched WREN WAS HERE underneath it.',
  },
  {
    mile: 250,
    text: 'You pass a Convoy checkpoint burned to its frame. Every vehicle faces outward. Whatever hit it came from the road ahead, not behind.',
  },
  {
    mile: 320,
    text: 'Boone flags you down at a salvage bay and refills your canteens without asking for EC. "Word travels," he says. "You are the one who keeps going."',
  },
  {
    mile: 520,
    text: 'A row of crosses runs the median for two miles. Each one has a Convoy patch nailed to it. None of them are Convoy graves.',
  },
  {
    mile: 720,
    text: "In the ash you find a child's bicycle, melted to the asphalt. Sister Ada goes quiet on the radio for the first time in four hundred miles.",
  },
  {
    mile: 860,
    text: 'Kestrel pulls alongside in a stripped outrider bike, matches your speed, and gives you a nod. "Whatever he offers you at Vantage," she says, "he offered me first."',
  },
];

export function crossedStoryBeats(
  oldMiles: number,
  newMiles: number
): StoryBeat[] {
  const beats: StoryBeat[] = [];

  for (const chapter of CHAPTERS) {
    if (
      chapter.startMile > 0 &&
      oldMiles < chapter.startMile &&
      newMiles >= chapter.startMile
    ) {
      beats.push({
        text: `CHAPTER ${chapter.number} — ${chapter.title.toUpperCase()}. ${chapter.opening}`,
        chapter: chapter.number,
      });
    }
  }

  for (const milestone of MILESTONE_BEATS) {
    if (oldMiles < milestone.mile && newMiles >= milestone.mile) {
      beats.push({ text: milestone.text });
    }
  }

  if (oldMiles < WIN_DISTANCE && newMiles >= WIN_DISTANCE) {
    beats.push({
      text: 'THE EVAC PORT — You drive through the gap Kestrel cut in the fence and the Convoy does not follow. Behind you Vane is still talking. Ahead of you the transport ramps are down and the loadmaster is waving you in. A thousand miles of Highway 17, and you are the one who arrived. THE ROAD IS DONE WITH YOU — FOR NOW.',
      isWin: true,
    });
  }

  return beats;
}

/** Legacy helper kept for enemy scaling call sites. */
export function scaleEnemyStat(
  base: number,
  level: number,
  perLevel: number
): number {
  return Math.round(base + Math.max(0, level - 1) * perLevel);
}
