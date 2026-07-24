#!/usr/bin/env bash
# Pull non-secret env vars from Vercel, then add your Supabase secret key manually.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Linking to Vercel (if needed)..."
npx vercel link --yes 2>/dev/null || true

echo "Pulling production env vars..."
npx vercel env pull .env.local --environment=production --yes

echo ""
echo "IMPORTANT: Vercel redacts secret keys locally as [SENSITIVE]."
echo "Open Supabase → Settings → API → Secret keys → reveal & copy."
echo "Then edit .env.local and set:"
echo "  SUPABASE_SECRET_KEY=sb_secret_your-real-key"
echo ""
echo "Also run supabase/waitlist.sql in Supabase SQL Editor if you haven't yet."
