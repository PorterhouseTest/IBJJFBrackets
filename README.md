# Bracket Watch

Bracket Watch is a zero-login, zero-database scouting dashboard for one JiuJitsu.net target division:

`BLACK / Master 2 / Male / Light Feather`

It scans JiuJitsu.net registration data when you click `Run Scan Now`, tracks ranked target-division athletes who are registered elsewhere, and highlights changes compared with the previous scan stored in your browser.

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
- Deploys to Vercel without required services

## Environment Variables

```bash
JIUJITSU_BASE_URL=https://jiujitsu.net
MOCK_JIUJITSU=false
NEXT_PUBLIC_APP_URL=
```

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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

Run a manual scan from the dashboard to populate the browser-stored snapshot from fixtures.

## Manual Scan

The dashboard includes a `Run Scan Now` button. It performs a low-impact live scan and stores the latest result in browser local storage.

You can also call:

```bash
curl -X POST http://localhost:3000/api/live-scan
```

## Deploy To Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Deploy.

No database is required for the live dashboard.

## Troubleshooting JiuJitsu.net API Changes

All external responses are validated with Zod in `lib/jiujitsu.ts`. If an upstream route changes shape, the scan records a clear failure or partial failure instead of silently succeeding.

Check:

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
