-- Player-submitted events. Reviewed before they are published.
-- Safe to run more than once.

create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_type text not null,
  organiser text,
  starts_on date not null,
  ends_on date,
  location text,
  city text not null,
  official_url text not null,
  registration_url text,
  surface text,
  environment text,
  play_level text,
  notes text,
  submitter_name text not null,
  submitter_email text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint event_submissions_status_check check (status in ('pending', 'reviewed', 'rejected')),
  constraint event_submissions_type_check check (event_type in ('TOURNAMENT', 'PLAY_SESSION', 'MATCH_DAY', 'SOCIAL', 'CLUB_COMPETITION', 'OTHER'))
);

alter table public.event_submissions enable row level security;

create index if not exists event_submissions_created_idx
  on public.event_submissions (created_at desc);
