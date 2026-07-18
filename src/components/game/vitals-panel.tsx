import { Progress } from '@/components/ui/progress';
import { Heart, Zap, Coffee, Droplets, Brain, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { Player } from '@prisma/client';

export function VitalsPanel({ player }: { player: Player }) {
  return (
    <div className="p-4 flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-100 mb-1">
          {player.username}
        </h2>
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Level {player.level} Survivor</span>
          <span>XP: {player.xp}/2000</span>
        </div>
        <Progress
          value={Math.min(100, (player.xp / 2000) * 100)}
          className="h-1.5 bg-zinc-800 [&>div]:bg-zinc-400"
        />
      </div>

      <Separator className="bg-zinc-800" />

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-red-400">
              <Heart className="h-4 w-4" /> Health
            </span>
            <span className="font-medium">{player.health}%</span>
          </div>
          <Progress
            value={player.health}
            className="h-2 bg-zinc-800 [&>div]:bg-red-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-yellow-400">
              <Zap className="h-4 w-4" /> Energy
            </span>
            <span className="font-medium">{player.energy}%</span>
          </div>
          <Progress
            value={player.energy}
            className="h-2 bg-zinc-800 [&>div]:bg-yellow-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-orange-400">
              <Coffee className="h-4 w-4" /> Hunger
            </span>
            <span className="font-medium">{player.hunger}%</span>
          </div>
          <Progress
            value={player.hunger}
            className="h-2 bg-zinc-800 [&>div]:bg-orange-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-blue-400">
              <Droplets className="h-4 w-4" /> Thirst
            </span>
            <span className="font-medium">{player.thirst}%</span>
          </div>
          <Progress
            value={player.thirst}
            className="h-2 bg-zinc-800 [&>div]:bg-blue-500"
          />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-purple-400">
              <Brain className="h-4 w-4" /> Sanity
            </span>
            <span className="font-medium">95%</span>
          </div>
          <Progress
            value={95}
            className="h-2 bg-zinc-800 [&>div]:bg-purple-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-indigo-400">
              <Activity className="h-4 w-4" /> Fatigue
            </span>
            <span className="font-medium">15%</span>
          </div>
          <Progress
            value={15}
            className="h-2 bg-zinc-800 [&>div]:bg-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
