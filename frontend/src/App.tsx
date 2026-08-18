import { useEffect, useState } from 'react';
import {
  LoadingState,
  ErrorDisplay,
  SectionsList,
  QuestionCard,
  ResultDisplay,
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

  const currentQuestion = sessionQuestions?.[questionIndex] ?? null;
  const currentAnswer = currentQuestion ?
  answers[currentQuestion.id] ?? null
  : null;

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
    
    const attemptResult = await submitAttempt(attemptAnswers);
    setResult(attemptResult);
  } catch {
    setError('Failed to submit attempt');
  } finally {
    setLoading(false);
  }
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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>System Design Quiz</h1>
        <p>Test your knowledge on system design concepts</p>
        {session ? (
          <div>
            <p>Signed in as: {session.user.email}</p>
          </div>
        ) : (
          <button className={styles.signUpButton} onClick={() => setShowAuthModal(true)}>Sign Up / Log In</button>
        )}
      </header>
      <div className={styles.content}>
        {error && <ErrorDisplay message={error} />}

        {loading && !sections && <LoadingState />}

        {sections && !sessionQuestions && !result && (
          <SectionsList
            sections={sections}
            onStartSession={handleStartSession}
          />
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
            isLastQuestion={questionIndex === sessionQuestions.length - 1}
            loading={loading}
          />
        )}

        {result && (
          <ResultDisplay result={result} onNext={handleReset} />
        )}
      </div>
      <AuthForm isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} session={session} />
    </main>
  );
}

export default App;
