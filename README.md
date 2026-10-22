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

## Tournament catalog (Lithuania / Baltics / ITF)

Public browse sections (upcoming and past):

- `/lithuania` (LT: ` /lt/lietuva`) — Lithuania amateur events
- `/baltics` (LT: `/lt/baltija`) — Latvia + Estonia only
- `/itf` — ITF World Tennis Masters Tour calendar

### Schema

In the Supabase SQL Editor, run in order: `tournaments.sql`, `events.sql`, `event-submissions.sql`, `discovery.sql`, `source-registry.sql`, **`catalog-sections.sql`**.  
Or, with `POSTGRES_URL_NON_POOLING` in `.env.local`, run `node scripts/apply-supabase-schema.mjs`.

`catalog-sections.sql` adds `catalog_section`, `is_closed`, `itf_category`, and `ingest_runs`.

### Ingest

1. On Vercel, set `INGEST_ENABLED=true` and/or `INGEST_ITF_ENABLED=true` (plus `CRON_SECRET` and Supabase service keys). Redeploy after changing env vars.
2. Trigger sync:
   - GitHub Actions → **Ingest federation events** or **Ingest ITF Masters calendar**
   - `POST /api/cron/ingest-events` or `POST /api/cron/ingest-itf` with `Authorization: Bearer $CRON_SECRET`

**ITF:** uses the public calendar JSON at `itftennis.com` with `circuitCode=VT` (Masters Tour, not Men’s World Tennis Tour `MT`). Closed and cancelled events are skipped. Always attribute and link back to ITF.

**Facebook:** Meta Groups API access is not available for normal apps. MVP path is admin-pasted public event URLs (see below). Do not rely on unrestricted Graph API group event listing.

**TenisoNamai / LT sites:** registry discovery when `DISCOVERY_ENABLED=true`. Prefer one-day tournaments for the Lithuania section.

### Facebook event URLs (no Graph token required)

Admin: sign in → **Facebook paste** (`/admin/facebook`), paste one event URL per line, save and ingest.

Or SQL for [Tenisininkai](https://www.facebook.com/groups/tenisininkai):

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

Copy each event link from the group (Share → copy link). Ingest reads public event page metadata.

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
