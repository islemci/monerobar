# monero.bar

Live Monero network dashboard built with Next.js App Router, Upstash Redis, and React Query.

The UI is terminal-inspired and shows:

- Network stats: block height, difficulty, hashrate, last update timer
- Pool distribution: top 5 pools + aggregated `Other`
- Node health: status, ping, and height
- Footer actions: About popup, Donate popup, GitHub link

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- React Query (`@tanstack/react-query`)
- Redis (`ioredis`)
- Biome (lint/format)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
REDIS_URL="YOUR_REDIS_URL_HERE"
```

3. Run development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production server
npm run lint     # biome check
npm run format   # biome format --write
```