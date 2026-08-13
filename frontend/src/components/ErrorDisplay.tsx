import styles from './ErrorDisplay.module.css';

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>⚠️</div>
      <p>{message}</p>
    </div>
  );
}
