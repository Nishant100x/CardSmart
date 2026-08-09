-- CardSmart versioned catalogue, offer and monitoring schema.
-- Safe to re-run. Does not modify public.cards, which remains the user wallet.

create extension if not exists pgcrypto;

create table if not exists public.card_catalog (
  id text primary key,
  issuer text not null,
  name text not null,
  variant text,
  network text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'discontinued')),
  image_url text,
  application_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_versions (
  id uuid primary key default gen_random_uuid(),
  card_id text not null references public.card_catalog(id) on delete cascade,
  version_no integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  effective_from timestamptz,
  effective_to timestamptz,
  reward_model jsonb not null default '{}'::jsonb,
  fees jsonb not null default '{}'::jsonb,
  eligibility jsonb not null default '{}'::jsonb,
  benefits jsonb not null default '{}'::jsonb,
  terms_and_conditions jsonb not null default '{}'::jsonb,
  source_urls text[] not null default '{}',
  change_summary text,
  source_checked_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(card_id, version_no)
);

create unique index if not exists card_versions_one_published_version_idx
  on public.card_versions(card_id) where status = 'published';

create table if not exists public.card_sources (
  id uuid primary key default gen_random_uuid(),
  card_id text references public.card_catalog(id) on delete cascade,
  issuer text not null,
  source_type text not null check (source_type in (
    'product_page', 'reward_terms', 'fees', 'eligibility', 'offer_page', 'other'
  )),
  url text not null unique,
  is_official boolean not null default true,
  is_active boolean not null default true,
  check_frequency_hours integer not null default 24,
  last_checked_at timestamptz,
  last_content_hash text,
  last_http_status integer,
  last_changed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_offers (
  id uuid primary key default gen_random_uuid(),
  offer_key text unique,
  card_id text references public.card_catalog(id) on delete cascade,
  issuer text not null,
  merchant text,
  title text not null,
  description text,
  offer_type text,
  offer_value jsonb not null default '{}'::jsonb,
  eligibility jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'expired', 'rejected')),
  source_url text not null,
  terms_url text,
  source_checked_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_change_candidates (
  id uuid primary key default gen_random_uuid(),
  card_id text references public.card_catalog(id) on delete cascade,
  issuer text not null,
  source_id uuid references public.card_sources(id) on delete set null,
  change_type text not null check (change_type in (
    'reward_rule', 'cap', 'exclusion', 'fee', 'eligibility', 'benefit',
    'terms', 'offer', 'card_status', 'other'
  )),
  old_value jsonb,
  proposed_value jsonb not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'applied')),
  detected_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  applied_version_id uuid references public.card_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_monitoring_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running'
    check (status in ('running', 'completed', 'partial', 'failed')),
  sources_checked integer not null default 0,
  sources_changed integer not null default 0,
  candidates_created integer not null default 0,
  error_log jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create or replace function public.set_cardsmart_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_card_catalog_updated_at on public.card_catalog;
create trigger set_card_catalog_updated_at before update on public.card_catalog
for each row execute procedure public.set_cardsmart_updated_at();

drop trigger if exists set_card_versions_updated_at on public.card_versions;
create trigger set_card_versions_updated_at before update on public.card_versions
for each row execute procedure public.set_cardsmart_updated_at();

drop trigger if exists set_card_sources_updated_at on public.card_sources;
create trigger set_card_sources_updated_at before update on public.card_sources
for each row execute procedure public.set_cardsmart_updated_at();

drop trigger if exists set_card_offers_updated_at on public.card_offers;
create trigger set_card_offers_updated_at before update on public.card_offers
for each row execute procedure public.set_cardsmart_updated_at();

drop trigger if exists set_card_change_candidates_updated_at on public.card_change_candidates;
create trigger set_card_change_candidates_updated_at before update on public.card_change_candidates
for each row execute procedure public.set_cardsmart_updated_at();

alter table public.card_catalog enable row level security;
alter table public.card_versions enable row level security;
alter table public.card_sources enable row level security;
alter table public.card_offers enable row level security;
alter table public.card_change_candidates enable row level security;
alter table public.card_monitoring_runs enable row level security;

drop policy if exists "Public can read active cards" on public.card_catalog;
create policy "Public can read active cards" on public.card_catalog
for select using (status = 'active');

drop policy if exists "Public can read published card versions" on public.card_versions;
create policy "Public can read published card versions" on public.card_versions
for select using (
  status = 'published'
  and (effective_from is null or effective_from <= now())
  and (effective_to is null or effective_to > now())
);

drop policy if exists "Public can read live offers" on public.card_offers;
create policy "Public can read live offers" on public.card_offers
for select using (
  status = 'published'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

revoke all on table public.card_catalog from anon, authenticated;
revoke all on table public.card_versions from anon, authenticated;
revoke all on table public.card_sources from anon, authenticated;
revoke all on table public.card_offers from anon, authenticated;
revoke all on table public.card_change_candidates from anon, authenticated;
revoke all on table public.card_monitoring_runs from anon, authenticated;

grant select on table public.card_catalog to anon, authenticated;
grant select on table public.card_versions to anon, authenticated;
grant select on table public.card_offers to anon, authenticated;

create index if not exists card_catalog_issuer_idx on public.card_catalog(issuer);
create index if not exists card_versions_card_status_idx on public.card_versions(card_id, status);
create index if not exists card_sources_next_check_idx on public.card_sources(is_active, last_checked_at);
create index if not exists card_offers_live_idx on public.card_offers(status, starts_at, ends_at);
create index if not exists card_change_candidates_pending_idx
  on public.card_change_candidates(status, detected_at desc);
