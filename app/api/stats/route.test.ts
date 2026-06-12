import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    readingSession: { findMany: vi.fn() },
    book: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const findMany = vi.mocked(prisma.readingSession.findMany);
const count = vi.mocked(prisma.book.count);

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/stats", () => {
  it("returns all four stats with correct values", async () => {
    findMany.mockResolvedValue([
      { date: new Date("2026-06-11T10:00:00Z"), startPage: 0, endPage: 80 },
      { date: new Date("2026-06-12T10:00:00Z"), startPage: 80, endPage: 130 },
    ] as never);
    count.mockResolvedValue(3);

    const res = await GET(new Request("http://localhost/api/stats"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalPagesRead).toBe(130); // 80 + 50
    expect(body.booksFinished).toBe(3);
    expect(typeof body.pagesPerDay).toBe("number");
    expect(typeof body.currentStreak).toBe("number");
  });

  it("returns all zeros when the database is empty", async () => {
    findMany.mockResolvedValue([] as never);
    count.mockResolvedValue(0);

    const res = await GET(new Request("http://localhost/api/stats"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalPagesRead).toBe(0);
    expect(body.pagesPerDay).toBe(0);
    expect(body.currentStreak).toBe(0);
    expect(body.booksFinished).toBe(0);
  });

  it("calculates currentStreak as consecutive Manila days ending today", async () => {
    // 2026-06-12T01:00:00Z = 2026-06-12 09:00 Manila (UTC+8) → "today" is June 12
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T01:00:00Z"));

    findMany.mockResolvedValue([
      { date: new Date("2026-06-12T01:00:00Z"), startPage: 0, endPage: 10 },
      { date: new Date("2026-06-11T01:00:00Z"), startPage: 10, endPage: 20 },
      // June 10 missing → streak stops at 2
      { date: new Date("2026-06-09T01:00:00Z"), startPage: 20, endPage: 30 },
    ] as never);
    count.mockResolvedValue(0);

    const res = await GET(new Request("http://localhost/api/stats"));
    const body = await res.json();

    expect(body.currentStreak).toBe(2);
  });

  it("returns streak of 0 when today has no session", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T01:00:00Z"));

    findMany.mockResolvedValue([
      // Only yesterday and before — no session on June 12
      { date: new Date("2026-06-11T01:00:00Z"), startPage: 0, endPage: 50 },
    ] as never);
    count.mockResolvedValue(0);

    const res = await GET(new Request("http://localhost/api/stats"));
    const body = await res.json();

    expect(body.currentStreak).toBe(0);
  });
});
