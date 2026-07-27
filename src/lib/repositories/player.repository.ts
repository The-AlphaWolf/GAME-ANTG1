import { Prisma } from '@prisma/client';
import { prisma } from '../db';

export class PlayerRepository {
  /**
   * Fetch a player's read-projection state.
   * In a real architecture, this would often be cached in Redis.
   */
  static async getPlayer(playerId: string) {
    return prisma.player.findUnique({
      where: { id: playerId },
      include: { vehicle: true },
    });
  }

  static async getPlayerByUsername(username: string) {
    return prisma.player.findUnique({
      where: { username },
      include: { vehicle: true },
    });
  }

  /**
   * Updates the read projection for a player.
   */
  static async updatePlayerState(
    playerId: string,
    data: Prisma.PlayerUpdateInput
  ) {
    return prisma.player.update({
      where: { id: playerId },
      data,
    });
  }
}
