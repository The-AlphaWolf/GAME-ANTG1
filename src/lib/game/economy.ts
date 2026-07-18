// Defines the base Energy Credit (EC) value for items
export const ITEM_PRICES: Record<string, number> = {
  'Scrap Metal': 10,
  Wood: 5,
  Charcoal: 15,
  'Dirty Water': 2,
  'Clean Water': 25,
  'Small Rations': 20,
  'First Aid Kit': 100,
  'Fuel Canister': 50,

  // Crafted items have a premium
  'Scrap Armor': 150,
  'Improvised Weapon': 75,
  'Water Filter': 60,

  // Vehicle Parts
  'Engine Block': 500,
  Tire: 120,
};

export function getItemPrice(baseItemId: string): number {
  return ITEM_PRICES[baseItemId] || 5; // Default fallback price is 5 EC
}
