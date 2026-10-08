-- Additive event fields. Safe to run more than once.
-- Existing tournament rows stay. Nothing is dropped or rewritten in place
-- except backfills that only fill columns that are still null.

alter table public.tournaments
  add column if not exists event_type text,
  add column if not exists event_format text,
  add column if not exists duration_type text,
  add column if not exists play_audience text,
  add column if not exists public_registration text,
  add column if not exists registration_method text,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists price_label text,
  add column if not exists play_level text,
  add column if not exists original_source_url text,
  add column if not exists source_kind text,
  add column if not exists discovered_at timestamptz,
  add column if not exists dedupe_key text;

update public.tournaments
set event_type = 'TOURNAMENT'
where event_type is null;

update public.tournaments
set event_format = 'MULTIPLE'
where event_format is null;

update public.tournaments
set duration_type = case
  when ends_on = starts_on then 'ONE_DAY'
  when ends_on <= starts_on + 2 then 'WEEKEND'
  else 'ONGOING'
end
where duration_type is null;

update public.tournaments
set play_audience = case audience
  when 'junior' then 'JUNIORS'
  when 'professional' then 'PROFESSION_SPECIFIC'
  else 'OPEN_AMATEURS'
end
where play_audience is null;

update public.tournaments
set public_registration = case registration_status
  when 'open' then 'OPEN'
  when 'not_required' then 'OPEN'
  when 'closed' then 'CLOSED'
  else 'UNKNOWN'
end
where public_registration is null;

update public.tournaments
set source_kind = 'ORGANISER_WEBSITE'
where source_kind is null;

update public.tournaments
set discovered_at = coalesce(created_at, now())
where discovered_at is null;

alter table public.tournaments
  alter column event_type set default 'TOURNAMENT',
  alter column event_format set default 'MULTIPLE',
  alter column duration_type set default 'ONE_DAY',
  alter column play_audience set default 'OPEN_AMATEURS',
  alter column public_registration set default 'UNKNOWN',
  alter column source_kind set default 'ORGANISER_WEBSITE',
  alter column discovered_at set default now();

alter table public.tournaments
  alter column event_type set not null,
  alter column event_format set not null,
  alter column duration_type set not null,
  alter column play_audience set not null,
  alter column public_registration set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tournaments_event_type_check') then
    alter table public.tournaments
      add constraint tournaments_event_type_check
      check (event_type in ('TOURNAMENT', 'PLAY_SESSION'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_event_format_check') then
    alter table public.tournaments
      add constraint tournaments_event_format_check
      check (event_format in ('SINGLES', 'MEN_DOUBLES', 'WOMEN_DOUBLES', 'MIXED_DOUBLES', 'MULTIPLE'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_duration_type_check') then
    alter table public.tournaments
      add constraint tournaments_duration_type_check
      check (duration_type in ('ONE_DAY', 'WEEKEND', 'ONGOING', 'LEAGUE'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_play_audience_check') then
    alter table public.tournaments
      add constraint tournaments_play_audience_check
      check (play_audience in ('OPEN_AMATEURS', 'CLUB_MEMBERS', 'INVITATION_ONLY', 'COMPANY', 'PROFESSION_SPECIFIC', 'JUNIORS'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_public_registration_check') then
    alter table public.tournaments
      add constraint tournaments_public_registration_check
      check (public_registration in ('OPEN', 'NOT_STARTED', 'CLOSED', 'FULL', 'INVITATION_ONLY', 'UNKNOWN'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_registration_method_check') then
    alter table public.tournaments
      add constraint tournaments_registration_method_check
      check (registration_method is null or registration_method in ('WEBSITE', 'EXTERNAL_FORM', 'EMAIL', 'PHONE', 'FACEBOOK', 'OTHER'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_play_level_check') then
    alter table public.tournaments
      add constraint tournaments_play_level_check
      check (play_level is null or play_level in ('LIGHT', 'MIDDLE', 'ADVANCED', 'NTRP', 'OTHER'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tournaments_source_kind_check') then
    alter table public.tournaments
      add constraint tournaments_source_kind_check
      check (source_kind in ('ORGANISER_WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'AGGREGATOR', 'MUNICIPALITY', 'VENUE', 'OTHER'));
  end if;
end $$;

create unique index if not exists tournaments_dedupe_key_uidx
  on public.tournaments (dedupe_key)
  where dedupe_key is not null and archived_at is null;

create index if not exists tournaments_public_feed_idx
  on public.tournaments (starts_on)
  where published = true
    and archived_at is null
    and play_audience = 'OPEN_AMATEURS'
    and public_registration in ('OPEN', 'NOT_STARTED')
    and duration_type in ('ONE_DAY', 'WEEKEND');

-- Every place an event was seen. The row on tournaments is the source shown to players.
create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  source_kind text not null check (source_kind in ('ORGANISER_WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'AGGREGATOR', 'MUNICIPALITY', 'VENUE', 'OTHER')),
  source_name text,
  source_url text not null,
  is_primary boolean not null default false,
  discovered_at timestamptz not null default now(),
  unique (tournament_id, source_url)
);

create index if not exists event_sources_tournament_idx
  on public.event_sources (tournament_id);
