// World clock, weather and threat readout. The HUD used to hardcode
// "DAY 12 14:30 / Overcast 12°C"; all of it is derived from player.turns now.

export const MINUTES_PER_TURN = 30;
export const TURNS_PER_DAY = 48; // 24h at 30 minutes a turn
const DAY_START_HOUR = 6; // a run begins at 06:00 on day 1

export interface WorldClock {
  day: number;
  hour: number;
  minute: number;
  label: string; // "14:30"
  isNight: boolean;
}

export function clockFromTurns(turns: number): WorldClock {
  const totalMinutes = DAY_START_HOUR * 60 + turns * MINUTES_PER_TURN;
  const day = Math.floor(totalMinutes / (24 * 60)) + 1;
  const minuteOfDay = totalMinutes % (24 * 60);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;

  return {
    day,
    hour,
    minute,
    label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    isNight: hour >= 21 || hour < 5,
  };
}

export interface Weather {
  id: string;
  label: string;
  temperatureC: number;
  /** Multiplier applied to thirst gain while driving. */
  thirstFactor: number;
  /** Multiplier applied to fuel burn while driving. */
  fuelFactor: number;
}

const WEATHER_CYCLE: Weather[] = [
  {
    id: 'clear',
    label: 'Clear',
    temperatureC: 19,
    thirstFactor: 1,
    fuelFactor: 1,
  },
  {
    id: 'overcast',
    label: 'Overcast',
    temperatureC: 12,
    thirstFactor: 0.9,
    fuelFactor: 1,
  },
  {
    id: 'dust',
    label: 'Dust Storm',
    temperatureC: 26,
    thirstFactor: 1.4,
    fuelFactor: 1.25,
  },
  {
    id: 'rain',
    label: 'Acid Drizzle',
    temperatureC: 9,
    thirstFactor: 0.7,
    fuelFactor: 1.1,
  },
  {
    id: 'heat',
    label: 'Heat Haze',
    temperatureC: 34,
    thirstFactor: 1.6,
    fuelFactor: 1.15,
  },
  {
    id: 'cold',
    label: 'Cold Front',
    temperatureC: 2,
    thirstFactor: 0.8,
    fuelFactor: 1.2,
  },
];

/** Weather is deterministic from the clock so it is stable across renders and
 * identical on server and client — no hydration mismatch, no extra column. */
export function weatherFromTurns(turns: number): Weather {
  const block = Math.floor(turns / 8); // shifts roughly every 4 in-world hours
  // Cheap deterministic hash so the cycle does not feel like a rotation.
  const index = (block * 7 + Math.floor(block / 3) * 3) % WEATHER_CYCLE.length;
  const base = WEATHER_CYCLE[index];
  const clock = clockFromTurns(turns);
  return clock.isNight
    ? { ...base, temperatureC: base.temperatureC - 7 }
    : base;
}

/** 0-3 skulls, from zone tier plus a night penalty. */
export function threatLevel(tier: number, turns: number): number {
  const night = clockFromTurns(turns).isNight ? 1 : 0;
  return Math.max(1, Math.min(3, tier - 1 + night));
}

// ------------------------------------------------------
// Survival drain
// ------------------------------------------------------

export interface SurvivalDrain {
  hunger: number;
  thirst: number;
  fatigue: number;
  sanity: number;
}

/** Per-turn survival cost. Deliberately mild: the point is to make food and
 * water matter, not to run a bar down while the player is reading. */
export function survivalDrainForTurns(
  turns: number,
  weather: Weather,
  isNight: boolean
): SurvivalDrain {
  return {
    hunger: Math.round(2 * turns),
    thirst: Math.round(2.5 * weather.thirstFactor * turns),
    fatigue: Math.round((isNight ? 3 : 2) * turns),
    sanity: isNight ? -1 * turns : 0, // negative = sanity lost
  };
}

export const CRITICAL_THRESHOLD = 85;

/** HP lost per turn when a survival stat is critical. */
export function starvationDamage(
  hunger: number,
  thirst: number,
  fatigue: number
): number {
  let damage = 0;
  if (hunger >= CRITICAL_THRESHOLD) damage += 3;
  if (thirst >= CRITICAL_THRESHOLD) damage += 4;
  if (fatigue >= CRITICAL_THRESHOLD) damage += 2;
  return damage;
}

/** Warning lines surfaced in the feed when a stat goes critical. */
export function survivalWarnings(
  hunger: number,
  thirst: number,
  fatigue: number,
  sanity: number
): string[] {
  const warnings: string[] = [];
  if (hunger >= CRITICAL_THRESHOLD)
    warnings.push(
      'Your stomach has stopped complaining, which is worse. Eat something.'
    );
  if (thirst >= CRITICAL_THRESHOLD)
    warnings.push('Your tongue is thick and the road is doubling. Find water.');
  if (fatigue >= CRITICAL_THRESHOLD)
    warnings.push(
      'You have been blinking for too long at a time. Rest, or the road decides for you.'
    );
  if (sanity <= 25)
    warnings.push(
      'The radio is saying your name in a voice you recognise. It should not be able to do that.'
    );
  return warnings;
}
