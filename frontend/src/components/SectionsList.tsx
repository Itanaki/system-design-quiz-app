import { useState } from 'react';
import { type QuizSections } from '../api';
import styles from '../styles/SectionsList.module.css';

interface SectionsListProps {
  sections: QuizSections;
  onStartSession: (difficulty: string, topic?: string) => void;
}

const TOPICS_PER_PAGE = 6;

export function SectionsList({
  sections,
  onStartSession,
}: SectionsListProps) {
  const difficultyOrder = ['easy', 'medium', 'hard'];
  const [pageByDifficulty, setPageByDifficulty] = useState<
    Record<string, number>
  >({});

  const sortedSections = Object.entries(sections).sort(([a], [b]) => {
      const firstIndex = difficultyOrder.indexOf(a.toLowerCase());
      const secondIndex = difficultyOrder.indexOf(b.toLowerCase());
    return (
      (firstIndex === -1 ? 999 : firstIndex) -
      (secondIndex === -1 ? 999 : secondIndex)
    );
  });

  const goToPage = (difficulty: string, page: number) => {
    setPageByDifficulty((prev) => ({ ...prev, [difficulty]: page }));
  };

  return (
    <div className={styles.container}>
      {sortedSections.map(([difficulty, section]) => {
        const topicEntries = Object.entries(section.topics);
        const pageCount = Math.max(
          1,
          Math.ceil(topicEntries.length / TOPICS_PER_PAGE),
        );
        const currentPage = Math.min(
          pageByDifficulty[difficulty] ?? 0,
          pageCount - 1,
        );
        const pagedTopicEntries = topicEntries.slice(
          currentPage * TOPICS_PER_PAGE,
          currentPage * TOPICS_PER_PAGE + TOPICS_PER_PAGE,
        );

        return (
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
              {pagedTopicEntries.map(([topic, questions]) => (
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

            {pageCount > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationButton}
                  type="button"
                  onClick={() => goToPage(difficulty, currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </button>
                <span className={styles.pageIndicator}>
                  Page {currentPage + 1} of {pageCount}
                </span>
                <button
                  className={styles.paginationButton}
                  type="button"
                  onClick={() => goToPage(difficulty, currentPage + 1)}
                  disabled={currentPage === pageCount - 1}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
