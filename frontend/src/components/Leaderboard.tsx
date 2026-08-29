import { useEffect, useState } from 'react';
import {
  getLeaderboard,
  getMyLeaderboardRank,
  type LeaderboardEntry,
  type LeaderboardScope,
  type MyRank,
} from '../api';
import { LoadingState, ErrorDisplay } from '.';
import styles from '../styles/Leaderboard.module.css';

interface LeaderboardProps {
  currentUserId?: string;
}

const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const PAGE_SIZE = 20;

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [weightedPointsAvailable, setWeightedPointsAvailable] = useState(0);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [scope]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [board, rank] = await Promise.all([
          getLeaderboard(scope, page, PAGE_SIZE),
          currentUserId ? getMyLeaderboardRank(scope) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setEntries(board.entries);
        setTotalPages(board.pagination.totalPages);
        setWeightedPointsAvailable(board.weightedPointsAvailable);
        setMyRank(rank);
      } catch {
        if (!cancelled) {
          setError('Failed to load leaderboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [scope, page, currentUserId]);

  const isCurrentUserOnPage =
    !!currentUserId && !!entries?.some((entry) => entry.userId === currentUserId);

  return (
    <div className={styles.container}>
      <h2>Leaderboard</h2>
      <p className={styles.explanation}>
        Ranked by mastery — the best result for each unique question. Medium
        and Hard questions carry more weight, and repeating a question you've
        already mastered doesn't earn extra points.
      </p>

      <div className={styles.tabs}>
        {SCOPES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.tab} ${scope === option.value ? styles.tabActive : ''}`}
            onClick={() => setScope(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorDisplay message={error} />}

      {!loading && !error && entries && entries.length === 0 && (
        <div className={styles.emptyState}>
          <h3>No ranked players yet</h3>
          <p>Answer questions correctly to appear on this leaderboard.</p>
        </div>
      )}

      {!loading && !error && entries && entries.length > 0 && (
        <>
          <div className={styles.list}>
            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={`${styles.row} ${entry.userId === currentUserId ? styles.rowActive : ''}`}
              >
                <span className={styles.rank}>#{entry.rank}</span>
                <span className={styles.name}>{entry.displayName}</span>
                <span className={styles.percentage}>
                  {entry.masteryPercentage.toFixed(2)}%
                </span>
                <span className={styles.points}>
                  {entry.weightedPointsEarned} / {weightedPointsAvailable} pts
                </span>
                <span className={styles.correct}>{entry.uniqueCorrect} mastered</span>
              </div>
            ))}
          </div>

          {currentUserId && myRank && !isCurrentUserOnPage && (
            <div className={styles.pinnedRow}>
              <span className={styles.rank}>
                {myRank.rank ? `#${myRank.rank}` : 'Unranked'}
              </span>
              <span className={styles.name}>You</span>
              <span className={styles.percentage}>
                {myRank.masteryPercentage.toFixed(2)}%
              </span>
              <span className={styles.points}>
                {myRank.weightedPointsEarned} / {myRank.weightedPointsAvailable} pts
              </span>
              <span className={styles.correct}>{myRank.uniqueCorrect} mastered</span>
            </div>
          )}

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}