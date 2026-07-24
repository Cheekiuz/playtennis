-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

alter table public.waitlist enable row level security;
-- No public policies: all access goes through the server API route.
