import { HudLayout } from '@/components/game/hud-layout';
import { TopBar } from '@/components/game/top-bar';
import { VitalsPanel } from '@/components/game/vitals-panel';
import { NarrativeConsole } from '@/components/game/narrative-console';
import { QuickAccessPanel } from '@/components/game/quick-access-panel';

export default function Home() {
  return (
    <HudLayout
      topBar={<TopBar />}
      leftPanel={<VitalsPanel />}
      centerPanel={<NarrativeConsole />}
      rightPanel={<QuickAccessPanel />}
    />
  );
}
