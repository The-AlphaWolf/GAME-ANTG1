'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
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
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400 hidden sm:inline">
          Wipe all progress?
        </span>
        <Button
          size="sm"
          disabled={isPending}
          onClick={handleRestart}
          className="h-7 text-xs bg-red-900 hover:bg-red-800 text-red-100 border border-red-700"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <RotateCcw className="h-3 w-3 mr-1" />
          )}
          Yes, Restart
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          Cancel
        </Button>
      </div>
    );
  }

  if (variant === 'death') {
    return (
      <Button
        variant="outline"
        onClick={() => setConfirming(true)}
        className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Start New Game
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setConfirming(true)}
      className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
    >
      <RotateCcw className="h-3 w-3 mr-1" />
      New Game
    </Button>
  );
}
