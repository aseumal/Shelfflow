import { computeStats } from "@/lib/stats";

export async function GET(_req: Request): Promise<Response> {
  return Response.json(await computeStats());
}
