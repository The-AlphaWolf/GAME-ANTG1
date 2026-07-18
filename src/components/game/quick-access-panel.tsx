import { Separator } from '@/components/ui/separator';
import {
  Package,
  Settings,
  Car,
  Hammer,
  Send,
  ScrollText,
  Sparkles,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Player,
  PlayerInventory,
  Vehicle,
  VehicleComponent,
  ChatMessage,
  ActiveQuest,
} from '@prisma/client';
import { InventorySheet } from './inventory-sheet';
import { VehicleSheet } from './vehicle-sheet';
import { CraftingSheet } from './crafting-sheet';
import { QuestLogSheet } from './quest-log';
import { ShopSheet } from './shop-sheet';
import { sendMessage } from '@/actions/chat';

type PlayerWithInventory = Player & {
  inventory: PlayerInventory[];
  vehicle?: (Vehicle & { components: VehicleComponent[] }) | null;
  quests: ActiveQuest[];
};

export function QuickAccessPanel({
  player,
  chatMessages = [],
}: {
  player: PlayerWithInventory;
  chatMessages?: ChatMessage[];
}) {
  const equippedWeapon = player.inventory.find((i) => i.equipSlot === 'WEAPON');

  return (
    <div className="p-4 flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar">
      {/* Talent Summary */}
      <div className="bg-gradient-to-br from-purple-900/40 via-red-900/20 to-zinc-950 border border-purple-900/50 rounded-lg p-3">
        <h3 className="text-xs font-bold text-purple-400 tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> SSS TALENT: UPGRADE
          </span>
          <span className="text-zinc-300 font-mono text-[10px] bg-black/50 px-2 py-0.5 rounded">
            {player.upgradeCharges}/6 CHARGES
          </span>
        </h3>
        <p className="text-[10px] text-zinc-400">
          Enhance items to higher rarities. Charges reset at midnight.
        </p>
      </div>

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

      {/* Trading Post */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider flex items-center gap-2">
          <Store className="h-4 w-4" /> TRADING POST
        </h3>
        <ShopSheet player={player}>
          <Button
            variant="outline"
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Open Shop ({player.credits} EC)
          </Button>
        </ShopSheet>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Quest System */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider flex items-center gap-2">
          <ScrollText className="h-4 w-4" /> QUEST LOG
        </h3>
        <QuestLogSheet player={player}>
          <Button
            variant="outline"
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 relative"
          >
            Open Bounty Board
            {player.quests.filter((q) => q.status === 'ACTIVE').length > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </Button>
        </QuestLogSheet>
      </div>

      <Separator className="bg-zinc-800" />

      {/* World Chat Mini */}
      <div className="flex-1 flex flex-col min-h-[250px] max-h-[300px]">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider mb-2">
          WORLD RADIO
        </h3>
        <div className="flex-1 bg-zinc-900/50 rounded-t-md border border-zinc-800 border-b-0 p-2 overflow-y-auto text-xs space-y-2 custom-scrollbar flex flex-col-reverse">
          <div className="space-y-2">
            {chatMessages.length === 0 ? (
              <p className="text-zinc-500 italic text-center py-4">
                Radio silence...
              </p>
            ) : (
              chatMessages.map((msg) => (
                <p key={msg.id} className="break-words">
                  <span
                    className={`font-bold ${
                      msg.sender === 'System'
                        ? 'text-red-400'
                        : msg.sender === player.username
                          ? 'text-emerald-400'
                          : 'text-blue-400'
                    }`}
                  >
                    [{msg.sender}]:
                  </span>{' '}
                  <span className="text-zinc-300">{msg.message}</span>
                </p>
              ))
            )}
          </div>
        </div>
        <form
          action={async (formData) => {
            'use server';
            const message = formData.get('message') as string;
            if (message) {
              await sendMessage(message);
            }
          }}
          className="flex bg-zinc-900/80 rounded-b-md border border-zinc-800 p-1"
        >
          <Input
            name="message"
            placeholder="Broadcast to world..."
            className="flex-1 h-8 bg-transparent border-none text-xs focus-visible:ring-0 px-2"
            autoComplete="off"
            maxLength={200}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
