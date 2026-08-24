import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { createQuestionSchema } from '../schemas/quiz.schemas.js';

type QuestionInput = {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
};

type QuestionFilters = {
  page: number;
  pageSize: number;
  search?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
};

function serializeAdminQuestion(question: {
  id: string;
  prompt: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options as string[],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    difficulty: question.difficulty,
    topics: question.topics,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

export async function listQuestions(filters: QuestionFilters){
  const {
    page,
    pageSize,
    search,
    difficulty,
    topic,
  } = filters;

  const where = {
    ...(search ?
      {
        prompt: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
    : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(topic ? { topics: { has: topic } } : {}),
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.question.count({ where }),
  ]);

  return {
    items: questions.map(serializeAdminQuestion),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSections() {
  const questions = await prisma.question.findMany({
    orderBy: { difficulty: 'asc' },
  });

  const sections: Record<string, { topics: Record<string, any[]> }> = {};

  for (const q of questions) {
    const diff = q.difficulty || 'unknown';
    sections[diff] ??= { topics: {} };
    const topics = q.topics?.length ? q.topics : ['general'];
    for (const t of topics) {
      sections[diff].topics[t] ??= [];
      sections[diff].topics[t].push({
        id: q.id,
        prompt: q.prompt,
        difficulty: q.difficulty,
      });
    }
  }

  return sections;
}


export async function getSessionQuestions(
  difficulty: string,
  topic?: string,
) {
  const questions = await prisma.question.findMany({
    where: {
      difficulty,
      ...(topic ? { topics: { has: topic } } : {}),
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    difficulty: question.difficulty,
    topics: question.topics,
  }));
}

export async function getQuestionById(id: string) {
  const question = await prisma.question.findUnique({ where: { id } });

  if (!question){
    return null;
  }

  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    difficulty: question.difficulty,
    topics: question.topics,
  }
}

export async function createQuestion(data: QuestionInput) {
  const validated = createQuestionSchema.parse(data);

  try {
    const question = await prisma.question.create({
      data: validated,
    });

    return serializeAdminQuestion(question);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ApiError(400, 'A question with the same prompt already exists');
    }
    throw error;
  }
}

export async function updateQuestion(
  id: string,
  data: Partial<QuestionInput>,
) {
  const existing = await prisma.question.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, 'Question not found');
  }

  const merged = createQuestionSchema.parse({
    prompt: data.prompt ?? existing.prompt,
    options: data.options ?? (existing.options as string[]),
    correctAnswer: data.correctAnswer ?? existing.correctAnswer,
    explanation: data.explanation ?? existing.explanation ?? undefined,
    difficulty: data.difficulty ?? existing.difficulty,
    topics: data.topics ?? existing.topics,
  });

  try {
    const updated = await prisma.question.update({
      where: { id },
      data: merged,
    });
    
    return serializeAdminQuestion(updated);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ApiError(400, 'A question with the same prompt already exists');
    }
    throw error;
  }
}

export async function deleteQuestion(id: string) {
  const existing = await prisma.question.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, 'Question not found');
  }

  await prisma.question.delete({
    where: { id },
  });
}

export async function submitAttempt(payload: {
  userId?: string;
  answers: Array<{ 
    questionId: string; 
    selected: string 
  }>;
  difficulty?: string;
  topic?: string;
}) {
  const { userId, answers, difficulty, topic } = payload;
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { 
      id: { 
        in: questionIds 
      }, 
    },
  });

  if (questions.length !== questionIds.length) {
    throw new Error('One or more questions were not found');
  }

  const qMap = new Map(
    questions.map((q) => [q.id, q])
  );

  const evaluatedAnswers = answers.map((a) => {
    const question = qMap.get(a.questionId);
    if (!question) {
      throw new Error(`Question with ID ${a.questionId} not found`);
    }

    const options = Array.isArray(question.options)
      ? question.options
      : [];
    
    if (!options.includes(a.selected)) {
      throw new Error(`Selected answer "${a.selected}" is not a valid option for question ID ${a.questionId}`);
    }

    const isCorrect = question.correctAnswer === a.selected;
    return {
      questionId: a.questionId,
      selected: a.selected,
      correct: isCorrect,
    };
  });

  const score = evaluatedAnswers.filter((a)=> a.correct).length;
  const total = evaluatedAnswers.length;

  // create attempt and nested answers
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      score, 
      total,
      difficulty: difficulty ?? null,
      topic: topic ?? null,
      completedAt: new Date(),
      answers: {
        create: evaluatedAnswers, 
      },
    },
    include: { answers: true },
  });
  
  // build detailed feedback
  const details = attempt.answers.map((ans) => {
    const q = qMap.get(ans.questionId);
    return {
      questionId: ans.questionId,
      selected: ans.selected,
      correct: ans.correct,
      explanation: q?.explanation ?? null,
      correctAnswer: q?.correctAnswer ?? null,
    };
  });

  return {
    attemptId: attempt.id,
    score,
    total,
    details,
  };
}

// get all attempts for user
export async function getAttemptsForUser(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },  // ← Remove attemptId, just filter by userId
    orderBy: { createdAt: 'desc' },
    include: { answers: true },
  });

  return attempts.map((attempt) => ({
    attemptId: attempt.id,
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.total > 0 ? (attempt.score / attempt.total) * 100 : 0,
    completed: true,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    difficulty: attempt.difficulty,
    topic: attempt.topic,
  }));
}

// one attempt of the user with full details
export async function getAttemptForUser(
  userId: string,
  attemptId: string,
) {
  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
    },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!attempt) {
    return null;
  }

  return {
    attemptId: attempt.id,
    score: attempt.score,
    total: attempt.total,
    percentage: Math.round((attempt.score / attempt.total) * 100),
    completed: true,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    difficulty: attempt.difficulty,
    topic: attempt.topic,
    details: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      selected: answer.selected,
      correct: answer.correct,
      explanation: answer.question?.explanation ?? null,
      correctAnswer: answer.question?.correctAnswer ?? null,
    })),
  };
}

