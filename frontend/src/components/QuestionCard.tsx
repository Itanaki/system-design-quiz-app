import { type PublicQuestion } from '../api';
import styles from '../styles/QuestionCard.module.css';

interface QuestionCardProps {
  question: PublicQuestion;
  questionNumber: number;
  totalQuestions: number;
  selected: string | null;
  onOptionSelect: (option: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onBack: () => void;
  isLastQuestion: boolean;
  loading: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selected,
  onOptionSelect,
  onPrevious,
  onNext,
  onBack,
  isLastQuestion,
  loading,
}: QuestionCardProps) {
  return (
    <article className={styles.card}>
      <button
        className={styles.backButton}
        onClick={onBack}
        type="button"
        disabled={loading}
      >
        Back to quizzes
      </button>

      <div className={styles.progress}>
        Question {questionNumber} of {totalQuestions}
      </div>

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
            disabled={loading}
          >
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>

      <div className={styles.navigation}>
        <button
          className={styles.navigationButton}
          onClick={onPrevious}
          disabled={questionNumber === 1 || loading}
          type="button"
        >
          Previous
        </button>

        <button
          className={styles.submitButton}
          onClick={onNext}
          disabled={!selected || loading}
          type="button"
        >
          {loading ? 'Submitting...' : isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </article>
  );
}
