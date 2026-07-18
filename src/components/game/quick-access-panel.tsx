import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, Shield, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

import { Player } from '@prisma/client';

export function QuickAccessPanel({ player }: { player: Player }) {
  return (
    <div className="p-4 flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar">
      {/* Inventory Mini */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider flex items-center gap-2">
          <Package className="h-4 w-4" /> EQUIPPED
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-md border border-zinc-800">
            <span className="text-sm font-medium text-zinc-300">
              Rusty Wrench
            </span>
            <Badge
              variant="outline"
              className="text-zinc-500 border-zinc-700 text-[10px]"
            >
              WPN
            </Badge>
          </div>
          <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-md border border-zinc-800">
            <span className="text-sm font-medium text-zinc-300">
              Tattered Jacket
            </span>
            <Badge
              variant="outline"
              className="text-zinc-500 border-zinc-700 text-[10px]"
            >
              ARM
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Vehicle Status */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider flex items-center gap-2">
          <Settings className="h-4 w-4" /> VEHICLE: COMMON VAN
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-400">
                <Shield className="h-4 w-4" /> Chassis Armor (Lv {player.level})
              </span>
              <span className="font-medium text-zinc-300">10/10</span>
            </div>
            <Progress
              value={100}
              className="h-2 bg-zinc-800 [&>div]:bg-zinc-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-emerald-400">
                Fuel
              </span>
              <span className="font-medium text-zinc-300">45%</span>
            </div>
            <Progress
              value={45}
              className="h-2 bg-zinc-800 [&>div]:bg-emerald-500"
            />
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* World Chat Mini */}
      <div className="flex-1 flex flex-col min-h-[150px]">
        <h3 className="text-xs font-bold text-zinc-500 tracking-wider mb-2">
          WORLD RADIO
        </h3>
        <div className="flex-1 bg-zinc-900/50 rounded-md border border-zinc-800 p-2 overflow-y-auto text-xs space-y-2 custom-scrollbar">
          <p>
            <span className="text-blue-400 font-bold">[Scav_99]:</span> Anyone
            near Sector 4?
          </p>
          <p>
            <span className="text-zinc-500 font-bold">[System]:</span> Radio
            silence. Static crackles.
          </p>
          <p>
            <span className="text-purple-400 font-bold">[Wolf]:</span> Stay away
            from the bridge.
          </p>
        </div>
      </div>
    </div>
  );
}
