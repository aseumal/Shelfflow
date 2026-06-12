import styles from "./page.module.css";

const books = [
  { title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", pages: 352 },
  { title: "Clean Code", author: "Robert C. Martin", pages: 431 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", pages: 611 },
];

export default function BooksPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Books</h1>
      <div className={styles.grid}>
        {books.map((book) => (
          <div key={book.title} className={styles.card}>
            <h2 className={styles.title}>{book.title}</h2>
            <p className={styles.author}>{book.author}</p>
            <p className={styles.pages}>{book.pages} pages</p>
          </div>
        ))}
      </div>
    </main>
  );
}
