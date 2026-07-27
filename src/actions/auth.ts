'use server';

import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { grantStarterChest } from '@/lib/game/starter-chest';
import { createStarterVehicle } from '@/lib/game/vehicle';
import { seedOpeningChatter } from '@/actions/npc';
import { CHAPTERS } from '@/lib/game/story';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false, // We'll handle redirect client-side if needed, but NextAuth can handle it.
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials.' };
        default:
          return { error: 'Something went wrong.' };
      }
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!username || !email || !password) {
    return { error: 'Missing fields' };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: 'Email already exists' };
  }

  const existingPlayer = await prisma.player.findUnique({
    where: { username },
  });

  if (existingPlayer) {
    return { error: 'Username already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Use a transaction to ensure both User, Player, and EventLog are created atomically
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: username,
          email,
          password: hashedPassword,
        },
      });

      const player = await tx.player.create({
        data: { userId: user.id, username },
      });

      // A bare Vehicle row used to be created here with no components at all,
      // so only the seeded account ever had a vehicle worth opening.
      await createStarterVehicle(tx, player.id);

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'PLAYER_CREATED',
          payload: { username, email },
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'STORY_BEAT',
          payload: {
            text: `CHAPTER 1 — ${CHAPTERS[0].title.toUpperCase()}. ${CHAPTERS[0].opening}`,
          },
        },
      });

      // Every survivor starts with a beginner treasure chest of random quality
      await grantStarterChest(tx, player.id);
    });

    // World radio greets the new arrival by name.
    await seedOpeningChatter(username);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { error: 'Failed to create user' };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
