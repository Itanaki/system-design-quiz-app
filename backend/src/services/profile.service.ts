import type { User } from '@supabase/supabase-js';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';

const MAX_SHOWCASED_BADGES = 3;

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

export async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: {
      userId,
    },
    orderBy: {
      earnedAt: 'desc',
    },
    include: {
      badge: true,
      milestone: {
        select: {
          id: true,
          key: true,
          version: true,
          status: true,
        },
      },
    },
  });
}

export async function getPublicShowcase(userId: string) {
  const profile = await prisma.userProfile.findFirst({
    where: {
      id: userId,
      status: 'active',
      leaderboardOptOut: false,
    },
    select: {
      displayName: true,
      userBadges: {
        where: {
          showcased: true,
        },
        orderBy: {
          earnedAt: 'desc',
        },
        select: {
          milestoneId: true,
          earnedAt: true,
          badge: true,
          milestone: {
            select: {
              key: true,
              version: true,
            },
          },
        },
      },
    },
  });

  return profile;
}


export async function updateShowcasedBadges(
  userId: string,
  milestoneIds: string[],
) {
  const uniqueMilestoneIds = [...new Set(milestoneIds)];

  if (uniqueMilestoneIds.length > MAX_SHOWCASED_BADGES) {
    throw new ApiError(
      400,
      `You can showcase up to ${MAX_SHOWCASED_BADGES} badges`,
    );
  }

  const ownedBadges = await prisma.userBadge.findMany({
    where: {
      userId,
      milestoneId: {
        in: uniqueMilestoneIds,
      },
    },
    select: {
      milestoneId: true,
    },
  });

  if (ownedBadges.length !== uniqueMilestoneIds.length) {
    throw new ApiError(
      400,
      'Only badges you have earned can be showcased',
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.userBadge.updateMany({
      where: {
        userId,
      },
      data: {
        showcased: false,
      },
    });

    if (uniqueMilestoneIds.length > 0) {
      await tx.userBadge.updateMany({
        where: {
          userId,
          milestoneId: {
            in: uniqueMilestoneIds,
          },
        },
        data: {
          showcased: true,
        },
      });
    }

    return tx.userBadge.findMany({
      where: {
        userId,
      },
      include: {
        badge: true,
        milestone: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });
  });
}