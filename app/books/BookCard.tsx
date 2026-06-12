import styles from "./BookCard.module.css";

type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  status: string;
  totalPages: number;
};

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  reading: "Reading",
  finished: "Finished",
};

export default function BookCard({ book }: { book: Book }) {
  const statusLabel = STATUS_LABELS[book.status] ?? book.status;

  return (
    <article className={styles.card}>
      <div className={styles.cover}>
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next-eslint/no-img-element
          <img src={book.coverUrl} alt={`Cover of ${book.title}`} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder} aria-hidden="true">
            <span className={styles.coverInitials}>
              {book.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <span className={`${styles.badge} ${styles[`badge_${book.status}`] ?? ""}`}>
          {statusLabel}
        </span>
        <h2 className={styles.title}>{book.title}</h2>
        <p className={styles.author}>{book.author}</p>
        <p className={styles.pages}>{book.totalPages} pages</p>
      </div>
    </article>
  );
}
