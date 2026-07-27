import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { HudLayout } from '@/components/game/hud-layout';
import { TopBar } from '@/components/game/top-bar';
import { VitalsPanel } from '@/components/game/vitals-panel';
import { NarrativeConsole } from '@/components/game/narrative-console';
import { QuickAccessPanel } from '@/components/game/quick-access-panel';
import { chapterForMiles } from '@/lib/game/story';
import { computeVehicleBonuses } from '@/lib/game/vehicle';
import { clockFromTurns, weatherFromTurns } from '@/lib/game/world';

const BASE_FUEL_COST = 4;

export default async function Home() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
    include: {
      inventory: true,
      activeEncounter: true,
      vehicle: { include: { components: true } },
      quests: true,
    },
  });

  if (!player) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--stat-health)' }}>
        Error: player projection not found.
      </div>
    );
  }

  const [recentEvents, recentChats] = await Promise.all([
    prisma.eventLog.findMany({
      where: { playerId: player.id },
      orderBy: { timestamp: 'desc' },
      take: 40,
    }),
    prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
    }),
  ]);

  const chapter = chapterForMiles(player.distanceTraveled);
  const clock = clockFromTurns(player.turns);
  const weather = weatherFromTurns(player.turns);

  // Mirror of the cost explore() charges, so the button label never lies.
  const bonuses = player.vehicle
    ? computeVehicleBonuses(player.vehicle.components)
    : { fuelEfficiency: 1, speedBonus: 0, armorBonus: 0 };
  const fuelCost = Math.max(
    1,
    Math.round(BASE_FUEL_COST * weather.fuelFactor * bonuses.fuelEfficiency)
  );

  const suggestions = buildSuggestions(player);

  return (
    <HudLayout
      slug={`ANTG1 / CH.${String(chapter.number).padStart(2, '0')}`}
      stamp={`DAY ${String(clock.day).padStart(2, '0')} · ${chapter.title.toUpperCase()}`}
      topBar={<TopBar player={player} />}
      leftPanel={<VitalsPanel player={player} />}
      centerPanel={
        <NarrativeConsole
          events={[...recentEvents].reverse()}
          activeEncounter={player.activeEncounter}
          isDead={!player.isAlive || player.health <= 0}
          fuelCost={fuelCost}
          suggestions={suggestions}
        />
      }
      rightPanel={
        <QuickAccessPanel
          player={player}
          chatMessages={[...recentChats].reverse()}
        />
      }
    />
  );
}

/** Context-aware quick verbs. The old build showed three fixed lines from an
 * intro scene ("Search the glovebox") that no longer applied after mile zero. */
function buildSuggestions(player: {
  hunger: number;
  thirst: number;
  fatigue: number;
  energy: number;
  health: number;
  maxHealth: number;
  vehicle?: { fuel: number; armor: number } | null;
}): string[] {
  const suggestions: string[] = [];

  if (player.hunger >= 45) suggestions.push('Eat');
  if (player.thirst >= 45) suggestions.push('Drink');
  if (player.health < player.maxHealth * 0.6) suggestions.push('Use first aid');
  if (player.fatigue >= 50 || player.energy <= 35) suggestions.push('Rest');
  if ((player.vehicle?.fuel ?? 100) < 30) suggestions.push('Refuel');
  if ((player.vehicle?.armor ?? 100) < 50) suggestions.push('Repair the van');

  suggestions.push('Check status');
  if (suggestions.length < 4) suggestions.push('Radio Wren');

  return suggestions.slice(0, 5);
}
