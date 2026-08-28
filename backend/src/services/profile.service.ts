import type { User } from '@supabase/supabase-js';
import prisma from '../lib/prisma.js';

function deriveDisplayName(user: User): string {
  const metadataName = user.user_metadata?.display_name;
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }
  return user.email?.split('@')[0] ?? 'Player';
}

// creates a leaderboard profile on first sign-in; no settings UI exists yet to change it later
export async function ensureUserProfile(user: User) {
  const existing = await prisma.userProfile.findUnique({ where: { id: user.id } });

  if (existing) {
    return existing;
  }

  return prisma.userProfile.create({
    data: {
      id: user.id,
      displayName: deriveDisplayName(user),
    },
  });
}