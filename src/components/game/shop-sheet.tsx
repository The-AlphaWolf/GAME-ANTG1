'use client';

import { useState, useTransition } from 'react';
import { Player } from '@prisma/client';
import { getShopBuyPrice, shopCatalogForChapter } from '@/lib/game/economy';
import { buyItem } from '@/actions/economy';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { chapterForMiles } from '@/lib/game/story';
import { ITEMS } from '@/lib/game/items';
import { SheetShell, SheetSection, TinyButton, Row } from './sheet-shell';

interface ShopSheetProps {
  player: Player;
  children: React.ReactNode;
}

const CATEGORIES = ['Food & Water', 'Supplies', 'Gear', 'Resources'] as const;

export function ShopSheet({ player, children }: ShopSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chapter = chapterForMiles(player.distanceTraveled).number;
  const catalog = shopCatalogForChapter(chapter);

  const handleBuy = (baseItemId: string, quantity: number) => {
    setBuyingId(baseItemId);
    setError(null);
    startTransition(async () => {
      const result = await buyItem(baseItemId, quantity);
      if (result.error) setError(result.error);
      setBuyingId(null);
    });
  };

  return (
    <Sheet>
      <SheetTrigger render={children as React.ReactElement} />
      <SheetShell
        title="Trading Post"
        subtitle="Boone's salvage bay. He stocks deeper the further east you get. Sell from your inventory to earn more."
        meta={<span className="accent text-[10px]">{player.credits} EC</span>}
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

        {CATEGORIES.map((category) => {
          const items = catalog.filter((i) => i.category === category);
          if (items.length === 0) return null;

          return (
            <SheetSection key={category} label={category}>
              {items.map((item) => {
                const price = getShopBuyPrice(item.baseItemId);
                const busy = isPending && buyingId === item.baseItemId;

                return (
                  <Row key={item.baseItemId}>
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold">
                        {item.baseItemId}
                      </h4>
                      <p
                        className="text-[10px] leading-relaxed mt-0.5"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        {ITEMS[item.baseItemId]?.description ??
                          item.description}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <TinyButton
                        tone="accent"
                        pending={busy}
                        disabled={isPending || player.credits < price}
                        onClick={() => handleBuy(item.baseItemId, 1)}
                      >
                        {price} EC
                      </TinyButton>
                      <TinyButton
                        disabled={isPending || player.credits < price * 5}
                        onClick={() => handleBuy(item.baseItemId, 5)}
                        title={`Buy 5 for ${price * 5} EC`}
                      >
                        ×5
                      </TinyButton>
                    </div>
                  </Row>
                );
              })}
            </SheetSection>
          );
        })}
      </SheetShell>
    </Sheet>
  );
}
