import { z } from 'zod';

export const attemptAnswerSchema = z.object({
    questionId: z.string().min(1),
    selected: z.string().min(1),
});

export const attemptSchema = z.object({
    answers: z
        .array(attemptAnswerSchema)
        .min(1)
        .superRefine((answers, context) => {
            const questionIds = answers.map((answers) => answers.questionId);
            const uniqueQuestionIds = new Set(questionIds);

            if (uniqueQuestionIds.size !== questionIds.length) {
                context.addIssue({
                    code: 'custom',
                    message: 'Duplicate question IDs are not allowed.',
                    path: ['answers']
                });
            }
        }),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    topic: z.string().min(1).optional(),
});