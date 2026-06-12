# Lessons — Claude Code in Action (Anthropic)

A running log of what we built and what each step taught about working with Claude Code.

---

## Session 1 — Project setup & Prisma

### What we did

- Initialised a Next.js 16 + React 19 app (`shelfflow`) — a reading productivity tracker
- Set up **Prisma 7** with a **Neon Postgres** database
- Defined three models: `Book`, `ReadingSession`, `Note`
- Ran the initial migration (`prisma migrate dev --name init`)

### Key learnings

**Prisma 7 breaks from earlier versions**
The `url` field is no longer allowed inside `schema.prisma`. Connection strings move to `prisma.config.ts`, which reads from the environment via `dotenv`. Putting `url = env("DATABASE_URL")` in the schema will throw a `P1012` validation error.

**Prisma 7 requires a driver adapter**
There is no built-in query engine binary anymore. You must pass an adapter to `PrismaClient`:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
```

Install `@prisma/adapter-pg` and `pg` alongside the core packages.

**Singleton pattern prevents connection storms in dev**
Hot-reload creates a new module scope on every save. Without the `globalThis` guard, each reload opens a fresh pool:

```ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Watch out for whitespace in `.env`-style files**
The project's `env` file had `DATABASE_URL ="..."` (space before `=`). Standard `.env` parsers silently misread this. Always use `KEY=value` with no surrounding spaces.

**.env exclusion needs to cover non-standard filenames too**
The default `.gitignore` pattern `.env*` does not match a file literally named `env`. Add it explicitly to avoid accidentally committing credentials.

---

## Session 2 — POST /api/books

### What we did

- Implemented `POST /api/books` as a Next.js App Router route handler
- Input validated with **Zod** (`{ isbn: string }`)
- Fetches book metadata from the **Open Library API** (`/isbn/{isbn}.json`)
- Saves the result with Prisma and returns the created record

### Key learnings

**Open Library always redirects**
`GET /isbn/{isbn}.json` returns a `302` to `/books/OL...M.json`. Pass `{ redirect: "follow" }` to `fetch`, otherwise you get a redirect response instead of JSON.

**Author names require a second request**
The book record only contains an author key (e.g. `/authors/OL2873756A`). The name lives at `GET /authors/{id}.json` → `data.name`. Build a small helper and call it after the book fetch.

**Cover URL construction**
Open Library returns an array of numeric cover IDs. The image URL pattern is:

```
https://covers.openlibrary.org/b/id/{id}-L.jpg
```

**Route handlers in Next.js App Router are plain Web API functions**
They accept a `Request` and return a `Response` — no framework wrappers. This makes them straightforward to test without a running server.

**Browser visits a URL with GET — that's always a 405 on a POST-only route**
When testing an API route, use curl, the DevTools console `fetch(...)`, or a GUI tool like Postman. Visiting the URL in a browser will always look broken.

---

## Session 3 — Vitest setup & tests

### What we did

- Installed **Vitest** and wired up `npm test`
- Configured `vitest.config.ts` to resolve the `@/` path alias (matching `tsconfig.json`)
- Wrote three tests for `POST /api/books`: valid ISBN, malformed body, unknown ISBN
- Mocked Prisma and `fetch` so tests run offline with no database

### Key learnings

**Route handlers are the easiest Next.js code to unit-test**
Because they are plain async functions (`Request → Response`), you call them directly:

```ts
const res = await POST(
  new Request("http://localhost/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isbn: "..." }),
  }),
);
```

No test server, no `supertest`, no Next.js internals needed.

**`vi.mock` is hoisted — mock before the module resolves**
Vitest hoists `vi.mock(...)` calls to the top of the file at transform time, so the mock is in place before the route module (and its Prisma import) is evaluated. This is why mocking the singleton works even though `lib/prisma.ts` is imported at module level.

**`vi.stubGlobal` for `fetch`**
Because `fetch` is a global in Node 18+, use `vi.stubGlobal('fetch', mockFn)` rather than `vi.spyOn`. Pair with `vi.resetAllMocks()` in `beforeEach` so stubs don't leak between tests.

**Vitest needs its own alias config**
`tsconfig.json` path aliases are not automatically picked up by Vitest. Duplicate the `@/` mapping in `vitest.config.ts`:

```ts
resolve: { alias: { "@": path.resolve(__dirname, ".") } }
```

**Commit hygiene: generated files belong in `.gitignore`**
`app/generated/prisma/` is regenerated by `prisma generate` and should not be committed (it was already excluded here). Same principle for `.next/`, `node_modules/`, etc.

---

## Session 4 — /books page redesign

### What we did

- Replaced the static stub with a live Server Component that fetches books from Prisma
- Built three components: `AddBookForm` (client), `BookCard` (presentational), and the page shell
- `AddBookForm` calls `POST /api/books`, shows a loading state, displays API error messages inline, and calls `router.refresh()` on success
- `BookCard` renders a cover image (with a lettered placeholder fallback), title, author, status badge, and page count
- All styling in plain CSS modules with dark-mode support via `prefers-color-scheme`
- Used plan mode to design the component structure before writing a single line of code

### Key learnings

