-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

create table public.court_alerts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  city text not null,
  club text not null,
  alert_date date not null,
  time_start time not null,
  time_end time not null,
  court text not null default 'any',
  notify_push boolean not null default false,
  notify_email boolean not null default false,
  email text,
  status text not null default 'active'
    check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create index court_alerts_client_id_idx on public.court_alerts (client_id);

alter table public.court_alerts enable row level security;
-- No public policies: all access goes through the server API route.
