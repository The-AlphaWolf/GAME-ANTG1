import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { HudLayout } from '@/components/game/hud-layout';
import { TopBar } from '@/components/game/top-bar';
import { VitalsPanel } from '@/components/game/vitals-panel';
import { NarrativeConsole } from '@/components/game/narrative-console';
import { QuickAccessPanel } from '@/components/game/quick-access-panel';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Use the session name (username) to find the player
  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
    include: {
      inventory: true,
      activeEncounter: true,
      vehicle: { include: { components: true } },
    },
  });

  if (!player) {
    // If somehow a user exists but player projection doesn't, redirect or error
    return (
      <div className="p-8 text-red-500 font-mono">
        Error: Player projection not found.
      </div>
    );
  }

  // Fetch recent events for the action feed (last 20)
  const recentEvents = await prisma.eventLog.findMany({
    where: { playerId: player.id },
    orderBy: { timestamp: 'desc' },
    take: 20,
  });

  const recentChats = await prisma.chatMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Since we fetch desc to get latest, we should reverse to display chronologically
  const sortedEvents = recentEvents.reverse();
  const sortedChats = recentChats.reverse();

  return (
    <HudLayout
      topBar={<TopBar player={player} />}
      leftPanel={<VitalsPanel player={player} />}
      centerPanel={
        <NarrativeConsole
          events={sortedEvents}
          activeEncounter={player.activeEncounter}
        />
      }
      rightPanel={
        <QuickAccessPanel player={player} chatMessages={sortedChats} />
      }
    />
  );
}
