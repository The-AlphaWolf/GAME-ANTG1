import { describe, it, expect, vi } from 'vitest';
import { EventRepository } from '../../src/lib/repositories/event.repository';
import { prisma } from '../../src/lib/db';

vi.mock('../../src/lib/db', () => ({
  prisma: {
    eventLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('EventRepository', () => {
  it('should append an event correctly', async () => {
    const mockEvent = {
      id: 'event-1',
      playerId: 'player-1',
      eventType: 'TEST_EVENT',
      payload: { test: true },
      timestamp: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.eventLog.create as any).mockResolvedValue(mockEvent);

    const result = await EventRepository.appendEvent('player-1', 'TEST_EVENT', {
      test: true,
    });

    expect(prisma.eventLog.create).toHaveBeenCalledWith({
      data: {
        playerId: 'player-1',
        eventType: 'TEST_EVENT',
        payload: { test: true },
      },
    });
    expect(result).toEqual(mockEvent);
  });
});
