const API_URL = 'http://localhost:4000';

export type QuestionPreview = {
  id: string;
  prompt: string;
  difficulty: string;
};

export type QuizSections = Record<
  string,
  {
    topics: Record<string, QuestionPreview[]>;
  }
>;

export type PublicQuestion = {
  id: string;
  prompt: string;
  options: string[];
  difficulty: string;
  topics: string[];
};

export type SessionSelection = {
  difficulty: string;
  topic?: string;
};  

export type AttemptAnswer = {
  questionId: string;
  selected: string;
};

export type AttemptResult = {
  attemptId: string;
  score: number;
  total: number;
  details: Array<{
    questionId: string;
    selected: string;
    correct: boolean;
    explanation: string | null;
    correctAnswer: string | null;
  }>;
};

export async function getSections(): Promise<QuizSections> {
  const response = await fetch(`${API_URL}/api/quizzes/sections`);

  if (!response.ok) {
    throw new Error('Unable to load quiz sections');
  }

  return response.json();
}

export async function getQuizSession(
  selection: SessionSelection,
): Promise<PublicQuestion[]> {
  const params = new URLSearchParams({
    difficulty: selection.difficulty,
  });

  if(selection.topic){
    params.set('topic', selection.topic);
  }

  const response = await fetch(
    `${API_URL}/api/quizzes/session?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Unable to load quiz session');
  }
  return response.json();
}

export async function getQuestion(id: string): Promise<PublicQuestion> {
  const response = await fetch(`${API_URL}/api/quizzes/questions/${id}`);

  if (!response.ok) {
    throw new Error('Unable to load question');
  }

  return response.json();
}

export async function submitAttempt(
  questionId: string,
  selected: string,
): Promise<AttemptResult> {
  const response = await fetch(`${API_URL}/api/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answers: [{ questionId, selected }],
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to submit answer');
  }

  return response.json();
}
