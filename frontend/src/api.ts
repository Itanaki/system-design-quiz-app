import { supabase } from './lib/supabase';
const API_URL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : (import.meta.env.VITE_API_URL || '');

export type AdminQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  createdAt: string;
  updatedAt: string;
};

export type QuestionInput = {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
};

export type QuestionFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
};

export type PaginatedQuestions = {
  items: AdminQuestion[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Badge = {
  id: string;
  displayName: string;
  description: string;
  category: string;
  iconUrl: string | null;
};

export type UserBadge = {
  milestoneId: string;
  key: string;
  version: number;
  earnedAt: string;
  showcased: boolean;
  badge: Badge;
};

export type PublicShowcase = {
  displayName: string;
  userBadges: Array<Pick<UserBadge, 'milestoneId' | 'earnedAt' | 'badge'> & {
    milestone: Pick<UserBadge, 'key' | 'version'>;
  }>;
};

export type MilestoneProgress = {
  milestoneId: string;
  key: string;
  version: number;
  status: 'locked' | 'in_progress' | 'eligible' | 'earned' | 'retired';
  required: number;
  correct: number;
  percentage: number;
  earnedAt: string | null;
  badge: Badge;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function getApiError(response: Response) {
  try {
    const body = await response.json();
    return body.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}


function buildQuestionQuery(filters: QuestionFilters) {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set('page', String(filters.page));
  }

  if (filters.pageSize) {
    params.set('pageSize', String(filters.pageSize));
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.difficulty) {
    params.set('difficulty', filters.difficulty);
  }

  if (filters.topic) {
    params.set('topic', filters.topic);
  }

  return params.toString();
}

export async function listAdminQuestions(
  filters: QuestionFilters = {},
): Promise<PaginatedQuestions> {
  const query = buildQuestionQuery(filters);
  const response = await apiFetch(
    `/api/quizzes/questions${query ? `?${query}` : ''}`,
  );

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return response.json();
}

export async function createQuestion(
  input: QuestionInput,
): Promise<AdminQuestion> {
  const response = await apiFetch('/api/quizzes/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return response.json();
}

export async function updateQuestion(
  id: string,
  input: Partial<QuestionInput>,
): Promise<AdminQuestion> {
  const response = await apiFetch(`/api/quizzes/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return response.json();
}

export async function deleteQuestion(id: string): Promise<void> {
  const response = await apiFetch(`/api/quizzes/questions/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = await getAccessToken();

  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}

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
  percentage?: number;
  completed?: boolean;
  createdAt?: string;
  completedAt?: string | null;
  difficulty?: string | null;
  topic?: string | null;
   newlyEarnedBadges?: Array<{
    badgeId: string;
    milestoneId: string;
    key: string;
    version: number;
    displayName: string;
    earnedAt: string;
  }>;
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
  answers: Array<{ questionId: string; selected: string }>,
  difficulty?: string,
  topic?: string,
): Promise<AttemptResult> {
  const payload = {
    answers,
    ...(difficulty ? { difficulty } : {}),
    ...(topic?.trim() ? { topic: topic.trim() } : {}),
  };

  const response = await apiFetch(`/api/attempts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Unable to submit answer');
  }

  return response.json();
}


export type AttemptSummary = {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
  difficulty: string | null;
  topic: string | null;
};

export async function getAttemptHistory(): Promise<AttemptSummary[]> {
  const response = await apiFetch('/api/attempts');

  if (!response.ok) {
    throw new Error('Unable to load attempt history');
  }

  return response.json();
}

export async function getAttemptDetails(
  attemptId: string,
): Promise<AttemptResult> {
  const response = await apiFetch(`/api/attempts/${attemptId}`);

  if (!response.ok) {
    throw new Error('Unable to load attempt details');
  }

  return response.json();
}

export type LeaderboardScope = 'global' | 'easy' | 'medium' | 'hard';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  masteryPercentage: number;
  weightedPointsEarned: number;
  uniqueCorrect: number;
  easyCorrect: number;
  mediumCorrect: number;
  hardCorrect: number;
  scoreReachedAt: string | null;
};

export type LeaderboardResponse = {
  scope: { type: LeaderboardScope };
  entries: LeaderboardEntry[];
  weightedPointsAvailable: number;
  pagination: {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
  };
};

export type MyRank = {
  rank: number | null;
  masteryPercentage: number;
  weightedPointsEarned: number;
  weightedPointsAvailable: number;
  uniqueCorrect: number;
};

export async function getLeaderboard(
  scope: LeaderboardScope,
  page = 1,
  pageSize = 20,
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const path =
    scope === 'global'
      ? '/api/leaderboard/global'
      : `/api/leaderboard/difficulty/${scope}`;

  const response = await apiFetch(`${path}?${params.toString()}`);

  if (!response.ok) {
    throw new ApiRequestError(await getApiError(response), response.status);
  }

  return response.json();
}

export async function getMyLeaderboardRank(
  scope: LeaderboardScope,
): Promise<MyRank> {
  const params = new URLSearchParams({ scope });
  const response = await apiFetch(`/api/leaderboard/me?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return response.json();
}

export async function getMilestoneProgress(): Promise<MilestoneProgress[]> {
  const response = await apiFetch('/api/attempts/milestones');

  if (!response.ok) {
    throw new ApiRequestError(
      await getApiError(response),
      response.status,
    );
  }

  const body = await response.json();
  return body.milestones;
}

export async function getMyBadges(): Promise<UserBadge[]> {
  const response = await apiFetch('/api/profile/badges');

  if (!response.ok) {
    throw new ApiRequestError(
      await getApiError(response),
      response.status,
    );
  }

  const body = await response.json();
  return body.badges;
}

export async function getPublicShowcase(userId: string): Promise<PublicShowcase> {
  const response = await apiFetch(`/api/profile/${encodeURIComponent(userId)}/showcase`);

  if (!response.ok) {
    throw new ApiRequestError(await getApiError(response), response.status);
  }

  return response.json();
}

export async function updateShowcasedBadges(
  milestoneIds: string[],
): Promise<UserBadge[]> {
  const response = await apiFetch('/api/profile/badges/showcase', {
    method: 'PUT',
    body: JSON.stringify({ milestoneIds }),
  });

  if (!response.ok) {
    throw new ApiRequestError(
      await getApiError(response),
      response.status,
    );
  }

  const body = await response.json();
  return body.badges;
}