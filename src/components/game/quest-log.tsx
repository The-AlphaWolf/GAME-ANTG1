'use client';

import { useTransition } from 'react';
import { Player, ActiveQuest } from '@prisma/client';
import { QUEST_REGISTRY } from '@/lib/game/quests';
import { acceptQuest, turnInQuest } from '@/actions/quests';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuestLogSheetProps {
  player: Player & {
    quests: ActiveQuest[];
  };
  children: React.ReactNode;
}

export function QuestLogSheet({ player, children }: QuestLogSheetProps) {
  const [isPending, startTransition] = useTransition();
  const handleAcceptQuest = (questId: string) => {
    startTransition(async () => {
      const result = await acceptQuest(questId);
      if (result.error) {
        console.error(result.error);
      }
    });
  };

  const handleTurnInQuest = (questId: string) => {
    startTransition(async () => {
      const result = await turnInQuest(questId);
      if (result.error) {
        console.error(result.error);
      }
    });
  };

  const availableQuests = Object.keys(QUEST_REGISTRY).filter((questId) => {
    const q = player.quests.find((active) => active.questId === questId);
    return !q; // Show if neither active nor completed (since completed also stays in DB with status COMPLETED)
  });

  const activeQuests = player.quests.filter((q) => q.status === 'ACTIVE');

  return (
    <Sheet>
      <SheetTrigger>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] bg-zinc-950 border-zinc-800 p-6 overflow-y-auto"
      >
        <h2 className="text-xl font-bold tracking-tight text-white mb-6">
          Bounty Board & Quest Log
        </h2>

        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          <div className="space-y-6">
            {/* Active Quests */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Active Quests
              </h3>
              {activeQuests.length === 0 ? (
                <p className="text-zinc-600 text-sm">No active quests.</p>
              ) : (
                <div className="space-y-4">
                  {activeQuests.map((quest) => {
                    const def = QUEST_REGISTRY[quest.questId];
                    if (!def) return null;
                    const isReadyToTurnIn =
                      quest.progress >= def.targetQuantity;

                    return (
                      <div
                        key={quest.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white">{def.title}</h4>
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                            {def.type}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">
                          {def.description}
                        </p>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-zinc-500 mb-1">
                            <span>Progress: {def.targetId}</span>
                            <span>
                              {quest.progress} / {def.targetQuantity}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{
                                width: `${Math.min(100, (quest.progress / def.targetQuantity) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {isReadyToTurnIn && (
                          <Button
                            onClick={() => handleTurnInQuest(quest.questId)}
                            disabled={isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 text-xs"
                          >
                            Turn In Quest
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Quests */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 mt-6">
                Bounty Board
              </h3>
              {availableQuests.length === 0 ? (
                <p className="text-zinc-600 text-sm">
                  No new bounties available.
                </p>
              ) : (
                <div className="space-y-4">
                  {availableQuests.map((questId) => {
                    const def = QUEST_REGISTRY[questId];
                    return (
                      <div
                        key={questId}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white">{def.title}</h4>
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                            {def.type}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">
                          {def.description}
                        </p>
                        <div className="text-xs text-zinc-500 mb-4">
                          <p>Rewards:</p>
                          <ul className="list-disc list-inside">
                            {def.rewards.credits && (
                              <li>{def.rewards.credits} Energy Credits</li>
                            )}
                            {def.rewards.xp && <li>{def.rewards.xp} XP</li>}
                            {def.rewards.items?.map((item) => (
                              <li key={item.itemId}>
                                {item.quantity}x {item.itemId}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          onClick={() => handleAcceptQuest(questId)}
                          disabled={isPending}
                          variant="outline"
                          className="w-full bg-zinc-950 border-zinc-700 hover:bg-zinc-800 text-white h-8 text-xs"
                        >
                          Accept Bounty
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
