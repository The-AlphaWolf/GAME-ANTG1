'use client';

import { useState, useTransition } from 'react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { Vehicle, VehicleComponent } from '@prisma/client';
import { repairComponent } from '@/actions/vehicle';
import { upgradeTalent } from '@/actions/talent';
import { computeVehicleBonuses } from '@/lib/game/vehicle';
import { chargeCostFor, creditCostFor } from '@/lib/game/talent';
import { RARITY_COLORS } from '@/lib/game/rarity';
import { Meter } from './meter';
import { SheetShell, SheetSection, TinyButton } from './sheet-shell';

type VehicleWithComponents = Vehicle & { components: VehicleComponent[] };

export function VehicleSheet({
  vehicle,
  credits,
  charges,
  children,
}: {
  vehicle?: VehicleWithComponents | null;
  credits: number;
  charges: number;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string; message?: string }>) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      setMessage(result.error ?? result.message ?? null);
    });
  };

  if (!vehicle) return null;

  const bonuses = computeVehicleBonuses(vehicle.components);

  return (
    <Sheet>
      <SheetTrigger render={children as React.ReactElement} />
      <SheetShell
        title={`${vehicle.type} · LV ${vehicle.level}`}
        subtitle="Your mobile base. Component rarity drives fuel economy, speed and how much of a hit you shrug off — upgrade parts with the SSS Talent."
      >
        {message && (
          <p
            className="mb-3 text-[10px] p-2 border rule"
            style={{ color: 'var(--accent)', borderRadius: 'var(--radius)' }}
          >
            {message}
          </p>
        )}

        <SheetSection label="Condition">
          <Meter label="Fuel" value={vehicle.fuel} color="var(--accent)" />
          <Meter
            label="Armor"
            value={vehicle.armor}
            color="var(--stat-fatigue)"
          />
          <dl className="grid grid-cols-3 gap-2 pt-1">
            <Bonus
              label="Fuel Burn"
              value={`${Math.round(bonuses.fuelEfficiency * 100)}%`}
            />
            <Bonus label="Speed" value={`+${bonuses.speedBonus} mi`} />
            <Bonus label="Damage Red." value={`-${bonuses.armorBonus}`} />
          </dl>
        </SheetSection>

        <SheetSection label="Core Components">
          {vehicle.components.map((comp) => {
            const condition = (comp.durability / comp.maxDurability) * 100;
            const upgradeCharges = chargeCostFor(comp.rarity);
            const upgradeCredits = creditCostFor(comp.rarity);
            const canUpgrade =
              comp.rarity !== 'MYTHICAL' &&
              charges >= upgradeCharges &&
              credits >= upgradeCredits;

            return (
              <div
                key={comp.id}
                className="p-2.5 border rule space-y-2"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4
                      className={`text-[12px] font-bold ${RARITY_COLORS[comp.rarity]}`}
                    >
                      {comp.name}
                    </h4>
                    <p className="micro mt-1">
                      {comp.type} · {comp.rarity}
                      {comp.upgradeCount > 0 && ` · ×${comp.upgradeCount}`}
                    </p>
                  </div>
                  <span
                    className="text-[10px] tabular-nums shrink-0"
                    style={{
                      color:
                        condition < 30
                          ? 'var(--stat-health)'
                          : condition < 70
                            ? 'var(--stat-energy)'
                            : 'var(--text-muted)',
                    }}
                  >
                    {comp.durability.toFixed(0)}%
                  </span>
                </div>

                <div
                  className="meter"
                  style={{
                    ['--meter-color' as string]:
                      condition < 30
                        ? 'var(--stat-health)'
                        : condition < 70
                          ? 'var(--stat-energy)'
                          : '#4ade80',
                  }}
                >
                  <span style={{ width: `${condition}%` }} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <TinyButton
                    disabled={
                      isPending || comp.durability >= comp.maxDurability
                    }
                    onClick={() => run(() => repairComponent(comp.id, 25))}
                  >
                    Repair
                  </TinyButton>
                  {comp.rarity !== 'MYTHICAL' && (
                    <TinyButton
                      tone="talent"
                      disabled={isPending || !canUpgrade}
                      onClick={() =>
                        run(() => upgradeTalent(comp.id, 'vehicle'))
                      }
                    >
                      Upgrade ({upgradeCharges}c / {upgradeCredits} EC)
                    </TinyButton>
                  )}
                </div>
              </div>
            );
          })}
        </SheetSection>
      </SheetShell>
    </Sheet>
  );
}

function Bonus({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="micro mb-1">{label}</dt>
      <dd className="text-[11px] tabular-nums">{value}</dd>
    </div>
  );
}
