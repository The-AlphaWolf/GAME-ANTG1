import { Cloud, MapPin, Skull } from 'lucide-react';
import { Player } from '@prisma/client';

export function TopBar({ player }: { player?: Player }) {
  return (
    <div className="flex items-center gap-6 w-full text-sm">
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 font-bold">DAY 12</span>
        <span className="text-zinc-500">14:30</span>
      </div>

      <div className="flex items-center gap-2 text-blue-400">
        <Cloud className="h-4 w-4" />
        <span>Overcast (12°C)</span>
      </div>

      <div className="flex items-center gap-2 text-emerald-500 ml-auto md:ml-0">
        <MapPin className="h-4 w-4" />
        <span className="truncate max-w-[150px] md:max-w-none">
          Highway 17, Mile {player?.distanceTraveled ?? 0}
        </span>
      </div>

      <div className="hidden md:flex items-center gap-2 ml-auto">
        <span className="text-zinc-500">THREAT</span>
        <div className="flex gap-1 text-red-500">
          <Skull className="h-4 w-4" />
          <Skull className="h-4 w-4" />
          <Skull className="h-4 w-4 opacity-30" />
        </div>
      </div>
    </div>
  );
}
