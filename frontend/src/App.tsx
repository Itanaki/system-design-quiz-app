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
  getQuestion,
  submitAttempt,
  getSections,
} from './api';
import styles from './App.module.css';

function App() {
  const [sections, setSections] = useState<QuizSections | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleQuestionSelected(questionId: string) {
    setLoading(true);
    setError(null);
    setSelected(null);
    setResult(null);

    try {
      const nextQuestion = await getQuestion(questionId);
      setQuestion(nextQuestion);
    } catch {
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!question || !selected) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const attemptResult = await submitAttempt(question.id, selected);
      setResult(attemptResult);
    } catch {
      setError('Failed to submit attempt');
    } finally {
      setLoading(false);
    }
  }

  function handleNextQuestion() {
    setQuestion(null);
    setSelected(null);
    setResult(null);
  }

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
      </header>

      <div className={styles.content}>
        {error && <ErrorDisplay message={error} />}

        {loading && !sections && <LoadingState />}

        {sections && !question && !result && (
          <SectionsList
            sections={sections}
            onQuestionSelect={handleQuestionSelected}
          />
        )}

        {question && !result && (
          <QuestionCard
            question={question}
            selected={selected}
            onOptionSelect={setSelected}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}

        {result && (
          <ResultDisplay result={result} onNext={handleNextQuestion} />
        )}
      </div>
    </main>
  );
}

export default App;
