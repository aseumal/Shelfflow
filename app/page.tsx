import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>📚 ShelfFlow</h1>
      <p className={styles.description}>
        Track what you read. Build your streak.
      </p>
      <Link href="/books" className={styles.cta}>
        Go to my books
      </Link>
    </main>
  );
}
