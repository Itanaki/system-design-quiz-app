import { useEffect, useState } from 'react';
import { getAttemptHistory, type AttemptSummary } from '../api';
import { LoadingState, ErrorDisplay } from '.';
import styles from '../styles/ProgressHistory.module.css';

interface ProgressHistoryProps {
  onSelectAttempt: (attemptId: string) => void;
}

export function ProgressHistory({ onSelectAttempt }: ProgressHistoryProps) {
  const [attempts, setAttempts] = useState<AttemptSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttemptHistory();
        setAttempts(data);
      } catch (err) {
        setError('Failed to load attempt history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorDisplay message={error} />;

  if (!attempts || attempts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>No Attempts Yet</h2>
          <p>Take your first quiz to see your progress here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>My Attempt History</h2>
      <div className={styles.list}>
        {attempts.map((attempt) => (
          <div key={attempt.attemptId} className={styles.card}>
            <div className={styles.header}>
              <div className={styles.metadata}>
                {attempt.difficulty && (
                  <span className={`${styles.badge} ${styles[attempt.difficulty]}`}>
                    {attempt.difficulty}
                  </span>
                )}
                {attempt.topic && <span className={styles.topic}>{attempt.topic}</span>}
              </div>
              <span className={styles.date}>
                {new Date(attempt.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.score}>
              <span className={styles.percentage}>{Math.round(attempt.percentage)}%</span>
              <span className={styles.fraction}>
                {attempt.score} / {attempt.total}
              </span>
            </div>
            <button
              className={styles.reviewBtn}
              onClick={() => onSelectAttempt(attempt.attemptId)}
            >
              Review
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}