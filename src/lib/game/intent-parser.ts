// Maps free-text player input to a known game intent. Replaces the old
// submitAction dead end ("It echoes into the void.") with real verbs.

export type Intent =
  | { type: 'REST' }
  | { type: 'REPAIR' }
  | { type: 'EAT' }
  | { type: 'DRINK' }
  | { type: 'USE' }
  | { type: 'EQUIP' }
  | { type: 'INSPECT' }
  | { type: 'SIPHON' }
  | { type: 'UNKNOWN'; raw: string };

type KnownType = Exclude<Intent['type'], 'UNKNOWN'>;

const VERB_MAP: [RegExp, KnownType][] = [
  [/\b(rest|sleep|nap)\b/i, 'REST'],
  [/\b(repair|fix)\b/i, 'REPAIR'],
  [/\b(eat|feed)\b/i, 'EAT'],
  [/\b(drink|sip)\b/i, 'DRINK'],
  [/\b(siphon|drain\s*fuel)\b/i, 'SIPHON'],
  [/\b(use|apply|consume)\b/i, 'USE'],
  [/\b(equip|wield|hold)\b/i, 'EQUIP'],
  [/\b(inspect|look|examine|check)\b/i, 'INSPECT'],
];

export function parseIntent(actionText: string): Intent {
  const text = actionText.trim();
  for (const [pattern, type] of VERB_MAP) {
    if (pattern.test(text)) return { type };
  }
  return { type: 'UNKNOWN', raw: text };
}
