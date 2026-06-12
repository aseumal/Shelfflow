import type { Stats } from "@/lib/stats";
import styles from "./StatsBar.module.css";

export default function StatsBar({
  totalPagesRead,
  pagesPerDay,
  currentStreak,
  booksFinished,
}: Stats) {
  return (
    <div className={styles.bar}>
      <div className={styles.tile}>
        <span className={styles.label}>Pages read</span>
        <span className={styles.value}>{totalPagesRead}</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.label}>Pages / day</span>
        <span className={styles.value}>{pagesPerDay}</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.label}>Streak</span>
        <span className={styles.value}>{currentStreak} 🔥</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.label}>Finished</span>
        <span className={styles.value}>{booksFinished}</span>
      </div>
    </div>
  );
}
