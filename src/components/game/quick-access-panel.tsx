import { Separator } from '@/components/ui/separator';
import { Package, Settings, Car, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  Player,
  PlayerInventory,
  Vehicle,
  VehicleComponent,
} from '@prisma/client';
import { InventorySheet } from './inventory-sheet';
import { VehicleSheet } from './vehicle-sheet';
import { CraftingSheet } from './crafting-sheet';

type PlayerWithInventory = Player & {
  inventory: PlayerInventory[];
  vehicle?: (Vehicle & { components: VehicleComponent[] }) | null;
};

export function QuickAccessPanel({ player }: { player: PlayerWithInventory }) {
  const equippedWeapon = player.inventory.find((i) => i.equipSlot === 'WEAPON');

  return (
    <div className="p-4 flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar">
      {/* Inventory Mini */}
      <div>
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" /> QUICK ACCESS
        </h3>
        <div className="space-y-2 mb-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-sm flex items-center gap-3">
            <div className="h-8 w-8 bg-zinc-800 rounded flex items-center justify-center shrink-0">
              <span className="text-xs text-zinc-500">1</span>
            </div>
            <div>
              <p className="text-zinc-200 font-medium leading-none mb-1">
                {equippedWeapon ? equippedWeapon.baseItemId : 'Empty Slot'}
              </p>
              <p className="text-xs text-zinc-500">
                {equippedWeapon
                  ? `Durability: ${equippedWeapon.currentDurability.toFixed(0)}%`
                  : 'No weapon equipped'}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-sm flex items-center gap-3 opacity-50">
            <div className="h-8 w-8 bg-zinc-800 rounded flex items-center justify-center shrink-0">
              <span className="text-xs text-zinc-500">2</span>
            </div>
            <div>
              <p className="text-zinc-200 font-medium leading-none mb-1">
                Empty Slot
              </p>
              <p className="text-xs text-zinc-500">Consumable</p>
            </div>
          </div>
        </div>

        <InventorySheet inventory={player.inventory} />
      </div>

      <Separator className="bg-zinc-800" />

      {/* Vehicle Status */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider flex items-center gap-2">
          <Settings className="h-4 w-4" /> VEHICLE: COMMON VAN
        </h3>

        {/* Vehicle Quick Status */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-400">
                <Car className="h-4 w-4" /> Vehicle
              </span>
              <span className="text-blue-400 font-mono text-xs">
                {player.vehicle?.fuel ?? 0}% Fuel
              </span>
            </div>
          </div>
          {player.vehicle && (
            <VehicleSheet vehicle={player.vehicle}>
              <Button
                variant="outline"
                className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                View Vehicle Status
              </Button>
            </VehicleSheet>
          )}
        </div>
      </div>
      <Separator className="bg-zinc-800" />

      {/* Crafting System */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider flex items-center gap-2">
          <Hammer className="h-4 w-4" /> CRAFTING BENCH
        </h3>
        <CraftingSheet player={player}>
          <Button
            variant="outline"
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Open Crafting Bench
          </Button>
        </CraftingSheet>
      </div>

      <Separator className="bg-zinc-800" />

      {/* World Chat Mini */}
      <div className="flex-1 flex flex-col min-h-[150px]">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider mb-2">
          WORLD RADIO
        </h3>
        <div className="flex-1 bg-zinc-900/50 rounded-md border border-zinc-800 p-2 overflow-y-auto text-xs space-y-2 custom-scrollbar">
          <p>
            <span className="text-blue-400 font-bold">[Scav_99]:</span> Anyone
            near Sector 4?
          </p>
          <p>
            <span className="text-zinc-500 font-bold">[System]:</span> Radio
            silence. Static crackles.
          </p>
          <p>
            <span className="text-purple-400 font-bold">[Wolf]:</span> Stay away
            from the bridge.
          </p>
        </div>
      </div>
    </div>
  );
}
