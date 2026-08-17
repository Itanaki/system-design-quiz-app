import { z } from 'zod';

const difficultySchema = z.enum(['easy', 'medium', 'hard']);

const optionsSchema = z
    .array(z.string().trim().min(1, 'Option cannot be empty'))
    .min(2, 'At least two options are required')
    .refine((options) => new Set(options).size === options.length,
        'Options must be unique'
    );


const topicsSchema = z
    .array(z.string().trim().min(1, 'Topic cannot be empty'))
    .min(1, 'At least one topic is required')
    .refine((topics) => new Set(topics).size === topics.length,
        'Topics must be unique'
    );

export const createQuestionSchema = z
    .object({
        prompt: z
            .string()
            .trim()
            .min(1, 'Prompt cannot be empty')
            .max(100, 'Prompt cannot exceed 100 characters'),

        options: optionsSchema,

        correctAnswer: z
            .string()
            .trim()
            .min(1, 'Correct answer cannot be empty'),
        
        explanation: z
            .string()
            .trim()
            .max(500, 'Explanation cannot exceed 500 characters')
            .optional(),

        difficulty: difficultySchema,

        topics: topicsSchema,
    })
    .superRefine((question, context) => {
        if (!question.options.includes(question.correctAnswer)) {
            context.addIssue({
                code: 'custom',
                path: ['correctAnswer'],
                message: 'Correct answer must be one of the options',
            });
        }
    });

export const updateQuestionSchema = createQuestionSchema;