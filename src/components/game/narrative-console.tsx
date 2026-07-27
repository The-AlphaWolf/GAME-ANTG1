'use client';

import { useState, useTransition } from 'react';
import { ActionFeed } from './action-feed';
import { NewGameButton } from './new-game-button';
import { EventLog, ActiveEncounter } from '@prisma/client';
import {
  Loader2,
  Send,
  Route,
  Search,
  Swords,
  Shield,
  ArrowLeftRight,
  Skull,
} from 'lucide-react';
import { submitAction, respawn } from '@/actions/game';
import { executeCombatTurn } from '@/actions/combat';
import { explore, scavenge } from '@/actions/exploration';

interface NarrativeConsoleProps {
  events: EventLog[];
  activeEncounter?: ActiveEncounter | null;
  isDead?: boolean;
  fuelCost: number;
  suggestions: string[];
}

export function NarrativeConsole({
  events,
  activeEncounter,
  isDead,
  fuelCost,
  suggestions,
}: NarrativeConsoleProps) {
  const [customAction, setCustomAction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result && 'error' in result && result.error) setError(result.error);
    });
  };

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    run(async () => {
      const formData = new FormData();
      formData.append('actionText', text);
      const result = await submitAction(formData);
      setCustomAction('');
      return result;
    });
  };

  return (
    <div className="panel flex flex-col h-full min-h-0 overflow-hidden">
      <ActionFeed events={events} />

      {error && (
        <div
          role="alert"
          className="shrink-0 px-4 py-2 border-t rule text-[11px]"
          style={{
            color: 'var(--stat-health)',
            background: 'rgba(239, 74, 74, 0.07)',
          }}
        >
          {error}
        </div>
      )}

      {isDead ? (
        <div className="shrink-0 border-t rule px-4 py-5 flex flex-col items-center gap-3 text-center">
          <Skull className="h-6 w-6" style={{ color: 'var(--stat-health)' }} />
          <div>
            <p
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: 'var(--stat-health)' }}
            >
              You Died
            </p>
            <p
              className="text-[11px] mt-1.5 max-w-md"
              style={{ color: 'var(--text-muted)' }}
            >
              Marlow&rsquo;s people can get you breathing again. It costs a
              quarter of your EC and nothing else — your gear and your miles
              stay yours.
            </p>
          </div>
          <div className="flex gap-2">
            <ConsoleButton
              onClick={() => run(respawn)}
              disabled={isPending}
              pending={isPending}
              icon={<Skull className="h-3.5 w-3.5" />}
              tone="danger"
              label="Respawn"
            >
              Respawn
            </ConsoleButton>
            <NewGameButton variant="death" />
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t rule p-3 space-y-2.5">
          {activeEncounter ? (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.14em] flex items-center gap-1.5"
                  style={{ color: 'var(--stat-health)' }}
                >
                  <Swords className="h-3.5 w-3.5" />
                  {activeEncounter.enemyName}
                </span>
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {activeEncounter.enemyHp.toFixed(0)} /{' '}
                  {activeEncounter.enemyMaxHp.toFixed(0)} HP
                </span>
              </div>
              <div
                className="meter"
                style={{ ['--meter-color' as string]: 'var(--stat-health)' }}
              >
                <span
                  style={{
                    width: `${(activeEncounter.enemyHp / activeEncounter.enemyMaxHp) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <ConsoleButton
                  onClick={() => run(() => executeCombatTurn('ATTACK'))}
                  disabled={isPending}
                  pending={isPending}
                  icon={<Swords className="h-3.5 w-3.5" />}
                  tone="danger"
                  label="Attack"
                >
                  Attack
                </ConsoleButton>
                <ConsoleButton
                  onClick={() => run(() => executeCombatTurn('DEFEND'))}
                  disabled={isPending}
                  pending={isPending}
                  icon={<Shield className="h-3.5 w-3.5" />}
                  label="Defend"
                >
                  Defend
                </ConsoleButton>
                <ConsoleButton
                  onClick={() => run(() => executeCombatTurn('FLEE'))}
                  disabled={isPending}
                  pending={isPending}
                  icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
                  label="Flee"
                >
                  Flee
                </ConsoleButton>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <ConsoleButton
                  onClick={() => run(explore)}
                  disabled={isPending}
                  pending={isPending}
                  icon={<Route className="h-3.5 w-3.5" />}
                  tone="accent"
                  label="Drive forward"
                >
                  Drive Forward (-{fuelCost} Fuel)
                </ConsoleButton>
                <ConsoleButton
                  onClick={() => run(scavenge)}
                  disabled={isPending}
                  pending={isPending}
                  icon={<Search className="h-3.5 w-3.5" />}
                  label="Scavenge area"
                >
                  Scavenge Area (-5 Energy)
                </ConsoleButton>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((text) => (
                  <button
                    key={text}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSubmit(text)}
                    className="px-2 py-1 text-[10px] uppercase tracking-[0.12em] border rule transition-colors disabled:opacity-40"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </>
          )}

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(customAction);
            }}
          >
            <input
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              disabled={isPending || !!activeEncounter}
              placeholder={
                activeEncounter
                  ? 'Focus on the fight.'
                  : 'Type an action — rest, eat, drink, refuel, repair, radio Wren...'
              }
              aria-label="Custom action"
              className="flex-1 min-w-0 h-8 px-2.5 text-[11px] border rule bg-transparent outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--line-strong)] disabled:opacity-40"
              style={{ color: 'var(--text)', borderRadius: 'var(--radius)' }}
            />
            <button
              type="submit"
              disabled={isPending || !!activeEncounter}
              aria-label="Submit action"
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center border rule transition-colors disabled:opacity-40"
              style={{
                color: 'var(--accent)',
                background: 'var(--accent-soft)',
                borderRadius: 'var(--radius)',
              }}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ConsoleButton({
  children,
  onClick,
  disabled,
  pending,
  icon,
  tone,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  icon?: React.ReactNode;
  tone?: 'accent' | 'danger';
  label: string;
}) {
  const color =
    tone === 'accent'
      ? 'var(--accent)'
      : tone === 'danger'
        ? 'var(--stat-health)'
        : 'var(--text-muted)';
  const background =
    tone === 'accent'
      ? 'var(--accent-soft)'
      : tone === 'danger'
        ? 'rgba(239, 74, 74, 0.08)'
        : 'transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-9 px-3 inline-flex items-center justify-center gap-2 border rule text-[11px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
      style={{ color, background, borderRadius: 'var(--radius)' }}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
