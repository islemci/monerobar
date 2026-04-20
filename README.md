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
- Upstash Redis (`@upstash/redis`)
- Biome (lint/format)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
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

## Redis Data Contract

The app reads the Redis key `monero:stats` and expects this shape:

```json
{
	"network": {
		"height": 3656819,
		"hashrate": 5485501589,
		"difficulty": 658260190619
	},
	"nodes": [
		{
			"name": "SethForPrivacy",
			"url": "https://node.sethforprivacy.com/get_info",
			"status": "online",
			"pingMs": 447,
			"height": 3656819,
			"difficulty": 658260190619
		}
	],
	"pools": [
		{
			"name": "SupportXMR",
			"homeUrl": "https://www.supportxmr.com",
			"apiUrl": "https://www.supportxmr.com/api/pool/stats",
			"hashrate": 1802905895,
			"status": "online"
		}
	],
	"updatedAt": 1776720279316
}
```

## Data Flow

1. Server action (`src/actions/get-network-stats.ts`) reads `monero:stats` from Upstash Redis.
2. API route (`src/app/api/status/route.ts`) exposes data to the client with no-store cache headers.
3. React Query hook (`src/hooks/use-network-data.ts`) polls every 10 seconds.
4. Dashboard (`src/components/monero-dashboard.tsx`) renders sections and client-side UI state.

## UI Notes

- Pool names link to `homeUrl` and display an arrow icon.
- Pool link text and arrow share the same color in normal and hover states.
- Hover underline applies to linked pool names/icons.
- Layout is responsive for desktop and mobile.
- Favicon is served as `/favicon.png`.

## Project Structure

```text
src/
	actions/              # server actions (Upstash Redis fetch)
	app/                  # Next.js app router pages/layout/api
	components/           # dashboard, footer, providers, tui container
	hooks/                # React Query hooks
	types/                # shared TypeScript types
public/
	favicon.png
	info.svg
	link.svg
```

## Notes

- If Redis is unavailable or key data is invalid, the UI shows:
	`[!] SYSTEM_OFFLINE: UNABLE TO REACH AGGREGATOR.`
- `last update` is rendered as a local ticking timer in the dashboard UI.