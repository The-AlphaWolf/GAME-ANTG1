'use client';

import { useEffect, useRef } from 'react';
import { EventLog } from '@prisma/client';

/** Colour per event type. Story and level-up lines get the accent so the
 * important beats stand out in a wall of monospace. */
const TONE: Record<string, string> = {
  PLAYER_ACTION: 'var(--text-dim)',
  COMBAT_START: 'var(--stat-health)',
  COMBAT_TURN_TEXT: 'var(--stat-health)',
  PLAYER_DIED: 'var(--stat-health)',
  STORY_BEAT: 'var(--accent)',
  STORY_WIN: 'var(--accent)',
  LEVEL_UP: 'var(--stat-energy)',
  TALENT_USED: 'var(--talent)',
  NPC_ENCOUNTER: 'var(--stat-thirst)',
  QUEST_ACCEPTED: 'var(--stat-sanity)',
  QUEST_COMPLETED: 'var(--stat-sanity)',
  QUEST_OBJECTIVE_COMPLETE: 'var(--stat-sanity)',
  SURVIVAL_WARNING: 'var(--stat-hunger)',
};

export function ActionFeed({ events }: { events: EventLog[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [events]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3.5">
      <div className="space-y-2.5 max-w-3xl">
        {events.map((e) => {
          const payload = (e.payload as Record<string, unknown>) || {};
          let text = payload.text as string | undefined;
          // COMBAT_TURN rows also carry an `action`, but they are telemetry —
          // echoing them printed a bare "> ATTACK" above every combat line.
          if (!text && e.eventType === 'PLAYER_ACTION' && payload.action) {
            text = `> ${payload.action}`;
          }
          if (!text) return null;

          const time = new Date(e.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          const emphasised =
            e.eventType === 'STORY_BEAT' ||
            e.eventType === 'STORY_WIN' ||
            e.eventType === 'LEVEL_UP';

          return (
            <div key={e.id} className="flex gap-3 text-[12px] leading-relaxed">
              <span
                className="shrink-0 tabular-nums pt-px text-[11px]"
                style={{ color: 'var(--text-dim)' }}
              >
                [{time}]
              </span>
              <p
                className={emphasised ? 'font-bold' : ''}
                style={{ color: TONE[e.eventType] ?? 'var(--text)' }}
              >
                {text}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
