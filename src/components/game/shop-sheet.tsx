'use client';

import { useState, useTransition } from 'react';
import { Player } from '@prisma/client';
import { SHOP_CATALOG, getShopBuyPrice } from '@/lib/game/economy';
import { buyItem } from '@/actions/economy';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Store, Loader2, Coins } from 'lucide-react';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ShopSheetProps {
  player: Player;
  children: React.ReactNode;
}

const CATEGORIES = ['Food & Water', 'Resources', 'Supplies'] as const;

export function ShopSheet({ player, children }: ShopSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handleBuy = (baseItemId: string) => {
    setBuyingId(baseItemId);
    startTransition(async () => {
      await buyItem(baseItemId);
      setBuyingId(null);
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
              <Store className="h-5 w-5 text-zinc-400" />
              Trading Post
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Spend your hard-earned EC on supplies. Sell from your inventory to
              earn more.
            </p>
            <div className="mt-2 flex items-center gap-2 text-amber-500 font-bold text-sm">
              <Coins className="h-4 w-4" />
              <span>{player.credits} EC</span>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="space-y-6">
              {CATEGORIES.map((category) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-zinc-500 tracking-wider mb-2 uppercase">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {SHOP_CATALOG.filter((i) => i.category === category).map(
                      (item) => {
                        const price = getShopBuyPrice(item.baseItemId);
                        const canAfford = player.credits >= price;
                        const isBuyingThis =
                          isPending && buyingId === item.baseItemId;

                        return (
                          <div
                            key={item.baseItemId}
                            className="p-3 border border-zinc-800 bg-zinc-900/50 rounded-md flex justify-between items-center gap-3"
                          >
                            <div className="min-w-0">
                              <h4 className="font-bold text-zinc-200 text-sm">
                                {item.baseItemId}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                {item.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={canAfford ? 'default' : 'outline'}
                              disabled={!canAfford || isPending}
                              onClick={() => handleBuy(item.baseItemId)}
                              className={
                                canAfford
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shrink-0'
                                  : 'border-zinc-700 text-zinc-600 bg-transparent shrink-0'
                              }
                            >
                              {isBuyingThis ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                `${price} EC`
                              )}
                            </Button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
