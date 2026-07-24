# PlayTennis.it

A smarter way to find tennis partners, organize matches, track results, and discover courts—all in one place.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

## Tech stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**

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
- Database (Prisma + PostgreSQL)
- Find players, book courts, track scores
