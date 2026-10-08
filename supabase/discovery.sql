-- Worldwide event discovery. Additive and safe to run more than once.
-- Does not insert events. Test records stay out of this database.

alter table public.tournaments
  add column if not exists region text,
  add column if not exists original_level text,
  add column if not exists standardised_level text,
  add column if not exists price_amount numeric(12, 2),
  add column if not exists price_currency char(3),
  add column if not exists source_confidence text,
  add column if not exists review_status text not null default 'unknown',
  add column if not exists quality_score smallint,
  add column if not exists is_test boolean not null default false,
  add column if not exists age_group text,
  add column if not exists event_gender text;

comment on column public.tournaments.timezone is
  'IANA timezone of the event city. New events must set this explicitly.';

comment on column public.tournaments.original_level is
  'Level wording from the source. Do not replace it with a conversion.';

comment on column public.tournaments.standardised_level is
  'Set only when the original wording maps confidently. Otherwise null.';

comment on column public.tournaments.is_test is
  'QA rows. Public upcoming search must exclude these.';

alter table public.tournaments alter column timezone drop default;

alter table public.tournaments drop constraint if exists tournaments_event_type_check;
alter table public.tournaments
  add constraint tournaments_event_type_check
  check (event_type in ('TOURNAMENT', 'PLAY_SESSION', 'MATCH_DAY', 'SOCIAL', 'CLUB_COMPETITION', 'OTHER'));

alter table public.tournaments drop constraint if exists tournaments_surface_check;
alter table public.tournaments
  add constraint tournaments_surface_check
  check (surface in ('clay', 'hard', 'grass', 'carpet', 'other', 'unknown'));

alter table public.tournaments drop constraint if exists tournaments_standardised_level_check;
alter table public.tournaments
  add constraint tournaments_standardised_level_check
  check (standardised_level is null or standardised_level in ('beginner', 'intermediate', 'advanced', 'open'));

alter table public.tournaments drop constraint if exists tournaments_source_confidence_check;
alter table public.tournaments
  add constraint tournaments_source_confidence_check
  check (source_confidence is null or source_confidence in ('high', 'medium', 'low'));

alter table public.tournaments drop constraint if exists tournaments_review_status_check;
alter table public.tournaments
  add constraint tournaments_review_status_check
  check (review_status in ('verified', 'checked', 'needs_review', 'conflicting', 'expired', 'unknown'));

alter table public.tournaments drop constraint if exists tournaments_event_gender_check;
alter table public.tournaments
  add constraint tournaments_event_gender_check
  check (event_gender is null or event_gender in ('open', 'men', 'women', 'mixed', 'boys', 'girls'));

alter table public.tournaments drop constraint if exists tournaments_quality_score_check;
alter table public.tournaments
  add constraint tournaments_quality_score_check
  check (quality_score is null or (quality_score >= 0 and quality_score <= 100));

alter table public.tournament_categories drop constraint if exists tournament_categories_gender_check;
alter table public.tournament_categories
  add constraint tournament_categories_gender_check
  check (gender in ('men', 'women', 'mixed', 'open', 'boys', 'girls'));

alter table public.countries drop constraint if exists countries_region_check;
alter table public.countries
  add constraint countries_region_check
  check (region in ('baltics', 'europe', 'north_america', 'south_america', 'asia', 'oceania', 'africa', 'world'));

create index if not exists tournaments_place_idx
  on public.tournaments (country_code, city, starts_on)
  where published = true and archived_at is null and is_test = false;

-- Source catalog. country_code is not a foreign key so a source can be recorded
-- before that country has events. The older kind column stays in place.
alter table public.sources
  add column if not exists source_type text,
  add column if not exists country_code char(2),
  add column if not exists trust_level text,
  add column if not exists last_checked timestamptz,
  add column if not exists active boolean not null default true;

alter table public.sources drop constraint if exists sources_source_type_check;
alter table public.sources
  add constraint sources_source_type_check
  check (
    source_type is null or source_type in (
      'federation',
      'tournament_organiser',
      'club',
      'tennis_centre',
      'tournament_platform',
      'public_calendar',
      'social_media',
      'user_submission',
      'other'
    )
  );

alter table public.sources drop constraint if exists sources_trust_level_check;
alter table public.sources
  add constraint sources_trust_level_check
  check (trust_level is null or trust_level in ('high', 'medium', 'low'));

alter table public.event_sources
  add column if not exists source_id uuid references public.sources (id),
  add column if not exists source_confidence text,
  add column if not exists field_snapshot jsonb,
  add column if not exists review_note text;

alter table public.event_sources drop constraint if exists event_sources_source_confidence_check;
alter table public.event_sources
  add constraint event_sources_source_confidence_check
  check (source_confidence is null or source_confidence in ('high', 'medium', 'low'));

create table if not exists public.event_conflicts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments (id) on delete cascade,
  field_name text not null,
  preferred_value text,
  other_value text,
  preferred_source_url text,
  other_source_url text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint event_conflicts_status_check check (status in ('open', 'resolved'))
);

create index if not exists event_conflicts_tournament_idx
  on public.event_conflicts (tournament_id)
  where status = 'open';

alter table public.event_submissions
  add column if not exists review_status text not null default 'pending',
  add column if not exists source_type text not null default 'user_submission',
  add column if not exists source_confidence text not null default 'low',
  add column if not exists submitted_at timestamptz;

update public.event_submissions
set submitted_at = created_at
where submitted_at is null;

alter table public.event_submissions
  alter column submitted_at set default now();

alter table public.event_submissions drop constraint if exists event_submissions_status_check;
alter table public.event_submissions
  add constraint event_submissions_status_check
  check (status in ('pending', 'reviewed', 'rejected', 'approved', 'needs_information'));

alter table public.event_submissions drop constraint if exists event_submissions_review_status_check;
alter table public.event_submissions
  add constraint event_submissions_review_status_check
  check (review_status in ('pending', 'approved', 'rejected', 'needs_information'));

alter table public.event_submissions drop constraint if exists event_submissions_source_confidence_check;
alter table public.event_submissions
  add constraint event_submissions_source_confidence_check
  check (source_confidence in ('high', 'medium', 'low'));

alter table public.event_submissions drop constraint if exists event_submissions_type_check;
alter table public.event_submissions
  add constraint event_submissions_type_check
  check (event_type in ('TOURNAMENT', 'PLAY_SESSION', 'MATCH_DAY', 'SOCIAL', 'CLUB_COMPETITION', 'OTHER'));
