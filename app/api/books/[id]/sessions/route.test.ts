import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: { findUnique: vi.fn() },
    readingSession: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const findUnique = vi.mocked(prisma.book.findUnique);
const create = vi.mocked(prisma.readingSession.create);

function postRequest(
  id: string,
  body: unknown,
): [Request, { params: Promise<{ id: string }> }] {
  return [
    new Request(`http://localhost/api/books/${id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  ];
}

const validBody = {
  date: "2026-06-12",
  startPage: 0,
  endPage: 50,
  minutes: 30,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/books/[id]/sessions", () => {
  it("creates a session and returns 201", async () => {
    findUnique.mockResolvedValue({ id: "book1" } as never);
    create.mockResolvedValue({
      id: "s1",
      bookId: "book1",
      date: new Date("2026-06-12"),
      startPage: 0,
      endPage: 50,
      minutes: 30,
    } as never);

    const res = await POST(...postRequest("book1", validBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.bookId).toBe("book1");
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: {
        bookId: "book1",
        date: new Date("2026-06-12"),
        startPage: 0,
        endPage: 50,
        minutes: 30,
      },
    });
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(...postRequest("book1", {}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(body.issues).toBeDefined();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when endPage is not greater than startPage", async () => {
    const res = await POST(
      ...postRequest("book1", { ...validBody, startPage: 100, endPage: 50 }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(body.issues[0].message).toBe(
      "endPage must be greater than startPage",
    );
  });

  it("returns 400 when date format is invalid", async () => {
    const res = await POST(
      ...postRequest("book1", { ...validBody, date: "June 12 2026" }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when minutes is zero", async () => {
    const res = await POST(
      ...postRequest("book1", { ...validBody, minutes: 0 }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });

  it("returns 404 when the book does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const res = await POST(...postRequest("nonexistent", validBody));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/nonexistent/);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/books/book1/sessions", {
        method: "POST",
        body: "not json",
      }),
      { params: Promise.resolve({ id: "book1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid JSON");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a logically invalid date", async () => {
    const res = await POST(
      ...postRequest("book1", { ...validBody, date: "2026-02-30" }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid date");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 500 when the database create fails", async () => {
    findUnique.mockResolvedValue({ id: "book1" } as never);
    create.mockRejectedValue(new Error("DB connection lost"));

    const res = await POST(...postRequest("book1", validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to save session");
  });
});
