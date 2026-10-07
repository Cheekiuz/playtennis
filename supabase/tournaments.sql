-- Tournament discovery schema. Run in the Supabase SQL editor.
-- Public pages only show published rows. Service role used by the app bypasses RLS.

create table if not exists public.countries (
  code char(2) primary key,
  name_en text not null,
  name_lt text not null,
  region text not null check (region in ('baltics', 'europe', 'world')),
  priority smallint not null default 3,
  is_published boolean not null default true
);

create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  country_code char(2) references public.countries (code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text not null,
  country_code char(2) not null references public.countries (code),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('federation', 'itf', 'tennis_europe', 'national_federation', 'organizer', 'club', 'manual', 'import')),
  name text not null,
  url text,
  ingestion text not null default 'manual' check (ingestion in ('manual', 'csv', 'api', 'feed')),
  terms_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  organizer_id uuid references public.organizers (id),
  series_name text,
  tournament_type text not null default 'recreational' check (tournament_type in ('club', 'national', 'masters', 'recreational', 'other')),
  audience text not null default 'recreational' check (audience in ('recreational', 'masters', 'junior', 'professional')),
  country_code char(2) not null references public.countries (code),
  city text not null,
  venue_id uuid references public.venues (id),
  starts_on date not null,
  ends_on date not null,
  timezone text not null default 'Europe/Vilnius',
  registration_deadline date,
  registration_status text not null default 'unknown' check (registration_status in ('open', 'closed', 'unknown', 'not_required')),
  registration_url text,
  official_url text,
  source_id uuid not null references public.sources (id),
  source_url text not null,
  source_external_id text,
  surface text not null default 'hard' check (surface in ('clay', 'hard', 'grass', 'carpet', 'other')),
  environment text not null default 'outdoor' check (environment in ('indoor', 'outdoor', 'mixed')),
  contact_name text,
  contact_email text,
  contact_phone text,
  image_url text,
  prize_summary text,
  lifecycle_status text not null default 'upcoming' check (lifecycle_status in ('upcoming', 'registration_open', 'registration_closed', 'completed', 'cancelled', 'postponed')),
  verification_status text not null default 'needs_verification' check (verification_status in ('verified', 'needs_verification')),
  last_verified_at timestamptz,
  published boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tournaments_source_external_uidx
  on public.tournaments (source_id, source_external_id)
  where source_external_id is not null;

create index if not exists tournaments_starts_on_idx on public.tournaments (starts_on);
create index if not exists tournaments_country_idx on public.tournaments (country_code);
create index if not exists tournaments_listing_idx on public.tournaments (published, ends_on, audience);

create table if not exists public.tournament_categories (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  discipline text not null check (discipline in ('singles', 'doubles', 'mixed_doubles')),
  gender text not null check (gender in ('men', 'women', 'mixed', 'open')),
  age_min int,
  age_max int,
  age_label text,
  level text not null default 'recreational' check (level in ('recreational', 'club', 'competitive', 'national')),
  ranking_requirement text,
  entry_fee_amount numeric(10, 2),
  currency char(3),
  registration_deadline date,
  registration_status text check (registration_status in ('open', 'closed', 'unknown', 'not_required')),
  sort_order int not null default 0
);

create index if not exists tournament_categories_tournament_idx
  on public.tournament_categories (tournament_id);

create table if not exists public.tournament_translations (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  locale text not null check (locale in ('lt', 'en')),
  description text,
  seo_title text,
  seo_description text,
  primary key (tournament_id, locale)
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources (id),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  raw jsonb not null,
  normalized jsonb,
  tournament_id uuid references public.tournaments (id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.countries enable row level security;
alter table public.organizers enable row level security;
alter table public.venues enable row level security;
alter table public.sources enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_categories enable row level security;
alter table public.tournament_translations enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "public read countries" on public.countries;
create policy "public read countries" on public.countries
  for select to anon, authenticated using (is_published = true);

drop policy if exists "public read published tournaments" on public.tournaments;
create policy "public read published tournaments" on public.tournaments
  for select to anon, authenticated
  using (published = true and archived_at is null);

drop policy if exists "public read categories" on public.tournament_categories;
create policy "public read categories" on public.tournament_categories
  for select to anon, authenticated
  using (exists (
    select 1 from public.tournaments t
    where t.id = tournament_id and t.published = true and t.archived_at is null
  ));

drop policy if exists "public read translations" on public.tournament_translations;
create policy "public read translations" on public.tournament_translations
  for select to anon, authenticated
  using (exists (
    select 1 from public.tournaments t
    where t.id = tournament_id and t.published = true and t.archived_at is null
  ));

drop policy if exists "public read venues" on public.venues;
create policy "public read venues" on public.venues
  for select to anon, authenticated using (true);

drop policy if exists "public read organizers" on public.organizers;
create policy "public read organizers" on public.organizers
  for select to anon, authenticated using (true);

drop policy if exists "public read sources" on public.sources;
create policy "public read sources" on public.sources
  for select to anon, authenticated using (true);

insert into public.countries (code, name_en, name_lt, region, priority) values
  ('lt', 'Lithuania', 'Lietuva', 'baltics', 1),
  ('lv', 'Latvia', 'Latvija', 'baltics', 1),
  ('ee', 'Estonia', 'Estija', 'baltics', 1),
  ('pl', 'Poland', 'Lenkija', 'europe', 1),
  ('se', 'Sweden', 'Švedija', 'europe', 1),
  ('fi', 'Finland', 'Suomija', 'europe', 1),
  ('de', 'Germany', 'Vokietija', 'europe', 1),
  ('cz', 'Czech Republic', 'Čekija', 'europe', 1),
  ('es', 'Spain', 'Ispanija', 'europe', 1),
  ('it', 'Italy', 'Italija', 'europe', 1),
  ('fr', 'France', 'Prancūzija', 'europe', 1),
  ('hr', 'Croatia', 'Kroatija', 'europe', 2)
on conflict (code) do update set
  name_en = excluded.name_en,
  name_lt = excluded.name_lt,
  region = excluded.region,
  priority = excluded.priority;

insert into public.sources (id, kind, name, ingestion, terms_note)
values (
  '00000000-0000-4000-8000-000000000001',
  'manual',
  'Manual entry',
  'manual',
  'Entered by an admin from an official tournament page. Do not copy calendars whose terms forbid reuse.'
)
on conflict (id) do nothing;
