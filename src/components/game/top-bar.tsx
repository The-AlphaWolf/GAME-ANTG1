import { Player } from '@prisma/client';
import { NewGameButton } from './new-game-button';
import {
  clockFromTurns,
  threatLevel,
  weatherFromTurns,
} from '@/lib/game/world';
import { chapterForMiles } from '@/lib/game/story';

export function TopBar({ player }: { player: Player }) {
  const clock = clockFromTurns(player.turns);
  const weather = weatherFromTurns(player.turns);
  const chapter = chapterForMiles(player.distanceTraveled);
  const threat = threatLevel(chapter.tier, player.turns);

  return (
    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px] tracking-wide">
      <span className="font-bold" style={{ color: 'var(--text)' }}>
        DAY {clock.day}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>{clock.label}</span>

      <span className="hidden sm:inline" style={{ color: 'var(--text-dim)' }}>
        ·
      </span>
      <span className="uppercase" style={{ color: 'var(--text-muted)' }}>
        {weather.label} {weather.temperatureC}°C
      </span>

      <span className="hidden sm:inline" style={{ color: 'var(--text-dim)' }}>
        ·
      </span>
      <span
        className="uppercase truncate max-w-[200px] md:max-w-none"
        style={{ color: 'var(--text-muted)' }}
      >
        {chapter.zone}, Mile {player.distanceTraveled}
      </span>

      <span
        className="hidden lg:inline micro"
        title={`Threat level ${threat} of 3`}
      >
        Threat {'▰'.repeat(threat)}
        {'▱'.repeat(3 - threat)}
      </span>

      <span className="ml-auto flex items-center gap-3">
        <span className="accent font-bold tabular-nums">
          {player.credits} EC
        </span>
        <span className="hidden md:block">
          <NewGameButton />
        </span>
      </span>
    </div>
  );
}
