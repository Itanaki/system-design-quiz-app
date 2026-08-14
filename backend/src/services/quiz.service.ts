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
  options: any;
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  topics: string[];
}) {
  return prisma.question.create({ data });
}

export async function submitAttempt(payload: {
  userId?: string;
  answers: Array<{ questionId: string; selected: string }>;
}) {
  const { userId, answers } = payload;
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  let correctCount = 0;
  const total = questions.length;

  // create attempt and nested answers
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      score: 0, // temporary, will update
      total,
      answers: {
        create: answers.map((a) => {
          const q = qMap.get(a.questionId);
          const isCorrect = q ? q.correctAnswer === a.selected : false;
          if (isCorrect) correctCount++;
          return {
            questionId: a.questionId,
            selected: a.selected,
            correct: isCorrect,
          };
        }),
      },
    },
    include: { answers: true },
  });

  // update score
  await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: { score: correctCount },
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
    score: correctCount,
    total,
    details,
  };
}


