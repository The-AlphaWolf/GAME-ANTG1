'use client';

import { useState, useTransition } from 'react';
import { ActionFeed } from './action-feed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { submitAction } from '@/actions/game';
import { EventLog } from '@prisma/client';

export function NarrativeConsole({ events }: { events: EventLog[] }) {
  const [customAction, setCustomAction] = useState('');
  const [isPending, startTransition] = useTransition();

  const choices = [
    { id: 1, text: 'Search the glovebox' },
    { id: 2, text: 'Try to start the engine again' },
    { id: 3, text: 'Look out the window' },
    { id: 4, text: 'Equip [Rusty Wrench]' },
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

  return (
    <div className="flex flex-col h-full">
      {/* Event Log feed (Takes up most of the space) */}
      <ActionFeed events={events} />

      {/* Input Area (Sticky at bottom) */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur shrink-0 z-10">
        {/* Quick Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {choices.map((choice) => (
            <Button
              key={choice.id}
              variant="outline"
              disabled={isPending}
              onClick={() => handleSubmit(choice.text)}
              className="justify-start bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <span className="mr-2 text-zinc-500">{choice.id}.</span>{' '}
              {choice.text}
            </Button>
          ))}
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
            disabled={isPending}
            placeholder="Type your action..."
            className="bg-zinc-900 border-zinc-800 font-mono text-sm placeholder:text-zinc-600 focus-visible:ring-zinc-700"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending}
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
    </div>
  );
}
