# Bracket Watch

Bracket Watch is a private, low-frequency scouting dashboard for one JiuJitsu.net target division:

`BLACK / Master 2 / Male / Light Feather`

It scans upcoming JiuJitsu.net registration data once per day, stores exact division snapshots, tracks ranked target-division athletes who are registered elsewhere, and highlights changes since the previous successful scan.

## What It Tracks

- Upcoming competitions with someone registered in `BLACK / Master 2 / Male / Light Feather`
- Athletes in that exact division, including team, rating, rank, country, Instagram, and JiuJitsu.net profile links when available
- Changes since the last scan:
  - new or removed exact events
  - new or removed exact competitors
  - team changes
  - division changes
  - radar athlete additions/removals
- Radar athletes from `/api/top` for the target ranking query, even when their registration division is different

This is not a generic scraper dashboard. It is intentionally scoped to this personal watch profile.

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Prisma
- Postgres via `DATABASE_URL`
- Vercel Cron
- Optional Resend email alerts
- Simple password protection with `APP_PASSWORD`

## Environment Variables

```bash
DATABASE_URL=
APP_PASSWORD=
JIUJITSU_BASE_URL=https://jiujitsu.net
CRON_SECRET=
RESEND_API_KEY=
ALERT_EMAIL_TO=
ALERT_EMAIL_FROM=
MOCK_JIUJITSU=false
NEXT_PUBLIC_APP_URL=
SEND_NO_CHANGE_EMAIL=false
```

In development, if `APP_PASSWORD` is missing, login is allowed with a warning. In production, set `APP_PASSWORD`.

## Local Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Create Postgres

For local development, use any Postgres database and set `DATABASE_URL`, for example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bracket_watch?schema=public"
```

For Vercel, create a Vercel Postgres/Neon/Supabase database, copy the connection string into `DATABASE_URL`, then run migrations from your machine or CI:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Mock Mode

Use mock mode when developing the UI without hitting JiuJitsu.net:

```bash
MOCK_JIUJITSU=true npm run dev
```

The included fixtures contain:

- one exact event
- two exact competitors
- one radar athlete registered in `BLACK / Master 3 / Male / Rooster`
- one example change log fixture

Run a manual scan from `/settings` or the dashboard to populate the database from fixtures.

## Manual Scan

The dashboard and settings page include a `Run Scan Now` button. Manual scans require login and are rate-limited to once every 10 minutes.

You can also call:

```bash
curl -X POST http://localhost:3000/api/scans/run --cookie "bracket_watch_session=..."
```

## Vercel Cron

`vercel.json` schedules:

```json
{
  "path": "/api/cron/daily-scan",
  "schedule": "15 11 * * *"
}
```

Vercel cron schedules are UTC. 11:15 UTC is morning Eastern time, but this will shift relative to daylight savings.

Set `CRON_SECRET` and call the cron route with:

```http
Authorization: Bearer CRON_SECRET
```

Vercel Cron requests with `vercel-cron/1.0` user agent are also allowed.

## Deploy To Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add all required environment variables.
4. Provision Postgres and set `DATABASE_URL`.
5. Run:

```bash
npx prisma migrate deploy
npm run db:seed
```

6. Deploy.

## Troubleshooting JiuJitsu.net API Changes

All external responses are validated with Zod in `lib/jiujitsu.ts`. If an upstream route changes shape, the scan records a clear failure or partial failure instead of silently succeeding.

Check:

- `/changes` for `ERROR` entries
- latest scan `errorMessage`
- Vercel function logs
- response schemas in `lib/jiujitsu.ts`
- mock fixtures in `mock/`

The app uses a clear User-Agent and only calls the documented JSON routes needed for this target watch profile. It does not hit IBJJF directly, does not crawl the whole site, and should remain private and low-frequency.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
