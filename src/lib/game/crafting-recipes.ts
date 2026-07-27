export interface CraftingIngredient {
  baseItemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  outputItemId: string;
  outputQuantity: number;
  ingredients: CraftingIngredient[];
  /** Chapter this recipe unlocks in. */
  chapter?: number;
}

// Every ingredient below is something the loot tables actually drop. The old
// recipe list required Wood and Charcoal, which nothing in the game produced.
export const RECIPES: Recipe[] = [
  {
    id: 'recipe_bandage',
    name: 'Bandage',
    description: 'Boiled cloth and charcoal. Crude, but it closes a wound.',
    outputItemId: 'Bandage',
    outputQuantity: 2,
    ingredients: [
      { baseItemId: 'Cloth', quantity: 2 },
      { baseItemId: 'Charcoal', quantity: 1 },
    ],
  },
  {
    id: 'recipe_water_filter',
    name: 'Water Filter',
    description: 'Cleans dirty water for drinking.',
    outputItemId: 'Water Filter',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 2 },
      { baseItemId: 'Charcoal', quantity: 2 },
    ],
  },
  {
    id: 'recipe_clean_water',
    name: 'Purify Water',
    description: 'Run dirty water through a filter and charcoal.',
    outputItemId: 'Clean Water',
    outputQuantity: 2,
    ingredients: [
      { baseItemId: 'Dirty Water', quantity: 2 },
      { baseItemId: 'Charcoal', quantity: 1 },
    ],
  },
  {
    id: 'recipe_improvised_weapon',
    name: 'Improvised Weapon',
    description: 'A crude weapon crafted from whatever was lying around.',
    outputItemId: 'Improvised Weapon',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 4 },
      { baseItemId: 'Wood', quantity: 2 },
    ],
  },
  {
    id: 'recipe_nail_bat',
    name: 'Nail Bat',
    description: 'A length of hardwood and a great many nails.',
    outputItemId: 'Nail Bat',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Wood', quantity: 4 },
      { baseItemId: 'Scrap Metal', quantity: 6 },
    ],
  },
  {
    id: 'recipe_scrap_armor',
    name: 'Scrap Armor',
    description: 'Basic protection made from welded scrap.',
    outputItemId: 'Scrap Armor',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 8 },
      { baseItemId: 'Cloth', quantity: 3 },
    ],
  },
  {
    id: 'recipe_repair_kit',
    name: 'Repair Kit',
    description: 'Welding rod, patch plate, and a prayer.',
    outputItemId: 'Repair Kit',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 6 },
      { baseItemId: 'Electronics', quantity: 1 },
    ],
    chapter: 2,
  },
  {
    id: 'recipe_scrap_cleaver',
    name: 'Scrap Cleaver',
    description: 'A leaf-spring ground to a murderous edge.',
    outputItemId: 'Scrap Cleaver',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 10 },
      { baseItemId: 'Wood', quantity: 3 },
      { baseItemId: 'Cloth', quantity: 2 },
    ],
    chapter: 2,
  },
  {
    id: 'recipe_scrap_pistol',
    name: 'Scrap Pistol',
    description: 'Hand-machined and slightly terrifying to fire.',
    outputItemId: 'Scrap Pistol',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Gun Parts', quantity: 3 },
      { baseItemId: 'Scrap Metal', quantity: 8 },
      { baseItemId: 'Electronics', quantity: 2 },
    ],
    chapter: 2,
  },
  {
    id: 'recipe_fuel_canister',
    name: 'Fuel Canister',
    description: 'Cook rough fuel out of salvage and pressure.',
    outputItemId: 'Fuel Canister',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 3 },
      { baseItemId: 'Charcoal', quantity: 3 },
    ],
  },
];

export function recipesForChapter(chapter: number): Recipe[] {
  return RECIPES.filter((r) => (r.chapter ?? 1) <= chapter);
}
