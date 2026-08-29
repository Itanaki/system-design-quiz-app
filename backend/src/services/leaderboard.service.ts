import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export type LeaderboardScope = 'global' | 'easy' | 'medium' | 'hard';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

const WEIGHTS: Record<DifficultyLevel, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
};

type LeaderboardRow = {
    userId: string;
    displayName: string;
    weightedPoints: number;
    easyCorrect: number;
    mediumCorrect: number;
    hardCorrect: number;
    uniqueCorrect: number;
    scoreReachedAt: Date | null;
    masteryPercentage: number;
    rank: number;
};

function toLevel(scope: LeaderboardScope): DifficultyLevel | undefined {
    return scope === 'global' ? undefined : scope;
}

async function getAvailablePoints(level?: DifficultyLevel) {
    if (level) {
        const count = await prisma.question.count({
            where: {
                difficulty: level,
            }
        });
        return count * WEIGHTS[level];
    }

    const grouped = await prisma.question.groupBy({
        by: ['difficulty'],
        _count: { _all: true},
    });

    return grouped.reduce((sum, row ) => {
        const weight = WEIGHTS[row.difficulty as DifficultyLevel] ?? 0;
        return sum + weight * row._count._all;
    }, 0);
}

async function countRankedUsers(level?: DifficultyLevel) {
    const difficultyFilter = level
        ? Prisma.sql`AND q."difficulty" = ${level}`
        : Prisma.empty;

    const result = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT p."id")::int AS count
        FROM "UserProfile" p
        JOIN "UserQuestionMastery" m ON m."userId" = p."id" AND m."bestCorrect" = true
        JOIN "Question" q ON q."id" = m."questionId" ${difficultyFilter}
        WHERE p."status" = 'active' AND p."leaderboardOptOut" = false
    `;

    return result[0]?.count ?? 0;
}

// tie-break order: mastery% desc, weighted points desc, hard/medium correct desc, earliest score reached, stable id fallback
async function queryRanked(
    level: DifficultyLevel | undefined,
    availablePoints: number,
    pagination?: { limit: number; offset: number },
) {
    const difficultyFilter = level
        ? Prisma.sql`AND q."difficulty" = ${level}`
        : Prisma.empty;

    // hard/medium tie-breakers are meaningless within a single-difficulty scope, so they're dropped there
    const tieBreak = level
        ? Prisma.sql`"masteryPercentage" DESC, "weightedPoints" DESC, "scoreReachedAt" ASC, "userId" ASC`
        : Prisma.sql`"masteryPercentage" DESC, "weightedPoints" DESC, "hardCorrect" DESC, "mediumCorrect" DESC, "scoreReachedAt" ASC, "userId" ASC`;

    const paginationSql = pagination
        ? Prisma.sql`LIMIT ${pagination.limit} OFFSET ${pagination.offset}`
        : Prisma.empty;

    return prisma.$queryRaw<LeaderboardRow[]>`
        WITH scored AS (
            SELECT
                p."id" AS "userId",
                p."displayName" AS "displayName",
                COALESCE(SUM(
                    CASE q."difficulty"
                        WHEN 'easy' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'hard' THEN 3
                        ELSE 0
                    END
                ), 0)::int AS "weightedPoints",
                COUNT(*) FILTER (WHERE q."difficulty" = 'easy')::int AS "easyCorrect",
                COUNT(*) FILTER (WHERE q."difficulty" = 'medium')::int AS "mediumCorrect",
                COUNT(*) FILTER (WHERE q."difficulty" = 'hard')::int AS "hardCorrect",
                COUNT(*)::int AS "uniqueCorrect",
                MAX(m."firstCorrectAt") AS "scoreReachedAt"
            FROM "UserProfile" p
            JOIN "UserQuestionMastery" m ON m."userId" = p."id" AND m."bestCorrect" = true
            JOIN "Question" q ON q."id" = m."questionId" ${difficultyFilter}
            WHERE p."status" = 'active' AND p."leaderboardOptOut" = false
            GROUP BY p."id", p."displayName"
        ),
        -- masteryPercentage must be materialized in its own CTE: a window function's
        -- ORDER BY can't reference an alias defined in the same SELECT list
        withPercentage AS (
            SELECT
                *,
                ROUND((100.0 * "weightedPoints") / NULLIF(${availablePoints}::numeric, 0), 2)::float8 AS "masteryPercentage"
            FROM scored
        )
        SELECT
            *,
            (ROW_NUMBER() OVER (ORDER BY ${tieBreak}))::int AS "rank"
        FROM withPercentage
        ORDER BY ${tieBreak}
        ${paginationSql}
    `;
}

function serializeEntry(row: LeaderboardRow) {
    return {
        rank: row.rank,
        userId: row.userId,
        displayName: row.displayName,
        masteryPercentage: row.masteryPercentage,
        weightedPointsEarned: row.weightedPoints,
        uniqueCorrect: row.uniqueCorrect,
        easyCorrect: row.easyCorrect,
        mediumCorrect: row.mediumCorrect,
        hardCorrect: row.hardCorrect,
        scoreReachedAt: row.scoreReachedAt,
    };
}

export async function getLeaderboard(
    scope: LeaderboardScope,
    page: number,
    pageSize: number,
) {
    const level = toLevel(scope);
    const availablePoints = await getAvailablePoints(level);
    const offset = (page - 1) * pageSize;

    const [rows, totalEntries] = await Promise.all([
        queryRanked(level, availablePoints, { limit: pageSize, offset }),
        countRankedUsers(level),
    ]);

    return {
        scope: { type: scope },
        entries: rows.map(serializeEntry),
        weightedPointsAvailable: availablePoints,
        pagination: {
            page,
            pageSize,
            totalEntries,
            totalPages: Math.max(1, Math.ceil(totalEntries / pageSize)),
        },
    };
}

export async function getMyRank(userId: string, scope: LeaderboardScope) {
    const level = toLevel(scope);
    const availablePoints = await getAvailablePoints(level);
    const ranked = await queryRanked(level, availablePoints);
    const row = ranked.find((entry) => entry.userId === userId);

    if (!row) {
        return {
            rank: null,
            masteryPercentage: 0,
            weightedPointsEarned: 0,
            weightedPointsAvailable: availablePoints,
            uniqueCorrect: 0,
        };
    }

    return {
        rank: row.rank,
        masteryPercentage: row.masteryPercentage,
        weightedPointsEarned: row.weightedPoints,
        weightedPointsAvailable: availablePoints,
        uniqueCorrect: row.uniqueCorrect,
    };
}