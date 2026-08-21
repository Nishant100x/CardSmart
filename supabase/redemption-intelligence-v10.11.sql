-- CardSmart V10.11: redemption intelligence and user milestone ledger
-- Run after rewards-truth-layer-v10.10.sql. Safe to re-run.

begin;

create or replace function public.set_cardsmart_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.profiles
  add column if not exists redemption_preference text not null default 'balanced';

do $$
begin
  alter table public.profiles add constraint profiles_redemption_preference_check
    check (redemption_preference in ('balanced', 'cash', 'shopping', 'travel'));
exception when duplicate_object then null;
end $$;

alter table public.cards
  add column if not exists points_balance numeric,
  add column if not exists monthly_eligible_spend numeric,
  add column if not exists annual_eligible_spend numeric,
  add column if not exists qualifying_transactions integer,
  add column if not exists ledger_updated_at timestamptz;

create table if not exists public.reward_redemption_routes (
  id uuid primary key default gen_random_uuid(),
  card_id text not null references public.card_catalog(id) on delete cascade,
  route_key text not null,
  reward_currency text not null,
  route_type text not null check (route_type in ('cash', 'voucher', 'product', 'travel', 'transfer')),
  label text not null,
  value_per_unit numeric,
  conversion_units_per_point numeric,
  conversion_unit_label text,
  tiers jsonb not null default '[]'::jsonb,
  conditions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  confidence text not null default 'reviewed' check (confidence in ('verified', 'reviewed', 'indicative')),
  source_url text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(card_id, route_key)
);

create table if not exists public.card_milestones (
  id uuid primary key default gen_random_uuid(),
  card_id text not null references public.card_catalog(id) on delete cascade,
  milestone_key text not null,
  label text not null,
  period text not null check (period in ('calendar_month', 'anniversary_year')),
  metric text not null check (metric in ('spend', 'transactions')),
  threshold numeric not null,
  min_transaction_amount numeric,
  benefit_label text not null,
  benefit_value numeric,
  requires_enrollment boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  confidence text not null default 'reviewed' check (confidence in ('verified', 'reviewed', 'indicative')),
  source_url text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(card_id, milestone_key)
);

drop trigger if exists set_reward_redemption_routes_updated_at on public.reward_redemption_routes;
create trigger set_reward_redemption_routes_updated_at before update on public.reward_redemption_routes
for each row execute procedure public.set_cardsmart_updated_at();

drop trigger if exists set_card_milestones_updated_at on public.card_milestones;
create trigger set_card_milestones_updated_at before update on public.card_milestones
for each row execute procedure public.set_cardsmart_updated_at();

alter table public.reward_redemption_routes enable row level security;
alter table public.card_milestones enable row level security;

drop policy if exists "Public can read published redemption routes" on public.reward_redemption_routes;
create policy "Public can read published redemption routes" on public.reward_redemption_routes
for select using (status = 'published');

drop policy if exists "Public can read published milestones" on public.card_milestones;
create policy "Public can read published milestones" on public.card_milestones
for select using (status = 'published');

revoke all on table public.reward_redemption_routes from anon, authenticated;
revoke all on table public.card_milestones from anon, authenticated;
grant select on table public.reward_redemption_routes to anon, authenticated;
grant select on table public.card_milestones to anon, authenticated;

insert into public.reward_redemption_routes
  (card_id, route_key, reward_currency, route_type, label, value_per_unit, conversion_units_per_point, conversion_unit_label, tiers, conditions, status, confidence, source_url, verified_at)
