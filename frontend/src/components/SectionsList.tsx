import { type QuizSections } from '../api';
import styles from '../styles/SectionsList.module.css';

interface SectionsListProps {
  sections: QuizSections;
  onQuestionSelect: (questionId: string) => void;
}

export function SectionsList({
  sections,
  onQuestionSelect,
}: SectionsListProps) {
  return (
    <div className={styles.container}>
      {Object.entries(sections).sort(([a], [b]) => {
        const order = ['easy', 'medium', 'hard'];
        return order.indexOf(a.toLowerCase()) - order.indexOf(b.toLowerCase());
      }).map(([difficulty, section]) => (
        <section key={difficulty} className={styles.section}>
          <h2 className={styles.difficulty}>{difficulty}</h2>

          <div className={styles.topicsGrid}>
            {Object.entries(section.topics).map(([topic, questions]) => (
              <div key={topic} className={styles.topicGroup}>
                <h3 className={styles.topicName}>{topic}</h3>

                <div className={styles.questionsList}>
                  {questions.map((preview) => (
                    <button
                      key={preview.id}
                      className={styles.questionButton}
                      onClick={() => onQuestionSelect(preview.id)}
                      title={preview.prompt}
                    >
                      {preview.prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
