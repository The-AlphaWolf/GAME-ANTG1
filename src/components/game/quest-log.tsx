'use client';

import { useState, useTransition } from 'react';
import { Player, ActiveQuest } from '@prisma/client';
import { QUEST_REGISTRY, questsForChapter } from '@/lib/game/quests';
import { acceptQuest, turnInQuest } from '@/actions/quests';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { chapterForMiles } from '@/lib/game/story';
import { SheetShell, SheetSection, TinyButton, Empty } from './sheet-shell';

interface QuestLogSheetProps {
  player: Player & { quests: ActiveQuest[] };
  children: React.ReactNode;
}

export function QuestLogSheet({ player, children }: QuestLogSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
    });
  };

  const chapter = chapterForMiles(player.distanceTraveled).number;
  const active = player.quests.filter((q) => q.status === 'ACTIVE');
  const completed = player.quests.filter((q) => q.status === 'COMPLETED');
  const available = questsForChapter(chapter).filter(
    (def) => !player.quests.some((q) => q.questId === def.id)
  );

  return (
    <Sheet>
      <SheetTrigger render={children as React.ReactElement} />
      <SheetShell
        title="Bounty Board"
        subtitle="Contracts posted by the people you meet on the road. Kill, gather, or cover ground — then come back and settle up."
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

        <SheetSection label={`Active (${active.length})`}>
          {active.length === 0 ? (
            <Empty>No bounties in hand.</Empty>
          ) : (
            active.map((quest) => {
              const def = QUEST_REGISTRY[quest.questId];
              if (!def) return null;
              const ready = quest.progress >= def.targetQuantity;
              const pct = Math.min(
                100,
                (quest.progress / def.targetQuantity) * 100
              );

              return (
                <div
                  key={quest.id}
                  className="p-2.5 border rule space-y-2"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold">{def.title}</h4>
                      <p className="micro mt-1">
                        {def.giver} · {def.type}
                      </p>
                    </div>
                    <span
                      className="text-[10px] tabular-nums shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {quest.progress}/{def.targetQuantity}
                    </span>
                  </div>

                  <p
                    className="text-[10px] leading-relaxed"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {def.description}
                  </p>

                  <div
                    className="meter"
                    style={{
                      ['--meter-color' as string]: ready
                        ? 'var(--accent)'
                        : 'var(--stat-sanity)',
                    }}
                  >
                    <span style={{ width: `${pct}%` }} />
                  </div>

                  {ready && (
                    <TinyButton
                      tone="accent"
                      disabled={isPending}
                      onClick={() => run(() => turnInQuest(quest.questId))}
                    >
                      Turn in
                    </TinyButton>
                  )}
                </div>
              );
            })
          )}
        </SheetSection>

        <SheetSection label={`Posted (${available.length})`}>
          {available.length === 0 ? (
            <Empty>Nothing new posted. Drive further east.</Empty>
          ) : (
            available.map((def) => (
              <div
                key={def.id}
                className="p-2.5 border rule space-y-2"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-[12px] font-bold">{def.title}</h4>
                  <span className="micro shrink-0">{def.giver}</span>
                </div>
                <p
                  className="text-[10px] leading-relaxed"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {def.description}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--accent)' }}>
                  {[
                    def.rewards.credits && `${def.rewards.credits} EC`,
                    def.rewards.xp && `${def.rewards.xp} XP`,
                    def.rewards.reputation &&
                      `+${def.rewards.reputation} standing`,
                    ...(def.rewards.items ?? []).map(
                      (i) => `${i.quantity}× ${i.itemId}`
                    ),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <TinyButton
                  disabled={isPending}
                  onClick={() => run(() => acceptQuest(def.id))}
                >
                  Accept
                </TinyButton>
              </div>
            ))
          )}
        </SheetSection>

        {completed.length > 0 && (
          <SheetSection label={`Settled (${completed.length})`}>
            {completed.map((quest) => (
              <p
                key={quest.id}
                className="text-[10px]"
                style={{ color: 'var(--text-dim)' }}
              >
                ✓ {QUEST_REGISTRY[quest.questId]?.title ?? quest.questId}
              </p>
            ))}
          </SheetSection>
        )}
      </SheetShell>
    </Sheet>
  );
}
