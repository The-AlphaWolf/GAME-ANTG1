// Maps free-text player input to a known game intent.

export type IntentType =
  | 'REST'
  | 'REPAIR'
  | 'EAT'
  | 'DRINK'
  | 'HEAL'
  | 'EQUIP'
  | 'INSPECT'
  | 'REFUEL'
  | 'TALK'
  | 'UNKNOWN';

export type Intent =
  | { type: Exclude<IntentType, 'UNKNOWN' | 'TALK'> }
  | { type: 'TALK'; raw: string }
  | { type: 'UNKNOWN'; raw: string };

const VERB_MAP: [RegExp, Exclude<IntentType, 'UNKNOWN' | 'TALK'>][] = [
  [/\b(rest|sleep|nap|camp|make\s*camp)\b/i, 'REST'],
  [/\b(repair|fix|patch\s*up\s*the\s*van|weld)\b/i, 'REPAIR'],
  [/\b(refuel|siphon|fill\s*(the\s*)?tank|drain\s*fuel|gas\s*up)\b/i, 'REFUEL'],
  [/\b(eat|feed|meal|rations)\b/i, 'EAT'],
  [/\b(drink|sip|water|hydrate)\b/i, 'DRINK'],
  [/\b(heal|bandage|first\s*aid|treat|med(kit)?)\b/i, 'HEAL'],
  [/\b(equip|wield|hold|draw|arm)\b/i, 'EQUIP'],
  [/\b(inspect|look|examine|check|status|survey)\b/i, 'INSPECT'],
];

const TALK_PATTERN =
  /\b(talk|speak|ask|call|radio|hail|say)\b|\b(wren|boone|marlow|tick|ada|kestrel|vane)\b/i;

export function parseIntent(actionText: string): Intent {
  const text = actionText.trim();
  for (const [pattern, type] of VERB_MAP) {
    if (pattern.test(text)) return { type };
  }
  if (TALK_PATTERN.test(text)) return { type: 'TALK', raw: text };
  return { type: 'UNKNOWN', raw: text };
}
