'use client';

import { useState, useTransition } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { restartGame } from '@/actions/game';

export function NewGameButton({
  variant = 'topbar',
}: {
  variant?: 'topbar' | 'death';
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRestart = () => {
    startTransition(async () => {
      await restartGame();
      setConfirming(false);
    });
  };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="text-[10px] hidden sm:inline"
          style={{ color: 'var(--stat-health)' }}
        >
          Wipe all progress?
        </span>
        <Chip tone="danger" disabled={isPending} onClick={handleRestart}>
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          Confirm
        </Chip>
        <Chip disabled={isPending} onClick={() => setConfirming(false)}>
          Cancel
        </Chip>
      </span>
    );
  }

  return (
    <Chip
      onClick={() => setConfirming(true)}
      tone={variant === 'death' ? 'default' : 'default'}
    >
      <RotateCcw className="h-3 w-3" />
      New Game
    </Chip>
  );
}

function Chip({
  children,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-7 px-2.5 inline-flex items-center gap-1.5 border rule text-[10px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
      style={{
        color: tone === 'danger' ? 'var(--stat-health)' : 'var(--text-muted)',
        background: tone === 'danger' ? 'rgba(239,74,74,0.08)' : 'transparent',
        borderRadius: 'var(--radius)',
      }}
    >
      {children}
    </button>
  );
}
