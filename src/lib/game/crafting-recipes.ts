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
}

export const RECIPES: Recipe[] = [
  {
    id: 'recipe_scrap_armor',
    name: 'Scrap Armor',
    description: 'Basic protection made from welded scrap.',
    outputItemId: 'Scrap Armor',
    outputQuantity: 1,
    ingredients: [{ baseItemId: 'Scrap Metal', quantity: 10 }],
  },
  {
    id: 'recipe_improvised_weapon',
    name: 'Improvised Weapon',
    description: 'A crude weapon crafted from whatever was lying around.',
    outputItemId: 'Improvised Weapon',
    outputQuantity: 1,
    ingredients: [
      { baseItemId: 'Scrap Metal', quantity: 5 },
      { baseItemId: 'Wood', quantity: 3 }, // Assume we might find wood later
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
      { baseItemId: 'Charcoal', quantity: 1 },
    ],
  },
];
