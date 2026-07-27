import { ComponentType, Prisma, RarityTier } from '@prisma/client';
import { getRarityMultiplier } from './rarity';

export interface ComponentDef {
  type: ComponentType;
  name: string;
  durability: number;
}

// Registration used to create a bare Vehicle row with no components at all, so
// only the seeded account ever had a vehicle worth opening. Every new van now
// ships with the full set.
export const STARTER_COMPONENTS: ComponentDef[] = [
  { type: 'ENGINE', name: 'Rusted V8 Engine', durability: 85 },
  { type: 'CHASSIS', name: 'Van Chassis', durability: 100 },
  { type: 'TIRES', name: 'Worn All-Terrains', durability: 70 },
  { type: 'ARMOR', name: 'Scrap Metal Plating', durability: 80 },
  { type: 'STORAGE', name: 'Trunk Space', durability: 100 },
  { type: 'FUEL_SYSTEM', name: 'Patched Gas Tank', durability: 90 },
];

export async function createStarterVehicle(
  tx: Prisma.TransactionClient,
  playerId: string
) {
  return tx.vehicle.create({
    data: {
      playerId,
      type: 'Common Van',
      armor: 40,
      fuel: 100,
      components: {
        create: STARTER_COMPONENTS.map((c) => ({
          type: c.type,
          name: c.name,
          durability: c.durability,
          maxDurability: 100,
        })),
      },
    },
  });
}

// ------------------------------------------------------
// Component effects
// ------------------------------------------------------

export interface VehicleBonuses {
  /** Multiplier on fuel burned per drive (lower is better). */
  fuelEfficiency: number;
  /** Flat damage reduction applied to the driver in combat. */
  armorBonus: number;
  /** Extra miles gained per drive. */
  speedBonus: number;
}

type ComponentLike = {
  type: ComponentType;
  rarity: RarityTier;
  durability: number;
};

export function computeVehicleBonuses(
  components: ComponentLike[]
): VehicleBonuses {
  let fuelEfficiency = 1;
  let armorBonus = 0;
  let speedBonus = 0;

  for (const component of components) {
    // A broken part contributes nothing, a pristine one contributes fully.
    const condition = Math.max(0, Math.min(1, component.durability / 100));
    const grade = (getRarityMultiplier(component.rarity) - 1) * condition;

    switch (component.type) {
      case 'FUEL_SYSTEM':
        fuelEfficiency -= Math.min(0.45, grade * 0.06);
        break;
      case 'ENGINE':
        speedBonus += Math.round(grade * 1.2);
        break;
      case 'TIRES':
        speedBonus += Math.round(grade * 0.8);
        break;
      case 'ARMOR':
        armorBonus += Math.round(grade * 1.5);
        break;
      case 'CHASSIS':
        armorBonus += Math.round(grade * 0.8);
        break;
      case 'STORAGE':
        break;
    }
  }

  return {
    fuelEfficiency: Math.max(0.55, fuelEfficiency),
    armorBonus,
    speedBonus,
  };
}
