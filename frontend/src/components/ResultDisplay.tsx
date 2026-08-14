import { type AttemptResult } from '../api';
import styles from '../styles/ResultDisplay.module.css';

interface ResultDisplayProps {
  result: AttemptResult;
  onNext: () => void;
}

export function ResultDisplay({ result, onNext }: ResultDisplayProps) {
  const percentage = Math.round((result.score / result.total) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.scoreCard}>
        <h2 className={styles.scoreTitle}>Quiz Submitted!</h2>

        <div className={styles.scoreDisplay}>
          <div className={styles.scoreCircle}>
            <span className={styles.percentage}>{percentage}%</span>
          </div>
          <p className={styles.scoreText}>
            You got <strong>{result.score}</strong> out of{' '}
            <strong>{result.total}</strong> correct
          </p>
        </div>
      </div>

      <div className={styles.details}>
        {result.details.map((detail, index) => (
          <div
            key={index}
            className={`${styles.detail} ${detail.correct ? styles.correct : styles.incorrect}`}
          >
            <div className={styles.detailHeader}>
              <span className={styles.status}>
                {detail.correct ? '✓' : '✗'}
              </span>
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

      <button className={styles.nextButton} onClick={onNext}>
        Try Another Question
      </button>
    </div>
  );
}
