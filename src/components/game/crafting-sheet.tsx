'use client';

import { useState, useTransition } from 'react';
import { Player, PlayerInventory } from '@prisma/client';
import { recipesForChapter } from '@/lib/game/crafting-recipes';
import { craftItem } from '@/actions/crafting';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { chapterForMiles } from '@/lib/game/story';
import { SheetShell, TinyButton, Empty } from './sheet-shell';

interface CraftingSheetProps {
  player: Player & { inventory: PlayerInventory[] };
  children: React.ReactNode;
}

export function CraftingSheet({ player, children }: CraftingSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [craftingId, setCraftingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chapter = chapterForMiles(player.distanceTraveled).number;
  const recipes = recipesForChapter(chapter);

  // Materials can sit in several stacks of differing rarity, so totals are
  // summed rather than read off one row.
  const held = (baseItemId: string) =>
    player.inventory
      .filter((i) => i.baseItemId === baseItemId && !i.equipSlot)
      .reduce((sum, i) => sum + i.quantity, 0);

  const handleCraft = (recipeId: string) => {
    setCraftingId(recipeId);
    setError(null);
    startTransition(async () => {
      const result = await craftItem(recipeId);
      if (result.error) setError(result.error);
      setCraftingId(null);
    });
  };

  return (
    <Sheet>
      <SheetTrigger render={children as React.ReactElement} />
      <SheetShell
        title="Crafting Bench"
        subtitle="Tailgate workshop. Turn salvage into food, fuel, medicine and weapons. More recipes unlock as you drive east."
      >
        {error && (
          <p
            className="mb-3 text-[10px] p-2 border rule"
            style={{
              color: 'var(--stat-health)',
              borderRadius: 'var(--radius)',
            }}
          >
            {error}
          </p>
        )}

        {recipes.length === 0 ? (
          <Empty>Nothing you can build yet.</Empty>
        ) : (
          <div className="space-y-2">
            {recipes.map((recipe) => {
              const ingredients = recipe.ingredients.map((req) => ({
                ...req,
                have: held(req.baseItemId),
                ok: held(req.baseItemId) >= req.quantity,
              }));
              const canCraft = ingredients.every((i) => i.ok);

              return (
                <div
                  key={recipe.id}
                  className="p-2.5 border rule space-y-2"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold">
                        {recipe.name}
                        {recipe.outputQuantity > 1 &&
                          ` ×${recipe.outputQuantity}`}
                      </h4>
                      <p
                        className="text-[10px] leading-relaxed mt-0.5"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        {recipe.description}
                      </p>
                    </div>
                    <TinyButton
                      tone={canCraft ? 'accent' : 'default'}
                      disabled={!canCraft || isPending}
                      pending={isPending && craftingId === recipe.id}
                      onClick={() => handleCraft(recipe.id)}
                    >
                      Craft
                    </TinyButton>
                  </div>

                  <ul className="space-y-0.5">
                    {ingredients.map((req) => (
                      <li
                        key={req.baseItemId}
                        className="flex justify-between text-[10px]"
                        style={{
                          color: req.ok
                            ? 'var(--text-muted)'
                            : 'var(--stat-health)',
                        }}
                      >
                        <span>{req.baseItemId}</span>
                        <span className="tabular-nums">
                          {req.have}/{req.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </SheetShell>
    </Sheet>
  );
}
