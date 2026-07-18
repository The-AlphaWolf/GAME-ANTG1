'use client';

import { useState } from 'react';
import { ActionFeed } from './action-feed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export function NarrativeConsole() {
  const [customAction, setCustomAction] = useState('');

  const choices = [
    { id: 1, text: 'Search the glovebox' },
    { id: 2, text: 'Try to start the engine again' },
    { id: 3, text: 'Look out the window' },
    { id: 4, text: 'Equip [Rusty Wrench]' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Event Log feed (Takes up most of the space) */}
      <ActionFeed />

      {/* Input Area (Sticky at bottom) */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur shrink-0 z-10">
        {/* Quick Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {choices.map((choice) => (
            <Button
              key={choice.id}
              variant="outline"
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
            setCustomAction('');
          }}
        >
          <Input
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            placeholder="Type your action..."
            className="bg-zinc-900 border-zinc-800 font-mono text-sm placeholder:text-zinc-600 focus-visible:ring-zinc-700"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send Action</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
