import {
  Player,
  PlayerInventory,
  Vehicle,
  VehicleComponent,
  ChatMessage,
  ActiveQuest,
} from '@prisma/client';
import { Send } from 'lucide-react';
import { InventorySheet } from './inventory-sheet';
import { VehicleSheet } from './vehicle-sheet';
import { CraftingSheet } from './crafting-sheet';
import { QuestLogSheet } from './quest-log';
import { ShopSheet } from './shop-sheet';
import { sendMessage } from '@/actions/chat';
import { RARITY_COLORS } from '@/lib/game/rarity';
import { ITEMS, getArmorDefense, getWeaponDamage } from '@/lib/game/items';
import { DAILY_CHARGES } from '@/lib/game/talent';
import { Meter } from './meter';

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
  const weapon = player.inventory.find((i) => i.equipSlot === 'WEAPON');
  const chest = player.inventory.find((i) => i.equipSlot === 'CHEST');
  const consumables = player.inventory.filter(
    (i) => ITEMS[i.baseItemId]?.effects && !i.equipSlot
  );
  const consumableCount = consumables.reduce((sum, i) => sum + i.quantity, 0);
  const openQuests = player.quests.filter((q) => q.status === 'ACTIVE').length;

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* SSS Talent */}
      <div
        className="mx-3 mt-3 p-3 border"
        style={{
          borderColor: 'rgba(176, 106, 224, 0.3)',
          background: 'var(--talent-soft)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--talent)' }}
          >
            SSS Talent: Upgrade
          </span>
          <span
            className="text-[10px] tabular-nums px-1.5 py-0.5"
            style={{
              color: 'var(--text)',
              background: 'rgba(0,0,0,0.35)',
              borderRadius: '3px',
            }}
          >
            {player.upgradeCharges}/{DAILY_CHARGES}
          </span>
        </div>
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Push any item or vehicle part up the rarity ladder. Costs charges and
          EC, and the cost climbs with the tier. Charges reset at midnight UTC.
        </p>
      </div>

      {/* Quick access slots */}
      <div className="px-3 pt-4 pb-3 space-y-2">
        <h3 className="micro">Quick Access</h3>

        <Slot
          index={1}
          name={weapon ? weapon.baseItemId : 'Empty Slot'}
          rarity={weapon?.rarity}
          detail={
            weapon
              ? `${weapon.rarity} · +${getWeaponDamage(weapon.baseItemId, weapon.rarity)} ATK`
              : 'No weapon equipped'
          }
        />
        <Slot
          index={2}
          name={chest ? chest.baseItemId : 'Empty Slot'}
          rarity={chest?.rarity}
          detail={
            chest
              ? `${chest.rarity} · +${getArmorDefense(chest.baseItemId, chest.rarity)} DEF`
              : 'No armor equipped'
          }
        />
        <Slot
          index={3}
          name={
            consumableCount > 0
              ? `${consumableCount} Consumables`
              : 'Empty Slot'
          }
          detail={
            consumables[0]
              ? `Next: ${consumables[0].baseItemId}`
              : 'Nothing to use'
          }
        />

        <InventorySheet
          inventory={player.inventory}
          credits={player.credits}
          charges={player.upgradeCharges}
        />
      </div>

      {/* Vehicle */}
      {player.vehicle && (
        <div className="px-3 py-4 border-t rule space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="micro">Vehicle</h3>
            <span className="micro-strong truncate">{player.vehicle.type}</span>
          </div>
          <Meter
            label="Fuel"
            value={player.vehicle.fuel}
            color="var(--accent)"
          />
          <Meter
            label="Armor"
            value={player.vehicle.armor}
            color="var(--stat-fatigue)"
          />
          <VehicleSheet
            vehicle={player.vehicle}
            credits={player.credits}
            charges={player.upgradeCharges}
          >
            <PanelButton>Vehicle Status</PanelButton>
          </VehicleSheet>
        </div>
      )}

      {/* Stations */}
      <div className="px-3 py-4 border-t rule space-y-2">
        <h3 className="micro mb-2.5">Stations</h3>
        <CraftingSheet player={player}>
          <PanelButton>Crafting Bench</PanelButton>
        </CraftingSheet>
        <ShopSheet player={player}>
          <PanelButton>Trading Post · {player.credits} EC</PanelButton>
        </ShopSheet>
        <QuestLogSheet player={player}>
          <PanelButton badge={openQuests > 0}>Bounty Board</PanelButton>
        </QuestLogSheet>
      </div>

      {/* World radio */}
      <div className="px-3 py-4 border-t rule flex flex-col flex-1 min-h-[220px]">
        <h3 className="micro mb-2.5">World Radio</h3>

        <div className="flex-1 min-h-[140px] overflow-y-auto custom-scrollbar border rule p-2 space-y-1.5 text-[10px] leading-relaxed">
          {chatMessages.length === 0 ? (
            <p className="italic" style={{ color: 'var(--text-dim)' }}>
              Static. Nobody on the channel yet.
            </p>
          ) : (
            chatMessages.map((msg) => (
              <p key={msg.id} className="break-words">
                <span
                  className="font-bold"
                  style={{
                    color:
                      msg.sender === player.username
                        ? 'var(--accent)'
                        : msg.sender === 'VANE'
                          ? 'var(--stat-health)'
                          : msg.npcId
                            ? 'var(--stat-thirst)'
                            : 'var(--text-muted)',
                  }}
                >
                  {msg.sender}:
                </span>{' '}
                <span style={{ color: 'var(--text-muted)' }}>
                  {msg.message}
                </span>
              </p>
            ))
          )}
        </div>

        <form
          action={async (formData) => {
            'use server';
            const message = formData.get('message') as string;
            if (message) await sendMessage(message);
          }}
          className="flex mt-2 border rule"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <input
            name="message"
            placeholder="Broadcast..."
            autoComplete="off"
            maxLength={200}
            aria-label="Broadcast to world radio"
            className="flex-1 min-w-0 h-7 px-2 text-[10px] bg-transparent outline-none placeholder:text-[var(--text-dim)]"
            style={{ color: 'var(--text)' }}
          />
          <button
            type="submit"
            aria-label="Send broadcast"
            className="h-7 w-7 shrink-0 inline-flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>

      <div className="px-3 pb-3 pt-1 text-right">
        <span className="micro">Prisma · Postgres · Docker</span>
      </div>
    </div>
  );
}

