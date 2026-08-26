import prisma from '../lib/prisma.js';

export async function abandonAttempt(attemptId: string) {
    const attempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { status: 'abandoned' }
    });
    return attempt;
}