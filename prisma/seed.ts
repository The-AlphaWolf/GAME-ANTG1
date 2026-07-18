import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';
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

  const player = await prisma.player.upsert({
    where: { username: 'AlphaWolf' },
    update: {},
    create: {
      userId: user.id,
      username: 'AlphaWolf',
      level: 1,
      xp: 0,
      sanity: 100,
      fatigue: 0,
      thirst: 0,
      vehicle: {
        create: {
          type: 'Common Van',
          level: 1,
          armor: 10,
          fuel: 100,
        },
      },
    },
  });

  logger.info({ player }, 'Seeded player');

  await prisma.eventLog.create({
    data: {
      playerId: player.id,
      eventType: 'PLAYER_CREATED',
      payload: { username: player.username },
    },
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
