'use client';

import { useState, useTransition } from 'react';
import { ActionFeed } from './action-feed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Sword, Map, Search, Skull } from 'lucide-react';
import { submitAction, respawn } from '@/actions/game';
import {
  executeCombatTurn,
  CombatAction,
  initiateCombat,
} from '@/actions/combat';
import { explore, scavenge } from '@/actions/exploration';
import { NewGameButton } from './new-game-button';
import { EventLog, ActiveEncounter } from '@prisma/client';
import { Progress } from '@/components/ui/progress';

interface NarrativeConsoleProps {
  events: EventLog[];
  activeEncounter?: ActiveEncounter | null;
  isDead?: boolean;
}

export function NarrativeConsole({
  events,
  activeEncounter,
  isDead,
}: NarrativeConsoleProps) {
  const [customAction, setCustomAction] = useState('');
  const [isPending, startTransition] = useTransition();

  const defaultChoices = [
    { id: 1, text: 'Search the glovebox' },
    { id: 2, text: 'Try to start the engine again' },
    { id: 3, text: 'Look out the window' },
  ];

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('actionText', text);
      await submitAction(formData);
      setCustomAction('');
    });
  };

  const handleCombatAction = (action: CombatAction) => {
    startTransition(async () => {
      await executeCombatTurn(action);
    });
  };

  const handleExplore = () => {
    startTransition(async () => {
      await explore();
    });
  };

  const handleScavenge = () => {
    startTransition(async () => {
      await scavenge();
    });
  };

  const handleRespawn = () => {
    startTransition(async () => {
      await respawn();
    });
  };

  const handleSpawnEnemy = () => {
    startTransition(async () => {
      await initiateCombat('Wasteland Goblin', 40, 8);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Event Log feed (Takes up most of the space) */}
      <ActionFeed events={events} />

      {/* Death Screen */}
      {isDead ? (
        <div className="p-8 border-t border-red-900/50 bg-red-950/20 backdrop-blur shrink-0 z-10 flex flex-col items-center gap-4 text-center">
          <Skull className="h-10 w-10 text-red-500" />
          <div>
            <p className="text-red-400 font-bold uppercase tracking-widest text-lg">
              You Died
            </p>
            <p className="text-zinc-400 text-sm mt-1">
              Your journey ends here... but the road always offers another
              chance. Respawning costs half your EC.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRespawn}
              disabled={isPending}
              className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Skull className="h-4 w-4 mr-2" />
              )}
              Respawn
            </Button>
            <NewGameButton variant="death" />
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur shrink-0 z-10 flex flex-col gap-4">
          {/* Active Encounter Status */}
          {activeEncounter ? (
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3">
              <div className="flex justify-between items-end mb-2">
                <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                  <Sword className="h-4 w-4" /> {activeEncounter.enemyName}
                </span>
                <span className="text-xs text-red-300">
                  {activeEncounter.enemyHp.toFixed(0)} /{' '}
                  {activeEncounter.enemyMaxHp.toFixed(0)} HP
                </span>
              </div>
              <Progress
                value={
                  (activeEncounter.enemyHp / activeEncounter.enemyMaxHp) * 100
                }
                className="h-1.5 bg-red-950 [&>div]:bg-red-500"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                onClick={handleExplore}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Map className="h-4 w-4 mr-2" />
                )}
                Drive Forward (-5 Fuel)
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                onClick={handleScavenge}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Scavenge Area (-5 Energy)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSpawnEnemy}
                disabled={isPending}
                className="text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              >
                [DEV]
              </Button>
            </div>
          )}

          {/* Quick Choices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeEncounter ? (
              <>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleCombatAction('ATTACK')}
                  className="justify-start bg-red-950/30 border-red-900/50 text-red-200 hover:text-white hover:bg-red-900/50"
                >
                  <span className="mr-2 text-red-500 font-mono">1.</span> Attack
                </Button>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleCombatAction('DEFEND')}
                  className="justify-start bg-blue-950/30 border-blue-900/50 text-blue-200 hover:text-white hover:bg-blue-900/50"
                >
                  <span className="mr-2 text-blue-500 font-mono">2.</span>{' '}
                  Defend
                </Button>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleCombatAction('FLEE')}
                  className="justify-start bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 sm:col-span-2"
                >
                  <span className="mr-2 text-zinc-500 font-mono">3.</span> Flee
                </Button>
              </>
            ) : (
              defaultChoices.map((choice) => (
                <Button
                  key={choice.id}
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleSubmit(choice.text)}
                  className="justify-start bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                >
                  <span className="mr-2 text-zinc-500 font-mono">
                    {choice.id}.
                  </span>{' '}
                  {choice.text}
                </Button>
              ))
            )}
          </div>

          {/* Custom Input */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(customAction);
            }}
          >
            <Input
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              disabled={isPending || !!activeEncounter}
              placeholder={
                activeEncounter ? 'Focus on combat!' : 'Type your action...'
              }
              className="bg-zinc-900 border-zinc-800 font-mono text-sm placeholder:text-zinc-600 focus-visible:ring-zinc-700"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isPending || !!activeEncounter}
              className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send Action</span>
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
