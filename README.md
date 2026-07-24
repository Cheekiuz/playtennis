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
