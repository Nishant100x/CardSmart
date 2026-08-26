-- CardSmart V10.12: merchant and payment-intent resolution directory
-- Run after the V10.11 redemption-intelligence migration.
-- Safe to re-run. No profile, wallet or interaction data is modified.

begin;

create table if not exists public.merchant_directory (
  id uuid primary key default gen_random_uuid(),
  merchant_key text not null unique,
  display_name text not null,
  aliases text[] not null default '{}',
  category_candidates text[] not null default '{}',
  channel_candidates text[] not null default '{}',
  confidence text not null default 'reviewed'
    check (confidence in ('verified', 'reviewed', 'indicative')),
  source_url text,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'retired')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(aliases) > 0),
  check (category_candidates <@ array['dining','grocery','shopping','travel','utilities','fuel','rent','education','insurance','government','wallet','other']::text[]),
  check (channel_candidates <@ array['online','offline','app','upi']::text[])
);

drop trigger if exists set_merchant_directory_updated_at on public.merchant_directory;
create trigger set_merchant_directory_updated_at before update on public.merchant_directory
for each row execute procedure public.set_cardsmart_updated_at();

alter table public.merchant_directory enable row level security;
revoke all on table public.merchant_directory from anon, authenticated;
grant select on table public.merchant_directory to anon, authenticated;

drop policy if exists "Published merchant directory is public" on public.merchant_directory;
create policy "Published merchant directory is public"
on public.merchant_directory for select
to anon, authenticated
using (status = 'published');

insert into public.merchant_directory (
  merchant_key, display_name, aliases, category_candidates, channel_candidates,
  confidence, status, reviewed_at
)
values
  ('croma','Croma',array['croma','chroma'],array['shopping'],array['offline','online','app','upi'],'reviewed','published',now()),
  ('reliance-digital','Reliance Digital',array['reliance digital','reliance electronics'],array['shopping'],array['offline','online','app','upi'],'reviewed','published',now()),
  ('vijay-sales','Vijay Sales',array['vijay sales'],array['shopping'],array['offline','online','app','upi'],'reviewed','published',now()),
  ('flipkart','Flipkart',array['flipkart','flip kart'],array['shopping'],array['app','online','upi'],'reviewed','published',now()),
  ('myntra','Myntra',array['myntra'],array['shopping'],array['app','online','upi'],'reviewed','published',now()),
  ('nykaa','Nykaa',array['nykaa','naykaa'],array['shopping'],array['app','online','upi'],'reviewed','published',now()),
  ('amazon','Amazon',array['amazon','amazon india'],array['shopping','grocery','travel','utilities','wallet'],array['app','online','upi'],'reviewed','published',now()),
  ('swiggy','Swiggy',array['swiggy','swigy'],array['dining','grocery'],array['app','online','upi'],'reviewed','published',now()),
  ('zomato','Zomato',array['zomato','zomatto'],array['dining'],array['app','online','upi'],'reviewed','published',now()),
  ('blinkit','Blinkit',array['blinkit','blink it','grofers'],array['grocery'],array['app','online','upi'],'reviewed','published',now()),
  ('zepto','Zepto',array['zepto'],array['grocery'],array['app','online','upi'],'reviewed','published',now()),
  ('bigbasket','BigBasket',array['bigbasket','big basket','bbnow'],array['grocery'],array['app','online','upi'],'reviewed','published',now()),
  ('dmart','DMart',array['dmart','d mart','dmart ready'],array['grocery','shopping'],array['offline','app','online','upi'],'reviewed','published',now()),
  ('lakme','Lakme Salon',array['lakme','lakme salon'],array['other'],array['offline','online','app','upi'],'reviewed','published',now()),
  ('urban-company','Urban Company',array['urban company','urban clap','urbanclap'],array['other'],array['app','online'],'reviewed','published',now()),
  ('bookmyshow','BookMyShow',array['bookmyshow','book my show','bms'],array['other'],array['app','online'],'reviewed','published',now()),
  ('makemytrip','MakeMyTrip',array['makemytrip','make my trip','mmt'],array['travel'],array['app','online'],'reviewed','published',now()),
  ('cleartrip','Cleartrip',array['cleartrip','clear trip'],array['travel'],array['app','online'],'reviewed','published',now()),
  ('ixigo','ixigo',array['ixigo'],array['travel'],array['app','online'],'reviewed','published',now()),
  ('irctc','IRCTC',array['irctc','rail connect'],array['travel'],array['app','online'],'reviewed','published',now()),
  ('uber','Uber',array['uber'],array['travel'],array['app'],'reviewed','published',now()),
  ('ola','Ola',array['ola','ola cabs'],array['travel'],array['app'],'reviewed','published',now()),
  ('airtel','Airtel',array['airtel','airtel thanks'],array['utilities'],array['app','online'],'reviewed','published',now()),
  ('google-pay','Google Pay',array['google pay','gpay'],array['utilities','shopping','other'],array['app'],'reviewed','published',now()),
  ('phonepe','PhonePe',array['phonepe','phone pe'],array['utilities','shopping','wallet','other'],array['app'],'reviewed','published',now()),
  ('paytm','Paytm',array['paytm'],array['utilities','shopping','travel','wallet','other'],array['app','online'],'reviewed','published',now()),
  ('tata-neu','Tata Neu',array['tata neu','tata new'],array['shopping','grocery','travel','utilities'],array['app'],'reviewed','published',now()),
  ('hdfc-smartbuy','HDFC SmartBuy',array['smartbuy','hdfc smartbuy','smart buy'],array['shopping','travel'],array['app','online'],'reviewed','published',now()),
  ('indianoil','IndianOil',array['indianoil','indian oil','iocl'],array['fuel'],array['offline','upi'],'reviewed','published',now()),
  ('hpcl','HPCL',array['hpcl','hindustan petroleum'],array['fuel'],array['offline','upi'],'reviewed','published',now()),
  ('bpcl','BPCL',array['bpcl','bharat petroleum'],array['fuel'],array['offline','upi'],'reviewed','published',now()),
  ('apollo-pharmacy','Apollo Pharmacy',array['apollo','apollo pharmacy','apollo 24 7','apollo247'],array['other'],array['offline','app','online','upi'],'reviewed','published',now()),
  ('cult-fit','Cult.fit',array['cult fit','cultfit','curefit'],array['other'],array['app','online'],'reviewed','published',now()),
  ('tanishq','Tanishq',array['tanishq'],array['shopping'],array['offline','online','app','upi'],'reviewed','published',now()),
  ('apple-store','Apple Store',array['apple store','apple india'],array['shopping'],array['offline','online','app','upi'],'reviewed','published',now())
on conflict (merchant_key) do update set
  display_name = excluded.display_name,
  aliases = excluded.aliases,
  category_candidates = excluded.category_candidates,
  channel_candidates = excluded.channel_candidates,
  confidence = excluded.confidence,
  status = excluded.status,
  reviewed_at = excluded.reviewed_at,
  updated_at = now();

commit;

select
  count(*) filter (where status = 'published') as published_merchants,
  count(*) filter (where cardinality(aliases) > 1) as merchants_with_multiple_aliases
from public.merchant_directory;
