import styles from './LoadingState.module.css';

export function LoadingState() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p>Loading...</p>
    </div>
  );
}
