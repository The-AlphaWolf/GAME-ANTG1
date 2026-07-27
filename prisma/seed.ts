import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';
import { createStarterVehicle } from '../src/lib/game/vehicle';
import { grantStarterChest } from '../src/lib/game/starter-chest';
import { CHAPTERS } from '../src/lib/game/story';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seed...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'alphawolf@example.com' },
    update: {},
    create: {
      name: 'AlphaWolf',
      email: 'alphawolf@example.com',
      password: hashedPassword,
    },
  });

  const existing = await prisma.player.findUnique({
    where: { username: 'AlphaWolf' },
  });

  if (existing) {
    logger.info('Seed player already exists, skipping.');
    return;
  }

  // Mirrors registerAction so a seeded player starts in exactly the same state
  // a real one does: full vehicle, starter chest, opening story beat.
  await prisma.$transaction(async (tx) => {
    const player = await tx.player.create({
      data: { userId: user.id, username: 'AlphaWolf' },
    });

    await createStarterVehicle(tx, player.id);

    await tx.eventLog.create({
      data: {
        playerId: player.id,
        eventType: 'STORY_BEAT',
        payload: {
          text: `CHAPTER 1 — ${CHAPTERS[0].title.toUpperCase()}. ${CHAPTERS[0].opening}`,
        },
      },
    });

    await grantStarterChest(tx, player.id);

    logger.info({ playerId: player.id }, 'Seeded player');
  });

  logger.info('Seeding finished.');
}

main()
  .catch((e) => {
    logger.error(e, 'Seed error');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
