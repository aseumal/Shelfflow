import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    startPage: z.int().nonnegative(),
    endPage: z.int().positive(),
    minutes: z.int().positive(),
  })
  .refine((d) => d.endPage > d.startPage, {
    message: "endPage must be greater than startPage",
    path: ["endPage"],
  });

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { date, startPage, endPage, minutes } = parsed.data;
  const parsedDate = new Date(date);
  if (
    isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!book) {
    return Response.json(
      { error: `No book found with id ${id}` },
      { status: 404 },
    );
  }

  try {
    const session = await prisma.readingSession.create({
      data: { bookId: id, date: parsedDate, startPage, endPage, minutes },
    });
    return Response.json(session, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  }
}
