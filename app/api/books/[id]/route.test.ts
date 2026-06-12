import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const findUnique = vi.mocked(prisma.book.findUnique);

function getRequest(id: string): [Request, RouteContext<"/api/books/[id]">] {
  return [
    new Request(`http://localhost/api/books/${id}`),
    { params: Promise.resolve({ id }) },
  ];
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/books/[id]", () => {
  it("returns the book with its sessions when found", async () => {
    const mockBook = {
      id: "abc123",
      isbn: "9780062316110",
      title: "Sapiens",
      author: "Yuval Noah Harari",
      coverUrl: null,
      totalPages: 464,
      status: "queued",
      createdAt: new Date("2024-01-01"),
      sessions: [
        {
          id: "s1",
          bookId: "abc123",
          date: new Date("2024-01-10"),
          startPage: 1,
          endPage: 50,
          minutes: 60,
        },
      ],
    };

    findUnique.mockResolvedValue(mockBook as never);

    const res = await GET(...getRequest("abc123"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("abc123");
    expect(body.title).toBe("Sapiens");
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].endPage).toBe(50);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "abc123" },
      include: { sessions: { orderBy: { date: "asc" } } },
    });
  });

  it("returns 404 when the book does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const res = await GET(...getRequest("nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/nonexistent/);
  });
});
