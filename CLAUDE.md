# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ShelfFlow

A reading productivity tracker. Track books, log reading sessions, see stats.

Also read AGENTS.md for up-to-date Next.js guidance.

## Architecture

- Next.js App Router with TypeScript
- API routes in `app/api/` (route handlers)
- Prisma ORM with Neon Postgres; schema in `prisma/schema.prisma`
- Plain CSS modules, no Tailwind

## Conventions

- Functional components only
- All API routes validate input with zod
- Every API route gets a vitest test (happy path + failure cases)
- Commit messages use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Never touch `.env` or expose its contents

## Commands

- Dev server: `npm run dev`
- Tests: `npm test`
- Migrations: `npx prisma migrate dev`
- DB browser: `npx prisma studio`
