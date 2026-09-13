# Design Gallery

AI-generated sample website designs, browsable and mixable into a custom layout blueprint you
can export as clean HTML.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Drizzle ORM + Neon Postgres, Anthropic SDK
(server-side only), Vercel Cron for the daily generation job.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Neon Postgres connection string
   - `ANTHROPIC_API_KEY` — used only in the cron route, never exposed to the client
   - `APP_PASSWORD` — shared password gating the whole app (required before deploying anywhere
     reachable by others; leave unset for local-only dev)
   - `CRON_SECRET` — required for the `/api/cron/generate-designs` route to accept requests. When
     set as an env var on Vercel under this exact name, Vercel auto-injects it as the cron
     request's `Authorization` header.
3. Push the schema to your database: `npm run db:push` (or `npm run db:generate` +
   `npm run db:migrate` if you prefer tracked migration files — one has already been generated
   under `drizzle/migrations`).
4. `npm run dev`

## Triggering a generation run manually

The cron route is a plain `GET` endpoint, so you can trigger it yourself while developing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/generate-designs
```

This calls Claude `DESIGNS_PER_RUN` times (default 5), validates + safety-checks each design,
and inserts the successful ones. Nothing shows up in the feed until this has run at least once.

## Deploying

Deploy to Vercel as usual. `vercel.json` already declares the daily cron
(`0 6 * * *` — 6am UTC, adjust as needed). Set all four env vars above in the Vercel project
settings before the first deploy.
