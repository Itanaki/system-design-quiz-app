import { z } from 'zod';

export const attempAnswerSchema = z.object({
    questionId: z.string().uuid(),
    selected: z.string(),
});

export const attemptSchema = z.object({
    answers: z
    .array(attempAnswerSchema)
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
    })
});