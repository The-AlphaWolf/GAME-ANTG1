// Distance-banded story arc. distanceTraveled is the only progress signal we
// need, so zone/win beats are derived by comparing before/after mileage on
// each explore() call rather than a stored "current zone" column.

export interface StoryZone {
  name: string;
  startMile: number;
  narrative: string;
}

export const WIN_DISTANCE = 1000;

export const STORY_ZONES: StoryZone[] = [
  {
    name: 'The Dust Corridor',
    startMile: 250,
    narrative:
      'The highway markers read 250. Wrecked convoys line the shoulder — you have left the easy stretch behind.',
  },
  {
    name: 'Broken Interstates',
    startMile: 500,
    narrative:
      'Halfway to the horizon. The road splits and buckles here, swallowed by old sinkholes and worse.',
  },
  {
    name: 'Black Ridge',
    startMile: 750,
    narrative:
      'The ridge line ahead is scorched black. Whatever burned this stretch did it recently.',
  },
];

/**
 * Returns the story beats (zone entries, win) crossed by moving from
 * `oldMiles` to `newMiles` in a single step, in mile order.
 */
export function crossedStoryBeats(
  oldMiles: number,
  newMiles: number
): { text: string }[] {
  const beats: { text: string }[] = [];

  for (const zone of STORY_ZONES) {
    if (oldMiles < zone.startMile && newMiles >= zone.startMile) {
      beats.push({ text: `${zone.name.toUpperCase()} — ${zone.narrative}` });
    }
  }

  if (oldMiles < WIN_DISTANCE && newMiles >= WIN_DISTANCE) {
    beats.push({
      text: `THE HORIZON — after ${newMiles} miles, the evac port rises out of the haze. You made it. The road is done with you, for now.`,
    });
  }

  return beats;
}

/**
 * Gentle enemy scaling tied to player level (progression), not raw distance,
 * so difficulty tracks how strong the player actually is instead of spiking
 * by band.
 */
export function scaleEnemyStat(
  base: number,
  level: number,
  perLevel: number
): number {
  return Math.round(base + Math.max(0, level - 1) * perLevel);
}
