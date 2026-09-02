import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

type TransactionClient = Prisma.TransactionClient;

export async function evaluateMilestonesForUser(
    tx: TransactionClient,
    userId: string,
    completedAt: Date,
) {
    const milestones = await tx.milestone.findMany({
        where: {
            status: 'PUBLISHED',
            eligibilityStartsAt: {
                lte: completedAt,
            },
        },
        include: {
            badge: true,
            questions: true,
        },
    });
    
    const newlyEarned = [];

    for (const milestone of milestones) {
        if (!milestone.questions.length){
            continue;
        }

        const mastery = await tx.userQuestionMastery.findMany({
            where: {
                userId,
                questionId: {
                    in: milestone.questions.map((question) => question.questionId),
                },
                bestCorrect: true,
            },
            select:{
                questionId: true,
            },
        });

        const masteredQuestionIds = new Set(
            mastery.map((record) => record.questionId),
        );

        const isEligible = milestone.questions.every((question) => 
            masteredQuestionIds.has(question.questionId),
        );

        if (!isEligible) {
            continue;
        }

        const existingAward = await tx.userBadge.findUnique({
            where: {
                userId_milestoneId: {
                    userId,
                    milestoneId: milestone.id,
                }
            }
        });

        if (existingAward){
            continue;
        }

        const award = await tx.userBadge.create({
            data:{
                userId,
                badgeId: milestone.badgeId,
                milestoneId: milestone.id,
                earnedAt: completedAt,
            },
            include: {
                badge: true,
                milestone: true,
            },
        });
        newlyEarned.push({
            badgeId: award.badgeId,
            milestoneId: award.milestoneId,
            key: award.milestone.key,
            version: award.milestone.version,
            displayName: award.badge.displayName,
            earnedAt: award.earnedAt,
        });
    }
    return newlyEarned;
}

export async function getMilestoneProgress(userId: string) {
    const milestones = await prisma.milestone.findMany({
        where: {
            status: {
                in: ['PUBLISHED', 'RETIRED'],
            },
        },
        include: {
            badge: true,
            questions: {
                select: {
                    questionId: true,
                },
            },
            userBadges: {
                where: {
                    userId
                },
                select: {
                    earnedAt: true
                },
            },
        },
        orderBy: [
            { key: 'asc' },
            { version: 'asc' },
        ]
    });

    const questionIds = milestones.flatMap((milestone) => 
    milestone.questions.map((question) => question.questionId),
    );

    const mastery = await prisma.userQuestionMastery.findMany({
        where: {
            userId,
            questionId: {
                in: questionIds,
            },
            bestCorrect: true,
        },
        select: {
            questionId: true,
            firstCorrectAt: true
        },
    });

    const masterByQuestionId = new Map(
        mastery.map((record) => [record.questionId, record]),
    );

    return milestones.map((milestone) => {
        const correct = milestone.questions.filter((question) => {
            const record = masterByQuestionId.get(question.questionId);
            
            return Boolean(record?.firstCorrectAt);
        }).length;

        const required = milestone.questions.length;
        const earnedAt = milestone.userBadges[0]?.earnedAt ?? null;

        return {
        milestoneId: milestone.id,
        key: milestone.key,
        version: milestone.version,
        status: earnedAt
            ? 'earned'
            : milestone.status === 'RETIRED'
            ? 'retired'
            : correct === required
                ? 'eligible'
                : correct > 0
                ? 'in_progress'
                : 'locked',
        required,
        correct,
        percentage: required > 0 ? Math.round((correct / required) * 100) : 0,
        earnedAt,
        badge: {
            id: milestone.badge.id,
            displayName: milestone.badge.displayName,
            description: milestone.badge.description,
            category: milestone.badge.category,
            iconUrl: milestone.badge.iconUrl,
        },
        };
    })
}