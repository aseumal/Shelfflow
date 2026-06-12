import { prisma } from "@/lib/prisma";
import AddBookForm from "./AddBookForm";
import BookCard from "./BookCard";
import styles from "./page.module.css";

export default async function BooksPage() {
  const books = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>My Books</h1>
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
