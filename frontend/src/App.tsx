import { useEffect, useState } from 'react';
import {
  LoadingState,
  ErrorDisplay,
  SectionsList,
  QuestionCard,
  ResultDisplay,
  AdminQuestions,
  ProgressHistory,
  AttemptReview,
} from './components';
import {
  type QuizSections,
  type PublicQuestion,
  type AttemptResult,
  getSections,
  getQuizSession,
  submitAttempt,
} from './api';
import styles from './App.module.css';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { signOut } from './auth';

function App() {
  const [session, setSession] = 
    useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [sections, setSections] = useState<QuizSections | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<PublicQuestion[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentSessionDifficulty, setCurrentSessionDifficulty] = useState<string>('');
  const [currentSessionTopic, setCurrentSessionTopic] = useState<string>('');

  const currentQuestion = sessionQuestions?.[questionIndex] ?? null;
  const currentAnswer = currentQuestion ?
  answers[currentQuestion.id] ?? null
  : null;

  const [view, setView] = useState<'sections' | 'quiz' | 'result' | 'history' | 'review' | 'admin'>(
  window.location.pathname === '/admin/questions'
    ? 'admin'
    : 'sections',
);
const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const isAdmin =
  session?.user.app_metadata?.role === 'admin';

  async function handleStartSession(
    difficulty: string,
    topic?: string,
  ) {
    setLoading(true);
    setError(null);
    setSessionQuestions(null);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setCurrentSessionDifficulty(difficulty);
    setCurrentSessionTopic(topic || '');

    try {
      const questions = await getQuizSession({
        difficulty,
        topic,
      });
      setSessionQuestions(questions);
    } catch {
      setSessionQuestions(null);
      setError('Failed to load quiz session');
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(option: string) {
    if (!currentQuestion) {
      return;
    }
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentQuestion.id]: option,
    }));
  }

  function handlePrevious(){
    setQuestionIndex((previousIndex) => Math.max(previousIndex - 1, 0));
  }

  async function handleNext() {
    if (!currentQuestion || !currentAnswer || !sessionQuestions) {
      return;
  }
  const isLastQuestion = 
  questionIndex === sessionQuestions.length - 1;

  if (!isLastQuestion) {
    setQuestionIndex((previousIndex) => previousIndex + 1);
    return;
  }
  setLoading(true);
  setError(null);

  try {
    const attemptAnswers = sessionQuestions.map((q) =>({
      questionId: q.id,
      selected: answers[q.id],
    }));
    
    const attemptResult = await submitAttempt(
    attemptAnswers,
    currentSessionDifficulty,
    currentSessionTopic,
);
setResult(attemptResult);
  } catch {
    setError('Failed to submit attempt');
  } finally {
    setLoading(false);
  }
}
  async function handleSignOut() {
  const { error: signOutError } = await signOut();

  if (signOutError) {
    setError(signOutError.message);
  }
  setView('sections');
}
  
  function handleReset() {
    setSessionQuestions(null);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  function handleBackFromAttempt() {
    if (
      Object.keys(answers).length > 0 &&
      !window.confirm('Leave this quiz? Your answers will be lost.')
    ) {
      return;
    }

    handleReset();
  }

  // function openAdminView() {
  // window.history.pushState({}, '', '/admin/questions');
  // setView('admin');
  // }

  function returnToQuiz() {
    window.history.pushState({}, '', '/');
    setView('sections');
  }

  function handleHomeClick() {
    if (view === 'quiz' && Object.keys(answers).length > 0) {
      if (!window.confirm('Leave this quiz? Your answers will be lost.')) {
        return;
      }
    }
    setView('sections');
    handleReset();
    setSelectedAttemptId(null);
    window.history.pushState({}, '', '/');
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data}) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getSections()
      .then(setSections)
      .catch(() => setError('Failed to load quiz sections'))
      .finally(() => setLoading(false));
  }, []);

  function AuthHeader() {
    return (
      <div className={`${styles.authHeader} ${session?.user ? styles.withBorder : ''}`}>
        {session?.user && (
          <h2>My Progress</h2>
        )}
        
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          {view !== 'sections' && (
            <button
              className={styles.homeButton}
              type="button"
              onClick={handleHomeClick}
            >
              ← Home
            </button>
          )}
          {session ? (
            <div className={styles.authControls}>
              <p>Signed in as: {session.user.email}</p>
              <button
                className={styles.signOutButton}
                type="button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button className={styles.signUpButton} onClick={() => setShowAuthModal(true)}>Sign Up / Log In</button>
          )}
        </div>
        <div className={styles.headerTitle}>
          <h1>SysQuiz</h1>
          <p>Test your knowledge on system design concepts</p>
        </div>
      </header>
      <div className={styles.content}>
        
        {view === 'history' && session?.user ? (
          <>
            <AuthHeader/>
            <ProgressHistory
              onSelectAttempt={(attemptId) => {
                setSelectedAttemptId(attemptId);
                setView('review');
              }}
            />
          </>
        ) : view === 'review' && session?.user && selectedAttemptId ? (
          <>
            <AuthHeader/>
            <AttemptReview
              attemptId={selectedAttemptId}
              onBack={() => setView('history')}
              onNewQuiz={() => {
                setSelectedAttemptId(null);
                setView('sections');
              }}
            />
          </>
        ) : view === 'admin' && isAdmin ? (
          <AdminQuestions onBack={returnToQuiz} />
        ) : view === 'admin' ? (
          <ErrorDisplay message="Admin access required" />
        ) : (
          <>
            {error && <ErrorDisplay message={error} />}

            {loading && !sections && <LoadingState />}

            {view === 'sections' && (
              <>
                <AuthHeader/>
                {session?.user && (
                  <button
                    onClick={() => setView('history')}
                    className={styles.historyBtn}
                  >
                    My History
                  </button>
                )}
                {sections && !sessionQuestions && !result && (
                <SectionsList
                sections={sections}
                onStartSession={handleStartSession}
              />
            )}
              </>
            )}
            

            {loading && sessionQuestions?.length === 0 && <LoadingState />}

            {currentQuestion && sessionQuestions && !result && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={sessionQuestions.length}
                selected={currentAnswer}
                onOptionSelect={handleOptionSelect}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onBack={handleBackFromAttempt}
                isLastQuestion={
                  questionIndex === sessionQuestions.length - 1
                }
                loading={loading}
              />
            )}

            {result && (
              <ResultDisplay result={result} onNext={handleReset} />
            )}
          </>
        )}
</div>
      <AuthForm isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} session={session} />
    </main>
  );
}

export default App;
