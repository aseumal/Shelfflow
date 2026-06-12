import { prisma } from "@/lib/prisma";

export type Stats = {
  totalPagesRead: number;
  pagesPerDay: number;
  currentStreak: number;
  booksFinished: number;
};

function toManilaDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function subtractOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  return prev.toISOString().slice(0, 10);
}

export async function computeStats(): Promise<Stats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [sessions, booksFinished] = await Promise.all([
    prisma.readingSession.findMany({
      select: { date: true, startPage: true, endPage: true },
    }),
    prisma.book.count({ where: { status: "finished" } }),
  ]);

  const totalPagesRead = sessions.reduce(
    (sum, s) => sum + s.endPage - s.startPage,
    0,
  );

  const recentPages = sessions
    .filter((s) => s.date >= thirtyDaysAgo)
    .reduce((sum, s) => sum + s.endPage - s.startPage, 0);
  const pagesPerDay = Math.round((recentPages / 30) * 10) / 10;

  const sessionDates = new Set(sessions.map((s) => toManilaDate(s.date)));
  let currentStreak = 0;
  let day = toManilaDate(new Date());
  while (sessionDates.has(day)) {
    currentStreak++;
    day = subtractOneDay(day);
  }

  return { totalPagesRead, pagesPerDay, currentStreak, booksFinished };
}