**Plan mode before complex UI work**
For anything involving multiple new files and architectural decisions (Server vs Client Components, data-flow direction), entering plan mode first lets you settle the structure before touching code. The plan becomes a checklist you execute in order — much lower chance of backing yourself into a corner.

**Server Component + one Client Component is the right split for this pattern**
The page itself stays a Server Component (Prisma call, SSR), and only the interactive piece (`AddBookForm`) needs `"use client"`. Keeping the boundary as narrow as possible means the initial HTML is fully rendered on the server.

**`router.refresh()` is the idiomatic App Router way to re-sync after a mutation**
Instead of managing a local books-list in state and manually prepending new entries, call `router.refresh()` after a successful POST. Next.js re-runs the server component, re-fetches from the DB, and patches the UI — the client stays in sync with the real data with one line.

**Skip `next/image` for simple external images**
`<Image>` from `next/image` requires every external hostname to be listed in `next.config.ts` under `images.remotePatterns`. For a course project where you just want to display cover art, a plain `<img>` with `object-fit: cover` is simpler and avoids the config overhead.

**`/verify` skill for runtime confirmation**
After implementing, the `/verify` skill starts the dev server, drives the actual HTTP surface, and reports a structured PASS/FAIL with captured evidence. It caught that the "Adding…" loading state and inline error are client-side and can't be confirmed via curl — a useful reminder of what curl can and can't verify.

---

## Session 5 — GET /api/books/[id] & custom slash commands

### What we did

- Implemented `GET /api/books/[id]` — returns one book with its `ReadingSession` records included, 404 if not found
- Wrote 2 vitest tests: found (200 + sessions) and not found (404)
- Created `.claude/commands/add-route.md` — a custom slash command that runs a full checklist (create handler → validate with Zod → write tests → run tests → summarise)
- Restarted Claude Code to register the new command; it now appears as `/add-route` in autocomplete

### Key learnings

**Dynamic route segments in Next.js 16 use `RouteContext` and `await ctx.params`**
The `params` object in App Router route handlers is a Promise in Next.js 15+. You must `await` it:

```ts
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/books/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  // ...
}
```

Forgetting the `await` gives you a Promise object instead of the string id.

**Prisma `include` is how you fetch relations in one query**
To return a book with its sessions, pass `include` to `findUnique`:

```ts
prisma.book.findUnique({
  where: { id },
  include: { sessions: { orderBy: { date: "asc" } } },
});
```

No second query needed; the relation is defined in the schema.

**Custom slash commands live in `.claude/commands/`**
Create a Markdown file at `.claude/commands/<name>.md`. The file content becomes the prompt; `$ARGUMENTS` is replaced with whatever the user types after the command name. Commands are project-local (committed to the repo) and require a Claude Code restart to be discovered after first creation.

---

## Session 6 — GET /api/stats & the timezone trap

### What we did

- Implemented `GET /api/stats` returning four computed fields: `totalPagesRead`, `pagesPerDay`, `currentStreak`, and `booksFinished`
- Used `Intl.DateTimeFormat` via `toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })` to convert session timestamps to local calendar dates before streak math
- Pinned "today" with `vi.setSystemTime` in tests so the streak assertions don't drift as the calendar moves
- Wrote 4 vitest tests covering: correct values with data, all-zeros on empty DB, streak with a gap, and streak of 0 when today has no session

### Key learnings

**UTC date math silently breaks local-time streak calculations**

This is the core gotcha. A `DateTime` stored in Postgres is UTC. If you do streak math directly on those UTC values, a session logged at 10 pm Manila time (UTC+8) becomes `14:00 UTC` the same day — fine. But a session logged at 1 am Manila time is `17:00 UTC the previous day`. Without the timezone conversion, that session counts as "yesterday" even though the user experienced it as today, and the streak silently under-counts.

The fix is to convert every session date to the user's local calendar date _before_ any streak logic, not after:

```ts
function toManilaDate(date: Date): string {
  // en-CA locale produces YYYY-MM-DD — reliable for Set comparisons
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}
```

Put all those strings in a `Set<string>`, then walk backward from "today" (also expressed as a Manila date) counting consecutive hits. The UTC timestamps never touch the streak logic at all.

**The reviewer's instinct: spot the implicit assumption before the bug exists**

The dangerous moment is when you write `s.date >= thirtyDaysAgo` or group sessions by `.toISOString().slice(0, 10)` and it _looks_ right in tests because your CI server happens to be in UTC. The bug only surfaces at runtime for users in non-UTC timezones, late at night, on the day boundary. Asking "which timezone does this date math assume?" before the code ships is how you catch it. That question is worth adding to any code-review checklist that touches date comparisons, streak/run calculations, or "today" logic.

**`vi.useFakeTimers()` / `vi.setSystemTime` for deterministic date tests**

Streak tests that call `new Date()` internally will fail or give wrong results when the real clock ticks past midnight. Pin it:

```ts
vi.useFakeTimers();
vi.setSystemTime(new Date("2026-06-12T01:00:00Z")); // 09:00 Manila → "today" is June 12

// ... your assertions ...

vi.useRealTimers(); // or use afterEach to clean up
```

Without this, a test that passes at 11:58 pm can fail at 12:00 am with no code change.
