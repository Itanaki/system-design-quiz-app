import prisma from '../lib/prisma';

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
    take: 5,
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

export async function createQuestion(data: {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  topics: string[];
}) {
  return prisma.question.create({ data });
}

export async function submitAttempt(payload: {
  userId?: string;
  answers: Array<{ 
    questionId: string; 
    selected: string 
  }>;
}) {
  const { userId, answers } = payload;
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

export async function getAttemptsForUser(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId},
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
  }));
}

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
    details: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      selected: answer.selected,
      correct: answer.correct,
      explanation: answer.question?.explanation ?? null,
      correctAnswer: answer.question?.correctAnswer ?? null,
    })),
  };


}

