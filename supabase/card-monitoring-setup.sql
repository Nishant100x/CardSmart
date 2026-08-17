-- CardSmart automated card-source monitoring setup.
-- Safe to re-run after card-catalog-schema.sql and card-catalog-seed-v1.sql.
-- This creates monitoring infrastructure and seeds official issuer sources.
-- It never changes a published card version or publishes an offer.

begin;

create table if not exists public.card_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.card_sources(id) on delete cascade,
  content_hash text not null,
  content_type text,
  content_length integer not null default 0,
  content_text text,
  http_status integer,
  analysis_status text not null default 'baseline'
    check (analysis_status in ('baseline', 'unchanged', 'no_material_change', 'candidates_created', 'analysis_failed')),
  analysis_error text,
  openai_response_id text,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_id, content_hash)
);

alter table public.card_change_candidates
  add column if not exists dedupe_key text;

create unique index if not exists card_change_candidates_dedupe_key_idx
  on public.card_change_candidates(dedupe_key)
  where dedupe_key is not null;

create index if not exists card_source_snapshots_source_fetched_idx
  on public.card_source_snapshots(source_id, fetched_at desc);

alter table public.card_source_snapshots enable row level security;
revoke all on table public.card_source_snapshots from anon, authenticated;

-- Prevent overlapping scheduled runs. Stale runs older than 30 minutes are
-- marked failed before a new run is created.
create or replace function public.begin_card_monitoring_run()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_run_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('cardsmart-card-monitor'));

  update public.card_monitoring_runs
  set status = 'failed',
      finished_at = now(),
      error_log = error_log || jsonb_build_array(jsonb_build_object(
        'error', 'Run exceeded the 30-minute safety window and was closed automatically.',
        'closed_at', now()
      ))
  where status = 'running'
    and started_at < now() - interval '30 minutes';

  if exists (
    select 1 from public.card_monitoring_runs where status = 'running'
  ) then
    return null;
  end if;

  insert into public.card_monitoring_runs default values
  returning id into new_run_id;

  return new_run_id;
end;
$$;

revoke all on function public.begin_card_monitoring_run() from public, anon, authenticated;

-- Priority card product, reward, fee, announcement and offer sources.
insert into public.card_sources (
  card_id, issuer, source_type, url, is_official, is_active, check_frequency_hours
)
values
  ('hdfc-swiggy', 'HDFC Bank', 'product_page', 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/swiggy-hdfc-bank-credit-card', true, true, 24),
  ('hdfc-millennia', 'HDFC Bank', 'product_page', 'https://www.hdfcbank.com/personal/pay/cards/millennia-cards/millennia-cc-new', true, true, 24),
  ('hdfc-infinia', 'HDFC Bank', 'product_page', 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card', true, true, 24),
  ('hdfc-infinia', 'HDFC Bank', 'fees', 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card/fees-and-charges', true, true, 48),
  ('hdfc-tata-neu-infinity', 'HDFC Bank', 'product_page', 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/tata-neu-infinity-hdfc-bank-credit-card', true, true, 24),
  ('hdfc-tata-neu-infinity', 'HDFC Bank', 'fees', 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/tata-neu-infinity-hdfc-bank-credit-card/fees-and-charges', true, true, 48),
  (null, 'HDFC Bank', 'fees', 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/credit-card-fee-waiver-condition', true, true, 48),

  ('sbi-cashback', 'SBI Card', 'product_page', 'https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.html', true, true, 24),
  ('sbi-cashback', 'SBI Card', 'reward_terms', 'https://www.sbicard.com/sbi-card-en/assets/docs/pdf/ekit-tncs/cashback-tnc-ekit.pdf', true, true, 24),
  ('sbi-cashback', 'SBI Card', 'fees', 'https://www.sbicard.com/en/most-important-terms-and-conditions.page', true, true, 48),
  (null, 'SBI Card', 'other', 'https://www.sbicard.com/en/customer-notices.page', true, true, 24),

  ('axis-atlas', 'Axis Bank', 'product_page', 'https://www.axisbank.com/retail/cards/credit-card/axis-bank-atlas-credit-card', true, true, 24),
  ('axis-ace', 'Axis Bank', 'product_page', 'https://www.axisbank.com/retail/cards/credit-card/axis-bank-ace-credit-card', true, true, 24),
  ('axis-airtel', 'Axis Bank', 'product_page', 'https://www.axisbank.com/retail/cards/credit-card/airtel-axis-bank-credit-card/fees-and-charges', true, true, 24),
  (null, 'Axis Bank', 'other', 'https://www.axisbank.com/retail/cards/credit-card/useful-links/terms-and-conditions/important-announcements', true, true, 24),

  ('amazon-icici', 'ICICI Bank', 'product_page', 'https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card', true, true, 24),
  ('amazon-icici', 'ICICI Bank', 'reward_terms', 'https://www.icicibank.com/Personal-Banking/faq/card/amazon-pay-faq.page', true, true, 48),
  (null, 'ICICI Bank', 'other', 'https://www.icicibank.com/personal-banking/cards/credit-card/upcoming-changes-features-and-charges', true, true, 24),

  ('hsbc-liveplus', 'HSBC', 'product_page', 'https://www.hsbc.co.in/credit-cards/products/live-plus/', true, true, 24),
  (null, 'HSBC', 'offer_page', 'https://www.hsbc.co.in/credit-cards/offers/', true, true, 12),

  ('amex-mrcc', 'American Express', 'product_page', 'https://www.americanexpress.com/in/credit-cards/membership-rewards-card/', true, true, 24),
  ('amex-platinum-travel', 'American Express', 'product_page', 'https://www.americanexpress.com/in/credit-cards/platinum-travel-credit-card/', true, true, 24),
  (null, 'American Express', 'offer_page', 'https://www.americanexpress.com/en-in/benefits/amex-offers/offers/', true, true, 12),
  (null, 'American Express', 'reward_terms', 'https://www.americanexpress.com/en-in/benefits/rewards/membership-rewards/', true, true, 48)
on conflict (url) do update set
  card_id = excluded.card_id,
  issuer = excluded.issuer,
  source_type = excluded.source_type,
  is_official = excluded.is_official,
  is_active = excluded.is_active,
  check_frequency_hours = excluded.check_frequency_hours,
  updated_at = now();

commit;

select
  count(*) filter (where is_active) as active_sources,
  count(distinct card_id) filter (where is_active and card_id is not null) as priority_cards_covered,
  count(*) filter (where is_active and source_type = 'offer_page') as offer_pages
from public.card_sources;