values
  ('hdfc-infinia','hdfc-cash','HDFC Reward Points','cash','Statement credit',0.30,null,null,'[]','["Up to 50,000 points per month against statement balance"]','published','verified','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',now()),
  ('hdfc-infinia','hdfc-vouchers','HDFC Reward Points','voucher','Products and vouchers',0.50,null,null,'[]','["Issuer catalogue value varies by item"]','published','verified','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',now()),
  ('hdfc-infinia','hdfc-apple-tanishq','HDFC Reward Points','product','Apple products or Tanishq vouchers via SmartBuy',1.00,null,null,'[]','["Points can cover up to 70% of the bill"]','published','verified','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',now()),
  ('hdfc-infinia','hdfc-travel','HDFC Reward Points','travel','Flights and hotels through SmartBuy',1.00,null,null,'[]','["Monthly redemption caps apply"]','published','verified','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',now()),
  ('hdfc-infinia','hdfc-transfer','HDFC Reward Points','transfer','Airmile conversion',null,1.00,'airmiles','[]','["Up to 1 airmile per point; realised value depends on partner"]','published','verified','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',now()),
  ('axis-atlas','atlas-travel','Axis EDGE Miles','travel','Flights, hotels and experiences through Travel EDGE',1.00,null,null,'[]','["₹99 redemption fee applies"]','published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',now()),
  ('axis-atlas','atlas-transfer','Axis EDGE Miles','transfer','Transfer to eligible airline and hotel partners',null,2.00,'partner miles','[]','["1 EDGE Mile converts to 2 partner miles","₹199 transfer fee and annual partner-group limits apply"]','published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',now()),
  ('axis-magnus','magnus-catalogue','Axis EDGE Reward Points','voucher','Axis EDGE catalogue',0.20,null,null,'[]','[]','published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card',now()),
  ('axis-magnus','magnus-transfer','Axis EDGE Reward Points','transfer','Transfer to eligible airline and hotel partners',null,0.40,'partner miles','[]','["5 EDGE Points convert to 2 partner miles for standard Magnus","Partner-group limits and transfer fee apply"]','published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card',now()),
  ('amex-mrcc','amex-cash','Membership Rewards','cash','Conservative cash-equivalent value',0.25,null,null,'[]','[]','published','reviewed','https://www.americanexpress.com/in/credit-cards/membership-rewards-card/',now()),
  ('amex-mrcc','amex-gold-18','Membership Rewards','voucher','18 Karat Gold Collection',null,null,null,'[{"units":18000,"value":9000,"label":"Taj voucher up to ₹9,000"},{"units":18000,"value":7000,"label":"Selected shopping vouchers up to ₹7,000"}]','["Requires 18,000 points; choose one available reward"]','published','verified','https://www.americanexpress.com/in/rewards/membership-rewards/redeem-points/gold-collection.html',now()),
  ('amex-mrcc','amex-gold-24','Membership Rewards','voucher','24 Karat Gold Collection',null,null,null,'[{"units":24000,"value":14000,"label":"Taj voucher up to ₹14,000"},{"units":24000,"value":10000,"label":"Shoppers Stop voucher worth ₹10,000"},{"units":24000,"value":8000,"label":"Amazon, Flipkart or Reliance Digital voucher worth ₹8,000"}]','["Requires 24,000 points; choose one available reward"]','published','verified','https://www.americanexpress.com/in/rewards/membership-rewards/redeem-points/gold-collection.html',now())
on conflict (card_id, route_key) do update set
  reward_currency=excluded.reward_currency, route_type=excluded.route_type, label=excluded.label,
  value_per_unit=excluded.value_per_unit, conversion_units_per_point=excluded.conversion_units_per_point,
  conversion_unit_label=excluded.conversion_unit_label, tiers=excluded.tiers, conditions=excluded.conditions,
  status=excluded.status, confidence=excluded.confidence, source_url=excluded.source_url, verified_at=excluded.verified_at;

insert into public.card_milestones
  (card_id, milestone_key, label, period, metric, threshold, min_transaction_amount, benefit_label, benefit_value, requires_enrollment, status, confidence, source_url, verified_at)
values
  ('hdfc-infinia','infinia-fee-waiver','Renewal fee waiver','anniversary_year','spend',1000000,null,'₹12,500 renewal fee waived',12500,false,'published','verified','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',now()),
  ('axis-atlas','atlas-3l','₹3 lakh milestone','anniversary_year','spend',300000,null,'2,500 EDGE Miles',2500,false,'published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',now()),
  ('axis-atlas','atlas-7_5l','₹7.5 lakh milestone','anniversary_year','spend',750000,null,'Additional 2,500 EDGE Miles and Gold tier',2500,false,'published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',now()),
  ('axis-atlas','atlas-15l','₹15 lakh milestone','anniversary_year','spend',1500000,null,'Additional 5,000 EDGE Miles and Platinum tier',5000,false,'published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',now()),
  ('axis-magnus','magnus-fee-waiver','Renewal fee waiver','anniversary_year','spend',2500000,null,'₹12,500 renewal fee waived',12500,false,'published','verified','https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card',now()),
  ('amex-mrcc','mrcc-4x1500','Four qualifying transactions','calendar_month','transactions',4,1500,'1,000 bonus MR Points',250,false,'published','verified','https://www.americanexpress.com/in/credit-cards/membership-rewards-card/',now()),
  ('amex-mrcc','mrcc-20k','₹20,000 monthly spend','calendar_month','spend',20000,null,'Additional 1,000 MR Points',250,true,'published','verified','https://www.americanexpress.com/in/credit-cards/membership-rewards-card/',now()),
  ('amex-mrcc','mrcc-fee-half','50% renewal fee waiver','anniversary_year','spend',90000,null,'50% renewal fee waived',null,false,'published','verified','https://www.americanexpress.com/in/credit-cards/membership-rewards-card/',now()),
  ('amex-mrcc','mrcc-fee-full','Full renewal fee waiver','anniversary_year','spend',150000,null,'100% renewal fee waived',4500,false,'published','verified','https://www.americanexpress.com/in/credit-cards/membership-rewards-card/',now())
