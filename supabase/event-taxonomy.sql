-- Broaden public event types. Safe to run more than once.

alter table public.tournaments drop constraint if exists tournaments_event_type_check;

alter table public.tournaments
  add constraint tournaments_event_type_check
  check (event_type in ('TOURNAMENT', 'PLAY_SESSION', 'MATCH_DAY', 'SOCIAL', 'OTHER'));
