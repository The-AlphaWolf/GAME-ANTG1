export interface Weighted<T> {
  value: T;
  weight: number;
}

export function pickWeighted<T>(entries: Weighted<T>[]): T {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

export function pickOne<T>(entries: readonly T[]): T {
  return entries[Math.floor(Math.random() * entries.length)];
}

/** Inclusive integer range. */
export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}