function Slot({
  index,
  name,
  detail,
  rarity,
}: {
  index: number;
  name: string;
  detail: string;
  rarity?: keyof typeof RARITY_COLORS;
}) {
  const empty = name === 'Empty Slot';
  return (
    <div
      className="flex items-center gap-2.5 p-2 border rule"
      style={{ borderRadius: 'var(--radius)', opacity: empty ? 0.5 : 1 }}
    >
      <span
        className="h-7 w-7 shrink-0 inline-flex items-center justify-center text-[10px] border rule"
        style={{ color: 'var(--text-dim)', borderRadius: '3px' }}
      >
        {index}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[11px] truncate ${rarity ? RARITY_COLORS[rarity].split(' ')[0] : ''}`}
          style={rarity ? undefined : { color: 'var(--text)' }}
          title={name}
        >
          {name}
        </p>
        <p className="text-[9px] truncate" style={{ color: 'var(--text-dim)' }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function PanelButton({
  children,
  badge,
}: {
  children: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      className="relative w-full h-8 px-2.5 text-left text-[10px] uppercase tracking-[0.12em] border rule transition-colors hover:border-[var(--line-strong)]"
      style={{ color: 'var(--text-muted)', borderRadius: 'var(--radius)' }}
    >
      {children}
      {badge && (
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </button>
  );
}
