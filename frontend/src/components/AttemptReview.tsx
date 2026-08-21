import { useEffect, useState } from 'react';
import { getAttemptDetails, type AttemptResult } from '../api';
import { LoadingState, ErrorDisplay } from '.';
import styles from '../styles/AttemptReview.module.css';

interface AttemptReviewProps {
  attemptId: string;
  onBack: () => void;
  onNewQuiz: () => void;
}

export function AttemptReview({ attemptId, onBack, onNewQuiz }: AttemptReviewProps) {
  const [attempt, setAttempt] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttemptDetails(attemptId);
        setAttempt(data);
      } catch (err) {
        setError('Failed to load attempt details');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [attemptId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorDisplay message={error} />;
  if (!attempt) return <ErrorDisplay message="Attempt not found" />;

  const percentage = Math.round((attempt.score / attempt.total) * 100);

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Back to History
      </button>

      <div className={styles.scoreCard}>
        <h2>Attempt Review</h2>
        <div className={styles.metadata}>
          {attempt.difficulty && <span className={styles.badge}>{attempt.difficulty}</span>}
          {attempt.topic && <span className={styles.topic}>{attempt.topic}</span>}
          {attempt.createdAt && (
            <span className={styles.date}>{new Date(attempt.createdAt).toLocaleString()}</span>
          )}
        </div>

        <div className={styles.scoreDisplay}>
          <div className={styles.scoreCircle}>
            <span className={styles.percentage}>{percentage}%</span>
          </div>
          <p className={styles.scoreText}>
            You got <strong>{attempt.score}</strong> out of <strong>{attempt.total}</strong> correct
          </p>
        </div>
      </div>

      <div className={styles.details}>
        {attempt.details.map((detail, index) => (
          <div
            key={index}
            className={`${styles.detail} ${detail.correct ? styles.correct : styles.incorrect}`}
          >
            <div className={styles.detailHeader}>
              <span className={styles.status}>{detail.correct ? '✓' : '✗'}</span>
              <p className={styles.selected}>
                Your answer: <strong>{detail.selected}</strong>
              </p>
            </div>

            {!detail.correct && (
              <p className={styles.correctAnswer}>
                Correct answer: <strong>{detail.correctAnswer}</strong>
              </p>
            )}

            {detail.explanation && (
              <p className={styles.explanation}>{detail.explanation}</p>
            )}
          </div>
        ))}
      </div>

      <button className={styles.newQuizBtn} onClick={onNewQuiz}>
        Take New Quiz
      </button>
    </div>
  );
}