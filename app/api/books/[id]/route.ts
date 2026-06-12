import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/books/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: { sessions: { orderBy: { date: "asc" } } },
  });

  if (!book) {
    return Response.json(
      { error: `No book found with id ${id}` },
      { status: 404 },
    );
  }

  return Response.json(book);
}
