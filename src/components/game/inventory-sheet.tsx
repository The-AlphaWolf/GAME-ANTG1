'use client';

import { useState, useTransition } from 'react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { PlayerInventory } from '@prisma/client';
import { equipItem, dropItem, consumeItem } from '@/actions/inventory';
import { sellItem } from '@/actions/economy';
import { getItemPrice } from '@/lib/game/economy';
import {
  ITEMS,
  getArmorDefense,
  getEquipSlot,
  getWeaponDamage,
} from '@/lib/game/items';
import { chargeCostFor, creditCostFor } from '@/lib/game/talent';
import { upgradeTalent } from '@/actions/talent';
import { RARITY_COLORS } from '@/lib/game/rarity';
import { SheetShell, SheetSection, TinyButton, Empty } from './sheet-shell';

interface InventorySheetProps {
  inventory: PlayerInventory[];
  credits: number;
  charges: number;
}

const GROUPS = [
  { key: 'Equipped', match: (i: PlayerInventory) => !!i.equipSlot },
  {
    key: 'Gear',
    match: (i: PlayerInventory) => !i.equipSlot && !!getEquipSlot(i.baseItemId),
  },
  {
    key: 'Consumables',
    match: (i: PlayerInventory) =>
      !i.equipSlot &&
      !getEquipSlot(i.baseItemId) &&
      !!ITEMS[i.baseItemId]?.effects,
  },
  {
    key: 'Materials',
    match: (i: PlayerInventory) =>
      !i.equipSlot &&
      !getEquipSlot(i.baseItemId) &&
      !ITEMS[i.baseItemId]?.effects,
  },
];

export function InventorySheet({
  inventory,
  credits,
  charges,
}: InventorySheetProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string; message?: string }>) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      setMessage(result.error ?? result.message ?? null);
    });
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            className="w-full h-8 px-2.5 text-left text-[10px] uppercase tracking-[0.12em] border rule transition-colors hover:border-[var(--line-strong)]"
            style={{
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius)',
            }}
          >
            Full Inventory ({inventory.length})
          </button>
        }
      />
      <SheetShell
        title="Inventory"
        subtitle="Equip gear, use supplies, sell surplus, or spend SSS Talent charges to push an item up the rarity ladder."
        meta={
          <div className="flex gap-4 text-[10px]">
            <span className="accent tabular-nums">{credits} EC</span>
            <span style={{ color: 'var(--talent)' }}>{charges} charges</span>
          </div>
        }
      >
        {message && (
          <p
            className="mb-3 text-[10px] p-2 border rule"
            style={{ color: 'var(--accent)', borderRadius: 'var(--radius)' }}
          >
            {message}
          </p>
        )}

        {inventory.length === 0 ? (
          <Empty>The van is empty. Scavenge something.</Empty>
        ) : (
          GROUPS.map((group) => {
            const items = inventory.filter(group.match);
            if (items.length === 0) return null;

            return (
              <SheetSection key={group.key} label={group.key}>
                {items.map((item) => {
                  const def = ITEMS[item.baseItemId];
                  const slot = getEquipSlot(item.baseItemId);
                  const upgradeCharges = chargeCostFor(item.rarity);
                  const upgradeCredits = creditCostFor(item.rarity);
                  const canUpgrade =
                    item.rarity !== 'MYTHICAL' &&
                    charges >= upgradeCharges &&
                    credits >= upgradeCredits;

                  return (
                    <div
                      key={item.instanceId}
                      className="p-2.5 border rule space-y-2"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4
                            className={`text-[12px] font-bold ${RARITY_COLORS[item.rarity]}`}
                          >
                            {item.baseItemId}
                            {item.quantity > 1 && ` ×${item.quantity}`}
                          </h4>
                          <p
                            className="text-[10px] leading-relaxed mt-0.5"
                            style={{ color: 'var(--text-dim)' }}
                          >
                            {def?.description ?? 'Unidentified salvage.'}
                          </p>
                          <p
                            className="text-[10px] mt-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.rarity}
                            {slot === 'WEAPON' &&
                              ` · +${getWeaponDamage(item.baseItemId, item.rarity)} ATK`}
                            {slot &&
                              slot !== 'WEAPON' &&
                              ` · +${getArmorDefense(item.baseItemId, item.rarity)} DEF`}
                            {item.upgradeCount > 0 &&
                              ` · upgraded ×${item.upgradeCount}`}
                          </p>
                        </div>
                        {item.equipSlot && (
                          <span
                            className="shrink-0 text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5"
                            style={{
                              color: 'var(--accent)',
                              background: 'var(--accent-soft)',
                              borderRadius: '3px',
                            }}
                          >
                            {item.equipSlot}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {slot && !item.equipSlot && (
                          <TinyButton
                            tone="accent"
                            disabled={isPending}
                            onClick={() =>
                              run(() => equipItem(item.instanceId, slot))
                            }
                          >
                            Equip
                          </TinyButton>
                        )}
                        {item.equipSlot && (
                          <TinyButton
                            disabled={isPending}
                            onClick={() =>
                              run(() => equipItem(item.instanceId, null))
                            }
                          >
                            Unequip
                          </TinyButton>
                        )}
                        {def?.effects && !item.equipSlot && (
                          <TinyButton
                            tone="good"
                            disabled={isPending}
                            onClick={() =>
                              run(() => consumeItem(item.instanceId))
                            }
                          >
                            Use
                          </TinyButton>
                        )}
                        {item.rarity !== 'MYTHICAL' && (
                          <TinyButton
                            tone="talent"
                            disabled={isPending || !canUpgrade}
                            title={`${upgradeCharges} charge(s) + ${upgradeCredits} EC`}
                            onClick={() =>
                              run(() =>
                                upgradeTalent(item.instanceId, 'inventory')
                              )
                            }
                          >
                            Upgrade ({upgradeCharges}c / {upgradeCredits} EC)
                          </TinyButton>
                        )}
                        {!item.equipSlot && (
                          <TinyButton
                            disabled={isPending}
                            onClick={() => run(() => sellItem(item.instanceId))}
                          >
                            Sell {getItemPrice(item.baseItemId, item.rarity)} EC
                          </TinyButton>
                        )}
                        {!item.equipSlot && item.quantity > 1 && (
                          <TinyButton
                            disabled={isPending}
                            onClick={() =>
                              run(() =>
                                sellItem(item.instanceId, item.quantity)
                              )
                            }
                          >
                            Sell all
                          </TinyButton>
                        )}
                        {!item.equipSlot && (
                          <TinyButton
                            tone="danger"
                            disabled={isPending}
                            onClick={() => run(() => dropItem(item.instanceId))}
                          >
                            Drop
                          </TinyButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </SheetSection>
            );
          })
        )}
      </SheetShell>
    </Sheet>
  );
}
