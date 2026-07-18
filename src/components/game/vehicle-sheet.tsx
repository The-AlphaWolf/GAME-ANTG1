'use client';

import { useTransition } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Vehicle, VehicleComponent } from '@prisma/client';
import { Car, Loader2, Wrench } from 'lucide-react';
import { repairComponent } from '@/actions/vehicle';

type VehicleWithComponents = Vehicle & {
  components: VehicleComponent[];
};

export function VehicleSheet({
  vehicle,
  children,
}: {
  vehicle?: VehicleWithComponents | null;
  children?: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  if (!vehicle) return null;

  const handleRepair = (componentId: string) => {
    startTransition(async () => {
      await repairComponent(componentId, 25);
    });
  };

  return (
    <Sheet>
      <SheetTrigger>
        {children || (
          <Button
            variant="outline"
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Car className="h-4 w-4 mr-2 text-zinc-500" />
            Vehicle Status
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 flex flex-col h-full"
      >
        <SheetHeader className="p-6 border-b border-zinc-800 shrink-0">
          <SheetTitle className="text-zinc-100 flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-500" />
            {vehicle.type} (Level {vehicle.level})
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            Your mobile base. Manage core components and fuel.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Stats */}
          <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Fuel Level</span>
                <span className="text-blue-400">{vehicle.fuel}%</span>
              </div>
              <Progress
                value={vehicle.fuel}
                className="h-2 bg-zinc-800 [&>div]:bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Armor Rating</span>
                <span className="text-zinc-300">{vehicle.armor}</span>
              </div>
            </div>
          </div>

          {/* Components List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Core Components
            </h3>
            {vehicle.components.map((comp) => {
              const healthPercent =
                (comp.durability / comp.maxDurability) * 100;
              let colorClass = 'bg-green-500';
              if (healthPercent < 30) colorClass = 'bg-red-500';
              else if (healthPercent < 70) colorClass = 'bg-yellow-500';

              return (
                <div
                  key={comp.id}
                  className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        {comp.name}
                      </div>
                      <div className="text-xs text-zinc-500 text-muted-foreground">
                        {comp.type}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        isPending || comp.durability >= comp.maxDurability
                      }
                      onClick={() => handleRepair(comp.id)}
                      className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Wrench className="h-3 w-3 mr-1" />
                      )}
                      Repair
                    </Button>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1 uppercase">
                      <span>Condition</span>
                      <span>
                        {comp.durability.toFixed(0)} /{' '}
                        {comp.maxDurability.toFixed(0)}
                      </span>
                    </div>
                    <Progress
                      value={healthPercent}
                      className={`h-1.5 bg-zinc-900 [&>div]:${colorClass}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
