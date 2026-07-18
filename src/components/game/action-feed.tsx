import { ScrollArea } from '@/components/ui/scroll-area';

export function ActionFeed() {
  const events = [
    {
      id: 1,
      text: 'You wake up in the back of the van. The engine is dead.',
      time: '14:20',
      type: 'system',
    },
    {
      id: 2,
      text: 'You search the glovebox... Found [Stale Protein Bar].',
      time: '14:22',
      type: 'action',
    },
    {
      id: 3,
      text: 'Something scrapes against the outside of the door.',
      time: '14:25',
      type: 'danger',
    },
    {
      id: 4,
      text: 'You hold your breath. The scraping stops.',
      time: '14:28',
      type: 'narrative',
    },
  ];

  return (
    <ScrollArea className="flex-1 p-4 pb-0">
      <div className="space-y-4 max-w-3xl mx-auto">
        {events.map((e) => (
          <div key={e.id} className="flex gap-4 group">
            <span className="text-zinc-600 text-xs mt-1 shrink-0 group-hover:text-zinc-500 transition-colors">
              [{e.time}]
            </span>
            <p
              className={`text-base leading-relaxed ${
                e.type === 'danger'
                  ? 'text-red-400'
                  : e.type === 'action'
                    ? 'text-emerald-400'
                    : e.type === 'system'
                      ? 'text-blue-400 font-bold'
                      : 'text-zinc-300'
              }`}
            >
              {e.text}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
