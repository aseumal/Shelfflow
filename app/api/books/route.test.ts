import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock the Prisma singleton so tests never touch the real database.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const findUnique = vi.mocked(prisma.book.findUnique);
const create = vi.mocked(prisma.book.create);

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeFetch(
  bookPayload: unknown,
  authorPayload: unknown = { name: "Test Author" }
) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("/isbn/")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(bookPayload),
      });
    }
    // author lookup
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(authorPayload),
    });
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/books", () => {
  it("creates a book for a valid ISBN", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "abc123",
      isbn: "9780062316110",
      title: "Sapiens",
      author: "Yuval Noah Harari",
      coverUrl: "https://covers.openlibrary.org/b/id/8315361-L.jpg",
      totalPages: 464,
      status: "queued",
      createdAt: new Date("2024-01-01"),
    } as never);

    vi.stubGlobal(
      "fetch",
      makeFetch({
        title: "Sapiens",
        number_of_pages: 464,
        authors: [{ key: "/authors/OL123A" }],
        covers: [8315361],
      })
    );

    const res = await POST(postRequest({ isbn: "9780062316110" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.isbn).toBe("9780062316110");
    expect(body.title).toBe("Sapiens");
    expect(body.author).toBe("Yuval Noah Harari");
    expect(create).toHaveBeenCalledOnce();
  });

  it("returns 400 for a malformed request body", async () => {
    const res = await POST(postRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when Open Library does not know the ISBN", async () => {
    findUnique.mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    const res = await POST(postRequest({ isbn: "0000000000000" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/0000000000000/);
    expect(create).not.toHaveBeenCalled();
  });
});