on conflict (card_id, milestone_key) do update set
  label=excluded.label, period=excluded.period, metric=excluded.metric, threshold=excluded.threshold,
  min_transaction_amount=excluded.min_transaction_amount, benefit_label=excluded.benefit_label,
  benefit_value=excluded.benefit_value, requires_enrollment=excluded.requires_enrollment,
  status=excluded.status, confidence=excluded.confidence, source_url=excluded.source_url, verified_at=excluded.verified_at;

with route_json as (
  select card_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'id', route_key, 'type', route_type, 'label', label, 'valuePerUnit', value_per_unit,
    'conversionUnitsPerPoint', conversion_units_per_point, 'conversionUnitLabel', conversion_unit_label,
    'tiers', tiers, 'conditions', conditions, 'sourceUrl', source_url, 'confidence', confidence
  )) order by route_key) as routes
  from public.reward_redemption_routes where status='published' group by card_id
), milestone_json as (
  select card_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'id', milestone_key, 'label', label, 'period', period, 'metric', metric, 'threshold', threshold,
    'minTransactionAmount', min_transaction_amount, 'benefitLabel', benefit_label,
    'benefitValue', benefit_value, 'requiresEnrollment', requires_enrollment, 'sourceUrl', source_url
  )) order by threshold) as milestones
  from public.card_milestones where status='published' group by card_id
), currency_meta(card_id, currency_patch) as (
  values
    ('hdfc-infinia','{"standardValuePerUnit":0.3,"optimisedValuePerUnit":1,"standardRedemption":"Statement credit","optimisedRedemption":"Eligible ₹1 redemption routes"}'::jsonb),
    ('axis-atlas','{"standardValuePerUnit":1,"optimisedValuePerUnit":1,"standardRedemption":"Travel EDGE booking value","optimisedRedemption":"Travel EDGE or partner transfer"}'::jsonb),
    ('axis-magnus','{"standardValuePerUnit":0.2,"optimisedValuePerUnit":0.2,"standardRedemption":"Axis catalogue value","optimisedRedemption":"Axis catalogue or partner transfer"}'::jsonb),
    ('amex-mrcc','{"standardValuePerUnit":0.25,"optimisedValuePerUnit":0.583,"standardRedemption":"Conservative cash-equivalent value","optimisedRedemption":"Gold Collection voucher tiers"}'::jsonb)
), updates as (
  select cv.id, r.card_id, r.routes, m.milestones, c.currency_patch,
    cv.reward_model->'rewardModel'->'defaultEarning' as earning
  from public.card_versions cv
  join route_json r on r.card_id=cv.card_id
  join milestone_json m on m.card_id=cv.card_id
  join currency_meta c on c.card_id=cv.card_id
  where cv.status='published'
)
update public.card_versions cv
set reward_model = jsonb_set(
  jsonb_set(
    jsonb_set(cv.reward_model, '{rewardModel,milestones}', updates.milestones, true),
    '{rewardModel,defaultEarning,currency}',
    coalesce(updates.earning->'currency','{}'::jsonb) || updates.currency_patch || jsonb_build_object('redemptionOptions',updates.routes), true
  ),
  '{rewardModel,dataVersion}', to_jsonb('2026.08.21-v10.11'::text), true
), updated_at=now(), reviewed_at=now(), source_checked_at=now()
from updates where cv.id=updates.id;

update public.card_versions
set reward_model=jsonb_set(reward_model,'{rewardModel,exclusions}','["fuel"]'::jsonb,true), updated_at=now()
where card_id='hdfc-infinia' and status='published';

-- Keep category/merchant point earnings aligned to the same currency routes.
update public.card_versions
set reward_model = jsonb_set(reward_model, '{rewardModel,categoryEarnings,travel,currency}', reward_model->'rewardModel'->'defaultEarning'->'currency', true), updated_at=now()
where card_id='axis-atlas' and status='published';

update public.card_versions
set reward_model = jsonb_set(reward_model, '{rewardModel,merchantRules,0,earning,currency}', reward_model->'rewardModel'->'defaultEarning'->'currency', true), updated_at=now()
where card_id='axis-magnus' and status='published';

commit;
