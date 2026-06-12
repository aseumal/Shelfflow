import { z } from "zod";
import { prisma } from "@/lib/prisma";

const OL_BASE = "https://openlibrary.org";
const COVERS_BASE = "https://covers.openlibrary.org/b/id";

const bodySchema = z.object({
  isbn: z.string().min(1),
});

type OLBook = {
  title?: string;
  number_of_pages?: number;
  authors?: Array<{ key: string }>;
  covers?: number[];
};

type OLAuthor = {
  name?: string;
};

async function fetchOLBook(isbn: string): Promise<OLBook | null> {
  const res = await fetch(`${OL_BASE}/isbn/${isbn}.json`, {
    redirect: "follow",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Library error: ${res.status}`);
  return res.json() as Promise<OLBook>;
}

async function fetchOLAuthorName(authorKey: string): Promise<string> {
  const res = await fetch(`${OL_BASE}${authorKey}.json`);
  if (!res.ok) return "Unknown";
  const data = (await res.json()) as OLAuthor;
  return data.name ?? "Unknown";
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { isbn } = parsed.data;

  const existing = await prisma.book.findUnique({ where: { isbn } });
  if (existing) {
    return Response.json(
      { error: "Book with this ISBN already exists" },
      { status: 409 },
    );
  }

  const olBook = await fetchOLBook(isbn);
  if (!olBook) {
    return Response.json(
      { error: `No book found for ISBN ${isbn}` },
      { status: 404 },
    );
  }

  if (!olBook.title) {
    return Response.json(
      { error: `Open Library record for ISBN ${isbn} is missing a title` },
      { status: 422 },
    );
  }

  const authorKey = olBook.authors?.[0]?.key ?? null;
  const author = authorKey ? await fetchOLAuthorName(authorKey) : "Unknown";

  const coverUrl =
    olBook.covers && olBook.covers.length > 0
      ? `${COVERS_BASE}/${olBook.covers[0]}-L.jpg`
      : null;

  const book = await prisma.book.create({
    data: {
      isbn,
      title: olBook.title,
      author,
      coverUrl,
      totalPages: olBook.number_of_pages ?? 0,
    },
  });

  return Response.json(book, { status: 201 });
}
