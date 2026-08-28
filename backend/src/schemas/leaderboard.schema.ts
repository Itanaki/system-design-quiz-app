import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const difficultyLevelSchema = z.enum(['easy', 'medium', 'hard']);

export const myRankQuerySchema = z.object({
    scope: z.enum(['global', 'easy', 'medium', 'hard']).default('global'),
});