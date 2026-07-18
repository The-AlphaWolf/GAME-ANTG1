'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventLog } from '@prisma/client';

export function ActionFeed({ events }: { events: EventLog[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adding a short timeout ensures the DOM has updated with the new elements before scrolling
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, [events]);

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden p-4 pb-0">
      <div className="space-y-4 max-w-3xl mx-auto">
        {events.map((e) => {
          // Parse JSONB payload safely
          const payload = (e.payload as Record<string, unknown>) || {};
          let text = payload.text as string | undefined;

          // If there is no narrative text, but there is an action, show the action
          if (!text && payload.action) {
            text = `> ${payload.action}`;
          }

          // Hide internal events without text to display
          if (!text) return null;

          const time = new Date(e.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={e.id} className="flex gap-4 group">
              <span className="text-zinc-600 text-xs mt-1 shrink-0 group-hover:text-zinc-500 transition-colors">
                [{time}]
              </span>
              <p
                className={`text-base leading-relaxed ${
                  e.eventType === 'PLAYER_ACTION'
                    ? 'text-emerald-400'
                    : e.eventType === 'SYSTEM_NARRATIVE'
                      ? 'text-blue-400 font-bold'
                      : 'text-zinc-300'
                }`}
              >
                {text}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}
