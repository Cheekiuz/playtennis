# PlayTennis.lt

A smarter way to find tennis partners, organize matches, track results, and discover courts—all in one place.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (waitlist email storage)

## Waitlist setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in [`supabase/waitlist.sql`](supabase/waitlist.sql) in the Supabase SQL Editor
3. For **local dev**, either:
   - Run `npx vercel link` then `npx vercel env pull .env.local` (if using Vercel Supabase integration), or
   - Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SECRET_KEY` — secret key from Supabase (or `SUPABASE_SERVICE_ROLE_KEY` for legacy keys)
4. Add the same variables in **Vercel → Project → Settings → Environment Variables**, then redeploy

Signups appear in **Supabase → Table Editor → waitlist**.

## Events and federation ingest

1. In the Supabase SQL Editor, run (in order): `supabase/tournaments.sql`, `supabase/events.sql`, `supabase/event-submissions.sql`, `supabase/discovery.sql`.  
   Or, with a direct Postgres URL in `.env.local` (`POSTGRES_URL_NON_POOLING`), run `node scripts/apply-supabase-schema.mjs`.
2. On Vercel, set `INGEST_ENABLED=true` (and keep `CRON_SECRET` plus Supabase service keys). Redeploy after changing env vars.
3. Trigger a sync: GitHub Actions → **Ingest federation events** → Run workflow, or `POST /api/cron/ingest-events` with `Authorization: Bearer $CRON_SECRET`.

LT and LV federation calendars use Tournated public GraphQL. Registry-driven discovery (Facebook groups/pages, LT organizers, venues) runs when `DISCOVERY_ENABLED=true` via `POST /api/cron/discover-events` or the ingest cron when discovery is enabled.

Run `npx tsx scripts/discovery-test.ts` for a live adapter report. Apply `supabase/source-registry.sql` after the other event SQL files.

Set `FACEBOOK_ACCESS_TOKEN` for automatic group/page ingestion via Meta Graph API.

**Without a Meta developer account** (e.g. SMS verification fails): add public Facebook Event links to the source in Supabase, then run ingest. Example for [Tenisininkai](https://www.facebook.com/groups/119063918172498):

```sql
update public.sources
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'eventUrls',
  jsonb_build_array(
    'https://www.facebook.com/events/PASTE_EVENT_ID_HERE'
  )
)
where id = '00000000-0000-4000-8000-000000000020';
```

Copy each event link from the group in your browser (Share → copy link). Ingest reads public event page metadata; no API token required for those URLs. You can also use **Submit an event** on PlayTennis for one-off posts.

**Facebook event search**: source `00000000-0000-4000-8000-000000000024` runs several queries (`teniso turnyras`, `lauko tenis`, `tennis tournament`, …) with **no geo radius** when `FACEBOOK_ACCESS_TOKEN` is set. Table tennis / stalo tenis is filtered out. Optional metadata `searchUseGeo: true` plus `searchLat`, `searchLng`, `searchDistanceM` restores a local radius. Without a token, Facebook’s search HTML usually has no event IDs for server fetch; use manual `eventUrls` or a token.

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

```
src/
└── app/
    ├── layout.tsx    # Root layout and metadata
    ├── page.tsx      # Landing page
    └── globals.css   # Global styles
```

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account
2. Import the `Cheekiuz/playtennis` repository
3. Click **Deploy** — no extra configuration needed

## What's next

- User authentication
- Find players, book courts, track scores
