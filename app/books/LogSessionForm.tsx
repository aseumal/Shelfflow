"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LogSessionForm.module.css";

type Props = {
  bookId: string;
  totalPages: number;
};

export default function LogSessionForm({ bookId, totalPages }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
  );
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [minutes, setMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDate(
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
    );
    setStartPage("");
    setEndPage("");
    setMinutes("");
    setError(null);
  }

  function handleToggle() {
    if (open) reset();
    setOpen((o) => !o);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const startPageNum = parseInt(startPage, 10);
    const endPageNum = parseInt(endPage, 10);
    const minutesNum = parseInt(minutes, 10);

    if (isNaN(startPageNum) || isNaN(endPageNum) || isNaN(minutesNum)) {
      setError("All page and minute fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/books/${bookId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startPage: startPageNum,
          endPage: endPageNum,
          minutes: minutesNum,
        }),
      });

      const data = await res
        .json()
        .catch(() => ({ error: "Unexpected server error." }));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        type="button"
        onClick={handleToggle}
        disabled={loading}
      >
        {open ? "Cancel" : "Log session"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <label className={styles.label}>
              Date
              <input
                className={styles.input}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <label className={styles.label}>
              Start page
              <input
                className={styles.input}
                type="number"
                min={0}
                max={totalPages}
                placeholder="0"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <label className={styles.label}>
              End page
              <input
                className={styles.input}
                type="number"
                min={1}
                max={totalPages}
                placeholder="50"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <label className={styles.label}>
              Minutes
              <input
                className={styles.input}
                type="number"
                min={1}
                placeholder="30"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          </div>
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save session"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      )}
    </div>
  );
}
