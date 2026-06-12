"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AddBookForm.module.css";

export default function AddBookForm() {
  const router = useRouter();
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn: isbn.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setIsbn("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="ISBN (e.g. 9780525559474)"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          disabled={loading}
          required
          aria-label="ISBN"
        />
        <button
          className={styles.button}
          type="submit"
          disabled={loading || !isbn.trim()}
        >
          {loading ? "Adding…" : "Add book"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
