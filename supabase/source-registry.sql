-- Extensible tournament source registry. Safe to run more than once.

alter table public.sources
  add column if not exists facebook_url text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists priority smallint not null default 50,
  add column if not exists scraping_method text,
  add column if not exists last_successful_scrape timestamptz,
  add column if not exists registry_source_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists scrape_interval_hours smallint not null default 24;

alter table public.tournaments
  add column if not exists discovery_stage text;

alter table public.tournaments drop constraint if exists tournaments_discovery_stage_check;
alter table public.tournaments
  add constraint tournaments_discovery_stage_check
  check (
    discovery_stage is null or discovery_stage in (
      'DISCOVERED',
      'PARSED',
      'DEDUPLICATED',
      'VALIDATED',
      'PUBLISHED'
    )
  );

alter table public.sources drop constraint if exists sources_registry_source_type_check;
alter table public.sources
  add constraint sources_registry_source_type_check
  check (
    registry_source_type is null or registry_source_type in (
      'ORGANIZER_WEBSITE',
      'TOURNAMENT_PLATFORM',
      'OFFICIAL_FEDERATION',
      'CLUB',
      'VENUE',
      'FACEBOOK_PAGE',
      'FACEBOOK_GROUP',
      'FACEBOOK_EVENT',
      'FACEBOOK_POST',
      'OTHER'
    )
  );

comment on column public.sources.registry_source_type is
  'Discovery taxonomy (Facebook page/group, venue, federation). Distinct from legacy source_type.';

comment on column public.sources.scraping_method is
  'Adapter key: tournated_graphql, facebook_graph, http_site, wordpress_events, manual.';

-- Federation feeds (Tournated public GraphQL).
insert into public.sources (
  id, kind, name, url, ingestion, source_type, registry_source_type, country_code, trust_level,
  active, priority, scraping_method, metadata, terms_note
)
values
  (
    '00000000-0000-4000-8000-000000000010',
    'import',
    'Lietuvos teniso sąjunga (play.tennis.lt)',
    'https://play.tennis.lt/tournaments',
    'feed',
    'federation',
    'OFFICIAL_FEDERATION',
    'LT',
    'high',
    true,
    95,
    'tournated_graphql',
    '{"platform":"lt"}'::jsonb,
    'Official LTS calendar via Tournated.'
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'import',
    'Latvijas Tenisa Savienība (play.teniss.lat)',
    'https://play.teniss.lat/tournaments',
    'feed',
    'federation',
    'OFFICIAL_FEDERATION',
    'LV',
    'high',
    true,
    90,
    'tournated_graphql',
    '{"platform":"lv"}'::jsonb,
    'Official LTS LV calendar via Tournated.'
  )
on conflict (id) do update set
  name = excluded.name,
  url = excluded.url,
  scraping_method = excluded.scraping_method,
  registry_source_type = excluded.registry_source_type,
  priority = excluded.priority,
  active = excluded.active,
  metadata = excluded.metadata;

