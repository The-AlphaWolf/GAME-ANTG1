'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function repairComponent(componentId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { vehicle: { include: { components: true } } },
  });

  if (!player || !player.vehicle) return { error: 'Vehicle not found' };

  const component = player.vehicle.components.find((c) => c.id === componentId);
  if (!component) return { error: 'Component not found' };

  const newDurability = Math.min(
    component.maxDurability,
    component.durability + amount
  );
  const repairedAmount = newDurability - component.durability;

  if (repairedAmount <= 0) {
    return { error: 'Component is already at maximum durability' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehicleComponent.update({
        where: { id: componentId },
        data: { durability: newDurability },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text: `You repaired the ${component.name} by ${repairedAmount.toFixed(0)} durability.`,
          },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Repair component failed:', error);
    return { error: 'Failed to repair component' };
  }
}

export async function refuel(amount: number) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { vehicle: true },
  });

  if (!player || !player.vehicle) return { error: 'Vehicle not found' };

  const newFuel = Math.min(100, player.vehicle.fuel + amount);
  const refueledAmount = newFuel - player.vehicle.fuel;

  if (refueledAmount <= 0) {
    return { error: 'Fuel tank is already full' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: player.vehicle!.id },
        data: { fuel: newFuel },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text: `You added ${refueledAmount} units of fuel to the tank.`,
          },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Refuel failed:', error);
    return { error: 'Failed to refuel vehicle' };
  }
}
