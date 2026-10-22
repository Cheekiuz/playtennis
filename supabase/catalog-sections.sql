-- Catalog sections for Lithuania / Baltics / ITF browse views.
-- Safe to run more than once.

alter table public.tournaments
  add column if not exists catalog_section text,
  add column if not exists itf_category text,
  add column if not exists is_closed boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tournaments_catalog_section_check') then
    alter table public.tournaments
      add constraint tournaments_catalog_section_check
      check (catalog_section is null or catalog_section in ('lithuania', 'baltics', 'itf'));
  end if;
end $$;

create index if not exists tournaments_catalog_section_listing_idx
  on public.tournaments (catalog_section, published, ends_on)
  where archived_at is null and catalog_section is not null;

create index if not exists tournaments_catalog_section_starts_idx
  on public.tournaments (catalog_section, starts_on)
  where archived_at is null and catalog_section is not null;

-- Backfill from country when section is still unset.
update public.tournaments
set catalog_section = 'lithuania'
where catalog_section is null
  and lower(country_code) = 'lt';

update public.tournaments
set catalog_section = 'baltics'
where catalog_section is null
  and lower(country_code) in ('lv', 'ee');

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'failed')),
  fetched int not null default 0,
  upserted int not null default 0,
  skipped int not null default 0,
  error text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists ingest_runs_started_idx
  on public.ingest_runs (started_at desc);

alter table public.ingest_runs enable row level security;

drop policy if exists "public read ingest_runs" on public.ingest_runs;
-- No anon/authenticated read policy: admin/service role only.

insert into public.countries (code, name_en, name_lt, region, priority, is_published)
values ('xx', 'International', 'Tarptautinis', 'world', 9, true)
on conflict (code) do nothing;

insert into public.sources (id, kind, name, url, ingestion, terms_note)
values (
  '00000000-0000-4000-8000-000000000050',
  'itf',
  'ITF World Tennis Masters Tour calendar',
  'https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/',
  'api',
  'Unofficial first-party calendar JSON used by itftennis.com. Attribute and link back. Subject to change.'
)
on conflict (id) do update
set
  name = excluded.name,
  url = excluded.url,
  ingestion = excluded.ingestion,
  terms_note = excluded.terms_note;
