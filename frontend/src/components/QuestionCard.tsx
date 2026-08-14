import { type PublicQuestion } from '../api';
import styles from '../styles/QuestionCard.module.css';

interface QuestionCardProps {
  question: PublicQuestion;
  selected: string | null;
  onOptionSelect: (option: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function QuestionCard({
  question,
  selected,
  onOptionSelect,
  onSubmit,
  loading,
}: QuestionCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.difficulty}>{question.difficulty}</span>
        <div className={styles.topics}>
          {question.topics.map((topic) => (
            <span key={topic} className={styles.topic}>
              {topic}
            </span>
          ))}
        </div>
      </div>

      <h2 className={styles.prompt}>{question.prompt}</h2>

      <div className={styles.options}>
        {question.options.map((option) => (
          <button
            key={option}
            className={`${styles.optionButton} ${selected === option ? styles.selected : ''}`}
            onClick={() => onOptionSelect(option)}
            type="button"
          >
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>

      <button
        className={styles.submitButton}
        onClick={onSubmit}
        disabled={!selected || loading}
        type="button"
      >
        {loading ? 'Submitting...' : 'Submit Answer'}
      </button>
    </article>
  );
}
