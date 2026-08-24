import { type QuizSections } from '../api';
import styles from '../styles/SectionsList.module.css';

interface SectionsListProps {
  sections: QuizSections;
  onStartSession: (difficulty: string, topic?: string) => void;
}

export function SectionsList({
  sections,
  onStartSession,
}: SectionsListProps) {
  const difficultyOrder = ['easy', 'medium', 'hard'];

  const sortedSections = Object.entries(sections).sort(([a], [b]) => {
      const firstIndex = difficultyOrder.indexOf(a.toLowerCase());
      const secondIndex = difficultyOrder.indexOf(b.toLowerCase());
    return (
      (firstIndex === -1 ? 999 : firstIndex) -
      (secondIndex === -1 ? 999 : secondIndex)
    );
  });
  return (
    <div className={styles.container}>
      {sortedSections.map(([difficulty, section]) => (
        <section key={difficulty} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.difficulty}>{difficulty}</h2>
            <p>
              {new Set(Object.values(section.topics).flatMap((questions) =>
                questions.map((question) => question.id),
              )).size}{' '}
              questions
            </p>
          </div>

          <button
            className={styles.questionButton}
            type="button"
            onClick={() => onStartSession(difficulty)}
          >
            Start {difficulty} quiz
          </button>
          

          <div className={styles.topicsGrid}>
            {Object.entries(section.topics).map(([topic, questions]) => (
              <div key={topic} className={styles.topicGroup}>
                <div>
                  <h3 className={styles.topicName}>{topic}</h3>
                  <p>{questions.length} questions</p>
                </div>

                <button
                  className={styles.questionButton}
                  type="button"
                  onClick={() => onStartSession(difficulty, topic)}
                >
                  Start {topic} quiz
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
