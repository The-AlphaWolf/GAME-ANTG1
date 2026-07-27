import { Player } from '@prisma/client';
import { Meter } from './meter';
import { levelProgress, xpForLevel, MAX_LEVEL } from '@/lib/game/progression';
import { chapterForMiles, WIN_DISTANCE } from '@/lib/game/story';

export function VitalsPanel({ player }: { player: Player }) {
  const chapter = chapterForMiles(player.distanceTraveled);
  const progress = levelProgress(player.level, player.xp);
  const nextLevelXp = xpForLevel(Math.min(MAX_LEVEL, player.level + 1));

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Identity */}
      <div className="px-4 py-4 border-b rule">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="text-sm font-bold truncate" title={player.username}>
            {player.username}
          </h2>
          <span className="micro-strong shrink-0">LV {player.level}</span>
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="micro">Survivor</span>
          <span
            className="text-[10px] tabular-nums"
            style={{ color: 'var(--text-dim)' }}
          >
            {player.xp} / {nextLevelXp} XP
          </span>
        </div>
        <div
          className="meter"
          style={{ ['--meter-color' as string]: 'var(--stat-xp)' }}
        >
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Vitals */}
      <div className="px-4 py-4 space-y-4 border-b rule">
        <h3 className="micro">Survivor Vitals</h3>

        <Meter
          label="Health"
          value={player.health}
          max={player.maxHealth}
          color="var(--stat-health)"
          readout={`${player.health}/${player.maxHealth}`}
        />
        <Meter
          label="Energy"
          value={player.energy}
          color="var(--stat-energy)"
        />
        <Meter
          label="Hunger"
          value={player.hunger}
          color="var(--stat-hunger)"
        />
        <Meter
          label="Thirst"
          value={player.thirst}
          color="var(--stat-thirst)"
        />
        <Meter
          label="Sanity"
          value={player.sanity}
          color="var(--stat-sanity)"
        />
        <Meter
          label="Fatigue"
          value={player.fatigue}
          color="var(--stat-fatigue)"
        />
      </div>

      {/* Run status */}
      <div className="px-4 py-4 space-y-3">
        <h3 className="micro">Run Status</h3>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="micro-strong">Chapter {chapter.number}</span>
            <span
              className="text-[10px] tabular-nums"
              style={{ color: 'var(--text-muted)' }}
            >
              {player.distanceTraveled} / {WIN_DISTANCE} mi
            </span>
          </div>
          <div
            className="meter"
            style={{ ['--meter-color' as string]: 'var(--accent)' }}
          >
            <span
              style={{
                width: `${Math.min(100, (player.distanceTraveled / WIN_DISTANCE) * 100)}%`,
              }}
            />
          </div>
          <p
            className="text-[10px] leading-relaxed pt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            {chapter.objective}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1">
          <Stat label="Standing" value={player.reputation} />
          <Stat label="Skill Pts" value={player.skillPoints} />
        </dl>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="micro mb-1">{label}</dt>
      <dd className="text-xs tabular-nums" style={{ color: 'var(--text)' }}>
        {value}
      </dd>
    </div>
  );
}
