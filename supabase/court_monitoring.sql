-- Run in Supabase SQL Editor (after court_alerts.sql)
-- Safe to re-run: uses IF NOT EXISTS

create table if not exists public.court_availability_snapshots (
  id uuid primary key default gen_random_uuid(),
  club text not null,
  court_id text not null,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status text not null check (status in ('available', 'booked', 'for_sale')),
  fetched_at timestamptz not null default now(),
  unique (club, court_id, slot_start)
);

create index if not exists court_availability_snapshots_club_date_idx
  on public.court_availability_snapshots (club, slot_start);

create table if not exists public.court_alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.court_alerts (id) on delete cascade,
  court_id text not null,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  slot_status text not null,
  notified_at timestamptz not null default now(),
  unique (alert_id, court_id, slot_start)
);

create index if not exists court_alert_events_alert_id_idx on public.court_alert_events (alert_id);

alter table public.court_availability_snapshots enable row level security;
alter table public.court_alert_events enable row level security;
