import { prisma } from "@/lib/prisma";
import { computeStats } from "@/lib/stats";
import AddBookForm from "./AddBookForm";
import BookCard from "./BookCard";
import StatsBar from "./StatsBar";
import styles from "./page.module.css";

export default async function BooksPage() {
  const [books, stats] = await Promise.all([
    prisma.book.findMany({ orderBy: { createdAt: "desc" } }),
    computeStats(),
  ]);

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>My Books</h1>
      <StatsBar {...stats} />
      <AddBookForm />
      {books.length === 0 ? (
        <p className={styles.empty}>No books yet. Add your first one above.</p>
      ) : (
        <div className={styles.grid}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </main>
  );
}
