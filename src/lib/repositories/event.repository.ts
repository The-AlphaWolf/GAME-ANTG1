import { prisma } from '../db';

import { Prisma } from '@prisma/client';

export type EventPayload = Prisma.InputJsonObject;

export class EventRepository {
  /**
   * Appends a new event to the EventLog.
   * This is the Single Source of Truth for the Event-Sourced architecture.
   */
  static async appendEvent(
    playerId: string,
    eventType: string,
    payload: EventPayload
  ) {
    return prisma.eventLog.create({
      data: {
        playerId,
        eventType,
        payload,
      },
    });
  }

  /**
   * Replays events for a specific player (Useful for read-projection rebuilds).
   */
  static async getEventsForPlayer(playerId: string) {
    return prisma.eventLog.findMany({
      where: { playerId },
      orderBy: { timestamp: 'asc' },
    });
  }
}
