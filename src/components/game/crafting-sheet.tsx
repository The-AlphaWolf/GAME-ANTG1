'use client';

import { useState, useTransition } from 'react';
import { Player, PlayerInventory } from '@prisma/client';
import { RECIPES } from '@/lib/game/crafting-recipes';
import { craftItem } from '@/actions/crafting';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Hammer, Loader2 } from 'lucide-react';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface CraftingSheetProps {
  player: Player & {
    inventory: PlayerInventory[];
  };
  children: React.ReactNode;
}

export function CraftingSheet({ player, children }: CraftingSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [craftingId, setCraftingId] = useState<string | null>(null);

  const handleCraft = (recipeId: string) => {
    setCraftingId(recipeId);
    startTransition(async () => {
      await craftItem(recipeId);
      setCraftingId(null);
    });
  };

  return (
    <Sheet>
      <SheetTrigger render={children as React.ReactElement} />
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[400px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0"
      >
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono">
          <div className="p-4 border-b border-zinc-800 shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Hammer className="h-5 w-5 text-zinc-400" />
              Crafting Bench
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Convert raw materials into useful gear.
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {RECIPES.map((recipe) => {
                let hasAll = true;
                const ingredientStatuses = recipe.ingredients.map((req) => {
                  const invItem = player.inventory.find(
                    (i) => i.baseItemId === req.baseItemId
                  );
                  const currentQty = invItem?.quantity || 0;
                  const hasEnough = currentQty >= req.quantity;
                  if (!hasEnough) hasAll = false;
                  return {
                    name: req.baseItemId,
                    req: req.quantity,
                    have: currentQty,
                    hasEnough,
                  };
                });

                const isCraftingThis = isPending && craftingId === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className="p-3 border border-zinc-800 bg-zinc-900/50 rounded-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-zinc-200">
                          {recipe.name}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {recipe.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={hasAll ? 'default' : 'outline'}
                        disabled={!hasAll || isPending}
                        onClick={() => handleCraft(recipe.id)}
                        className={
                          hasAll
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'border-zinc-700 text-zinc-600 bg-transparent'
                        }
                      >
                        {isCraftingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Craft'
                        )}
                      </Button>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="text-zinc-400">Requires:</span>
                      {ingredientStatuses.map((stat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between pl-2"
                        >
                          <span
                            className={
                              stat.hasEnough ? 'text-zinc-300' : 'text-red-400'
                            }
                          >
                            {stat.name}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <span
                              className={
                                stat.hasEnough
                                  ? 'text-zinc-400'
                                  : 'text-red-400'
                              }
                            >
                              {stat.have}/{stat.req}
                            </span>
                            {stat.hasEnough ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <X className="h-3 w-3 text-red-500" />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