-- Lithuania ecosystem sources (URLs are entry points; adapters resolve page/group ids from metadata when needed).
insert into public.sources (
  id, kind, name, url, ingestion, source_type, registry_source_type, country_code, city, trust_level,
  active, priority, scraping_method, facebook_url, metadata, terms_note
)
values
  (
    '00000000-0000-4000-8000-000000000020',
    'import',
    'Tenisininkai',
    'https://www.facebook.com/groups/tenisininkai',
    'feed',
    'social_media',
    'FACEBOOK_GROUP',
    'LT',
    null,
    'medium',
    true,
    90,
    'facebook_graph',
    'https://www.facebook.com/groups/tenisininkai',
    '{"slug":"tenisininkai"}'::jsonb,
    'Facebook group: adult amateur tennis community.'
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'import',
    'TENISO TURNYRAI',
    'https://www.facebook.com/groups/tenisoturnyrai',
    'feed',
    'social_media',
    'FACEBOOK_GROUP',
    'LT',
    null,
    'medium',
    true,
    90,
    'facebook_graph',
    'https://www.facebook.com/groups/tenisoturnyrai',
    '{"slug":"tenisoturnyrai"}'::jsonb,
    'Facebook group: tournament announcements.'
  ),
  (
    '00000000-0000-4000-8000-000000000022',
    'import',
    'Lietuvos teniso mėgėjų čempionatas',
    'https://www.facebook.com/LTAmateurTennisChampionship',
    'feed',
    'social_media',
    'FACEBOOK_PAGE',
    'LT',
    null,
    'high',
    true,
    85,
    'facebook_graph',
    'https://www.facebook.com/LTAmateurTennisChampionship',
    '{}'::jsonb,
    'Facebook page: national amateur championship.'
  ),
  (
    '00000000-0000-4000-8000-000000000023',
    'import',
    'Lauko tenisas Elektrėnuose',
    'https://www.facebook.com/laukoteniselektrenuose',
    'feed',
    'social_media',
    'FACEBOOK_PAGE',
    'LT',
    'Elektrėnai',
    'medium',
    true,
    70,
    'facebook_graph',
    'https://www.facebook.com/laukoteniselektrenuose',
    '{}'::jsonb,
    'Local outdoor tennis community.'
  ),
  (
    '00000000-0000-4000-8000-000000000030',
    'import',
    'TenisoNamai',
    'https://tenisonamai.lt',
    'feed',
    'tournament_organiser',
    'ORGANIZER_WEBSITE',
    'LT',
    null,
    'high',
    true,
    80,
    'http_site',
    null,
    '{"eventsPath":"/"}'::jsonb,
    'Organizer website.'
  ),
  (
    '00000000-0000-4000-8000-000000000031',
    'import',
    'Topspin',
    'https://topspin.lt',
    'feed',
    'tournament_organiser',
    'ORGANIZER_WEBSITE',
    'LT',
    null,
    'high',
    true,
    80,
    'http_site',
    null,
    '{}'::jsonb,
    'Organizer / academy.'
  ),
  (
    '00000000-0000-4000-8000-000000000032',
    'import',
    'iMatch',
    'https://imatch.lt',
    'feed',
    'tournament_platform',
    'TOURNAMENT_PLATFORM',
    'LT',
    null,
    'high',
    true,
    80,
    'http_site',
    null,
    '{}'::jsonb,
    'Tournament platform.'
  ),
  (
    '00000000-0000-4000-8000-000000000033',
    'import',
    'TennisPassion',
    'https://tennispassion.lt',
    'feed',
    'tournament_organiser',
    'ORGANIZER_WEBSITE',
    'LT',
    null,
    'medium',
    true,
    75,
    'http_site',
    null,
    '{}'::jsonb,
    'Organizer.'
  ),
  (
    '00000000-0000-4000-8000-000000000034',
    'import',
    'TenisoTurnyrai.com',
    'https://tenisoturnyrai.com',
    'feed',
    'tournament_platform',
    'TOURNAMENT_PLATFORM',
    'LT',
    null,
    'high',
    true,
    85,
    'http_site',
    null,
    '{}'::jsonb,
    'Tournament listings.'
  ),
  (
    '00000000-0000-4000-8000-000000000035',
    'import',
    'TenisoTuras',
    'https://tenisoturas.lt',
    'feed',
    'tournament_organiser',
    'ORGANIZER_WEBSITE',
    'LT',
    null,
    'medium',
    true,
    70,
    'http_site',
    null,
    '{}'::jsonb,
    'Tour / league organiser.'
  ),
  (
    '00000000-0000-4000-8000-000000000036',
    'import',
    'Teniso Piramidė',
    'https://tenisopyramide.lt',
    'feed',
    'tournament_organiser',
    'ORGANIZER_WEBSITE',
    'LT',
    null,
    'medium',
    true,
    70,
    'http_site',
    null,
    '{}'::jsonb,
    'Pyramid league.'
  ),
  (
    '00000000-0000-4000-8000-000000000037',
    'import',
    'Nidos Setas',
    'https://nidossetas.lt',
    'feed',
    'club',
    'CLUB',
    'LT',
    'Nida',
    'medium',
    true,
    65,
    'http_site',
    null,
    '{}'::jsonb,
    'Club Nida.'
  ),
  (
    '00000000-0000-4000-8000-000000000038',
    'import',
    'Club Dubingiai',
    'https://clubdubingiai.lt',
    'feed',
    'club',
    'CLUB',
    'LT',
    'Dubingiai',
    'medium',
    true,
    65,
    'http_site',
    null,
    '{}'::jsonb,
    'Club Dubingiai.'
  ),
  (
    '00000000-0000-4000-8000-000000000039',
    'import',
    'Widen Arena',
    'https://widenarena.lt',
    'feed',
    'tennis_centre',
    'VENUE',
    'LT',
    'Vilnius',
    'medium',
    true,
    75,
    'http_site',
    null,
    '{}'::jsonb,
    'Venue (host, not always organiser).'
  ),
  (
    '00000000-0000-4000-8000-00000000003a',
    'import',
    'SEB Arena',
    'https://sebarena.lt',
    'feed',
    'tennis_centre',
    'VENUE',
    'LT',
    'Vilnius',
    'medium',
    true,
    75,
    'http_site',
    null,
    '{}'::jsonb,
    'Venue calendar.'
  ),
  (
    '00000000-0000-4000-8000-00000000003b',
    'import',
    'Tennis Space',
    'https://tennisspace.lt',
    'feed',
    'tennis_centre',
    'VENUE',
    'LT',
    null,
    'medium',
    true,
    70,
    'http_site',
    null,
    '{}'::jsonb,
    'Academy / venue.'
  ),
  (
    '00000000-0000-4000-8000-00000000003c',
    'import',
    'Teniso Erdvė',
    'https://tenisoerdve.lt',
    'feed',
    'tennis_centre',
    'VENUE',
    'LT',
    null,
    'medium',
    true,
    70,
    'http_site',
    null,
    '{}'::jsonb,
    'Venue.'
  ),
  (
    '00000000-0000-4000-8000-00000000003d',
    'import',
    'Tennis Star',
    'https://tennisstar.lt',
    'feed',
    'club',
    'CLUB',
    'LT',
    null,
    'medium',
    true,
    65,
    'http_site',
    null,
    '{}'::jsonb,
    'Club / academy.'
  )
on conflict (id) do update set
  name = excluded.name,
  url = excluded.url,
  facebook_url = excluded.facebook_url,
  registry_source_type = excluded.registry_source_type,
  scraping_method = excluded.scraping_method,
  priority = excluded.priority,
  active = excluded.active,
  metadata = excluded.metadata,
  city = excluded.city,
  country_code = excluded.country_code;
