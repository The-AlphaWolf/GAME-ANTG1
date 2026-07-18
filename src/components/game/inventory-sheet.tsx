'use client';

import { useTransition } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayerInventory } from '@prisma/client';
import { equipItem, dropItem } from '@/actions/inventory';
import { sellItem } from '@/actions/economy';
import { getItemPrice } from '@/lib/game/economy';
import { Loader2, Package, Sword, X, Coins } from 'lucide-react';

type EquipSlot = 'WEAPON' | 'HEAD' | 'CHEST' | 'LEGS' | null;

interface InventorySheetProps {
  inventory: PlayerInventory[];
}

export function InventorySheet({ inventory }: InventorySheetProps) {
  const [isPending, startTransition] = useTransition();

  const handleEquip = (instanceId: string, slot: EquipSlot) => {
    startTransition(async () => {
      await equipItem(instanceId, slot);
    });
  };

  const handleDrop = (instanceId: string) => {
    startTransition(async () => {
      await dropItem(instanceId);
    });
  };

  const handleSell = (instanceId: string) => {
    startTransition(async () => {
      await sellItem(instanceId);
    });
  };

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 1:
        return 'text-zinc-400';
      case 2:
        return 'text-green-400';
      case 3:
        return 'text-blue-400';
      case 4:
        return 'text-purple-400';
      case 5:
        return 'text-yellow-400';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Package className="mr-2 h-4 w-4" /> View Full Inventory
          </Button>
        }
      />
      <SheetContent className="w-full sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2 border-b border-zinc-800 shrink-0">
          <SheetTitle className="text-zinc-100">Inventory</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {inventory.length === 0 ? (
              <p className="text-zinc-500 text-sm italic">
                Your inventory is empty.
              </p>
            ) : (
              inventory.map((item) => (
                <div
                  key={item.instanceId}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        className={`font-medium ${getRarityColor(item.rarity)}`}
                      >
                        {item.baseItemId}{' '}
                        {item.quantity > 1 ? `x${item.quantity}` : ''}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Durability: {item.currentDurability.toFixed(0)}%
                      </p>
                    </div>
                    {item.equipSlot && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">
                        Equipped: {item.equipSlot}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Assuming all items can be equipped as WEAPON for this milestone mockup */}
                    {item.equipSlot !== 'WEAPON' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => handleEquip(item.instanceId, 'WEAPON')}
                        className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Sword className="h-3 w-3 mr-1" />
                        )}{' '}
                        Equip
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleEquip(item.instanceId, null)}
                        className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}{' '}
                        Unequip
                      </Button>
                    )}

                    {!item.equipSlot && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleSell(item.instanceId)}
                        className="h-7 text-xs border-amber-900/50 text-amber-500 hover:bg-amber-950 hover:text-amber-400"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Coins className="h-3 w-3 mr-1" />
                        )}{' '}
                        Sell ({getItemPrice(item.baseItemId)} EC)
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDrop(item.instanceId)}
                      className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-auto"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
