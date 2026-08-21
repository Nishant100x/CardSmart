-- CardSmart V10.10: rewards truth layer
-- Run after card-catalog-schema.sql and card-catalog-seed-v1.sql.
-- Safe to re-run. No wallet, profile or interaction data is modified.

begin;

create table if not exists public.reward_validation_cases (
  id uuid primary key default gen_random_uuid(),
  case_key text not null unique,
  card_id text not null references public.card_catalog(id) on delete cascade,
  description text not null,
  payment_input jsonb not null,
  expected_result jsonb not null,
  source_urls text[] not null default '{}',
  status text not null default 'verified'
    check (status in ('verified', 'needs_review', 'blocked')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_reward_validation_cases_updated_at on public.reward_validation_cases;
create trigger set_reward_validation_cases_updated_at before update on public.reward_validation_cases
for each row execute procedure public.set_cardsmart_updated_at();

alter table public.reward_validation_cases enable row level security;
revoke all on table public.reward_validation_cases from anon, authenticated;

with reward_updates(card_id, model_patch) as (
  values
    ('hdfc-swiggy', '{"confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21","sourceUrls":["https://www.hdfc.bank.in/credit-cards/swiggy-hdfc-bank-credit-card"]}'::jsonb),
    ('sbi-cashback', '{"confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21","sourceUrls":["https://www.sbicard.com/en/faq/cashback-sbi-card-faq.page","https://www.sbicard.com/en/customer-notices.page"],"defaultCapAmount":4000,"assumptions":["The ₹4,000 limit is cumulative across eligible online and offline cashback in the statement cycle.","Jewellery, railways, tolls and digital gaming are also excluded; enter the category explicitly when relevant."]}'::jsonb),
    ('hdfc-millennia', '{"confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21","sourceUrls":["https://www.hdfc.bank.in/credit-cards/millennia-credit-card"]}'::jsonb),
    ('amazon-icici', '{"confidence":"reviewed","verifiedAt":"2026-08-21","dataVersion":"2026.08.21","sourceUrls":["https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card"]}'::jsonb),
    ('hsbc-liveplus', '{"confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21","sourceUrls":["https://www.hsbc.co.in/credit-cards/products/live-plus/"]}'::jsonb),
    ('axis-ace', '{"confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21","sourceUrls":["https://www.axis.bank.in/cards/credit-card/axis-bank-ace-credit-card"]}'::jsonb),
    ('axis-atlas', '{
      "confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21",
      "sourceUrls":["https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card","https://www.axis.bank.in/docs/default-source/default-document-library/credit-cards/terms-and-conditions-of-features-of-axis-bank-atlas-credit-card.pdf"],
      "exclusions":["fuel","rent","wallet","government","insurance","utilities"],
      "defaultEarning":{"kind":"points","units":2,"spendUnit":100,"currency":{"code":"AXIS_EDGE_MILE","name":"Axis EDGE Miles","unitLabel":"EDGE Miles","standardValuePerUnit":1,"optimisedValuePerUnit":1,"standardRedemption":"Axis redemption value","optimisedRedemption":"Transfer at up to 1 EDGE Mile : 2 partner miles; realised travel value varies"}},
      "categoryEarnings":{"travel":{"kind":"points","units":5,"spendUnit":100,"currency":{"code":"AXIS_EDGE_MILE","name":"Axis EDGE Miles","unitLabel":"EDGE Miles","standardValuePerUnit":1,"optimisedValuePerUnit":1,"standardRedemption":"Axis redemption value","optimisedRedemption":"Transfer at up to 1 EDGE Mile : 2 partner miles; realised travel value varies"}}},
      "assumptions":["Travel acceleration is limited to Travel EDGE, direct airlines and direct hotel merchants.","The ₹2 lakh monthly accelerated-travel threshold is not inferred without statement-cycle spend."]
    }'::jsonb),
    ('hdfc-infinia', '{
      "confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21",
      "sourceUrls":["https://www.hdfc.bank.in/credit-cards/infinia-credit-card","https://offers.smartbuy.hdfc.bank.in/v2/infinia/home"],
      "defaultEarning":{"kind":"points","units":5,"spendUnit":150,"currency":{"code":"HDFC_RP","name":"HDFC Reward Points","unitLabel":"Reward Points","standardValuePerUnit":0.3,"optimisedValuePerUnit":1,"standardRedemption":"Statement credit","optimisedRedemption":"Flights and hotels through SmartBuy"}},
      "assumptions":["Ranking uses ₹0.30 per point, the conservative statement-credit value.","The up-to-₹1 travel value is shown separately and is not assumed in the winner ranking.","SmartBuy acceleration is not applied unless the payment route is explicitly modelled."]
    }'::jsonb),
    ('axis-magnus', '{
      "confidence":"verified","verifiedAt":"2026-08-21","dataVersion":"2026.08.21",
      "sourceUrls":["https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card"],
      "defaultEarning":{"kind":"points","units":12,"spendUnit":200,"currency":{"code":"AXIS_EDGE_RP","name":"Axis EDGE Reward Points","unitLabel":"EDGE Points","standardValuePerUnit":0.2,"optimisedValuePerUnit":0.2,"standardRedemption":"Axis catalogue value","optimisedRedemption":"Transfer at 5 EDGE Points : 2 partner miles; realised travel value varies"}},
      "merchantRules":[{"matches":["travel edge"],"channels":["app","online"],"earning":{"kind":"points","units":60,"spendUnit":200,"currency":{"code":"AXIS_EDGE_RP","name":"Axis EDGE Reward Points","unitLabel":"EDGE Points","standardValuePerUnit":0.2,"optimisedValuePerUnit":0.2,"standardRedemption":"Axis catalogue value","optimisedRedemption":"Transfer at 5 EDGE Points : 2 partner miles; realised travel value varies"}},"label":"5X Travel EDGE reward"}],
      "assumptions":["The higher 35-points-per-₹200 band above ₹1.5 lakh monthly spend is excluded until statement-cycle spend is known."]
    }'::jsonb),
    ('amex-mrcc', '{
      "confidence":"reviewed","verifiedAt":"2026-08-21","dataVersion":"2026.08.21",
      "sourceUrls":["https://www.americanexpress.com/in/credit-cards/membership-rewards-card/"],
      "defaultEarning":{"kind":"points","units":1,"spendUnit":50,"currency":{"code":"AMEX_MR","name":"Membership Rewards","unitLabel":"MR Points","standardValuePerUnit":0.25,"optimisedValuePerUnit":0.5,"standardRedemption":"Conservative cash-equivalent value","optimisedRedemption":"Selected Gold Collection redemptions"}},
      "assumptions":["Ranking uses a conservative ₹0.25 per Membership Rewards point because realised value depends on redemption choice.","The higher illustrative value is shown separately.","Monthly milestone points are excluded until qualifying transaction count is tracked."]
    }'::jsonb)
)
update public.card_versions cv
set reward_model = jsonb_set(
      cv.reward_model,
      '{rewardModel}',
      coalesce(cv.reward_model -> 'rewardModel', '{}'::jsonb) || reward_updates.model_patch,
      true
    ),
    source_checked_at = now(),
    reviewed_at = now(),
    updated_at = now()
from reward_updates
where cv.card_id = reward_updates.card_id
  and cv.status = 'published';

update public.card_versions
set reward_model = jsonb_set(reward_model, '{cap}', to_jsonb('₹4,000 aggregate cashback / statement cycle'::text), true),
    updated_at = now()
where card_id = 'sbi-cashback'
  and status = 'published';

insert into public.card_sources (card_id, issuer, source_type, url, is_official, check_frequency_hours, last_checked_at)
values
  ('hdfc-swiggy','HDFC Bank','product_page','https://www.hdfc.bank.in/credit-cards/swiggy-hdfc-bank-credit-card',true,24,now()),
  ('sbi-cashback','SBI Card','reward_terms','https://www.sbicard.com/en/faq/cashback-sbi-card-faq.page',true,24,now()),
  ('sbi-cashback','SBI Card','other','https://www.sbicard.com/en/customer-notices.page',true,24,now()),
  ('axis-atlas','Axis Bank','product_page','https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',true,24,now()),
  ('axis-atlas','Axis Bank','reward_terms','https://www.axis.bank.in/docs/default-source/default-document-library/credit-cards/terms-and-conditions-of-features-of-axis-bank-atlas-credit-card.pdf',true,24,now()),
  ('hdfc-infinia','HDFC Bank','product_page','https://www.hdfc.bank.in/credit-cards/infinia-credit-card',true,24,now()),
  ('hdfc-millennia','HDFC Bank','product_page','https://www.hdfc.bank.in/credit-cards/millennia-credit-card',true,24,now()),
  ('amazon-icici','ICICI Bank','product_page','https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card',true,24,now()),
  ('hsbc-liveplus','HSBC','product_page','https://www.hsbc.co.in/credit-cards/products/live-plus/',true,24,now()),
  ('axis-ace','Axis Bank','product_page','https://www.axis.bank.in/cards/credit-card/axis-bank-ace-credit-card',true,24,now()),
  ('axis-magnus','Axis Bank','product_page','https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card',true,24,now()),
  ('amex-mrcc','American Express','product_page','https://www.americanexpress.com/in/credit-cards/membership-rewards-card/',true,24,now())
on conflict (url) do update set
  card_id = excluded.card_id,
  issuer = excluded.issuer,
  source_type = excluded.source_type,
  is_official = true,
  is_active = true,
  last_checked_at = excluded.last_checked_at,
  updated_at = now();

insert into public.card_offers (
  offer_key, card_id, issuer, merchant, title, description, offer_type,
  offer_value, eligibility, starts_at, ends_at, status, source_url, terms_url,
  source_checked_at, reviewed_at, published_at
)
values
  (
    'hsbc-lakme-2026', null, 'HSBC', 'Lakme Salon', '₹1,100 off at Lakme Salon',
    'Flat ₹1,100 off on an eligible in-store bill of ₹3,000 or more.', 'instant_discount',
    '{"benefit":{"kind":"instant_discount","fixedAmount":1100},"confidence":"verified"}'::jsonb,
    '{"merchantMatches":["lakme"],"channels":["offline"],"minSpend":3000,"couponCode":"Unique voucher code required","requiresEnrollment":true,"usageLimit":"Once per cardholder per calendar month"}'::jsonb,
    '2026-01-01T00:00:00+05:30', '2026-12-31T23:59:59+05:30', 'published',
    'https://www.hsbc.co.in/credit-cards/offers/',
    'https://www.hsbc.co.in/content/dam/hsbc/in/documents/credit-cards/offers/lakme-salon-tnc.pdf',
    now(), now(), now()
  ),
  (
    'hsbc-zepto-2026', null, 'HSBC', 'Zepto', '₹100 instant discount on Zepto',
    'Flat ₹100 instant discount on eligible Zepto orders of ₹999 or more.', 'instant_discount',
    '{"benefit":{"kind":"instant_discount","fixedAmount":100},"confidence":"verified"}'::jsonb,
    '{"merchantMatches":["zepto"],"channels":["online","app"],"minSpend":999,"excludedCardIds":["hsbc-liveplus"],"couponCode":"ZEPHSBC","usageLimit":"Once per card per month; selected products only"}'::jsonb,
    '2026-05-01T00:00:00+05:30', '2026-12-31T23:59:59+05:30', 'published',
    'https://www.hsbc.co.in/credit-cards/offers/',
    'https://www.hsbc.co.in/content/dam/hsbc/in/documents/credit-cards/offers/zepto-offer-tnc.pdf',
    now(), now(), now()
  )
on conflict (offer_key) do update set
  title = excluded.title,
  description = excluded.description,
  offer_type = excluded.offer_type,
  offer_value = excluded.offer_value,
  eligibility = excluded.eligibility,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  source_url = excluded.source_url,
  terms_url = excluded.terms_url,
  source_checked_at = excluded.source_checked_at,
  reviewed_at = excluded.reviewed_at,
  updated_at = now();

insert into public.reward_validation_cases (
  case_key, card_id, description, payment_input, expected_result, source_urls, status, verified_at
)
values
  ('hdfc-swiggy-2000','hdfc-swiggy','Eligible Swiggy app payment','{"merchant":"Swiggy","amount":2000,"category":"dining","channel":"app"}','{"rewardType":"cashback","baseValue":200,"rate":10}','{"https://www.hdfc.bank.in/credit-cards/swiggy-hdfc-bank-credit-card"}','verified',now()),
  ('sbi-cashback-online-5000','sbi-cashback','Eligible online retail payment after April 2026 revision','{"merchant":"Online store","amount":5000,"category":"shopping","channel":"online"}','{"rewardType":"cashback","baseValue":250,"rate":5}','{"https://www.sbicard.com/en/faq/cashback-sbi-card-faq.page"}','verified',now()),
  ('axis-atlas-flight-20000','axis-atlas','Eligible direct airline payment','{"merchant":"Airline flight","amount":20000,"category":"travel","channel":"online"}','{"rewardType":"points","units":1000,"unitLabel":"EDGE Miles","standardValue":1000}','{"https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card"}','verified',now()),
  ('hdfc-infinia-retail-2000','hdfc-infinia','Eligible retail payment with discrete ₹150 rounding','{"merchant":"Retail store","amount":2000,"category":"shopping","channel":"offline"}','{"rewardType":"points","units":66,"unitLabel":"Reward Points","standardValue":20,"optimisedValue":66}','{"https://www.hdfc.bank.in/credit-cards/infinia-credit-card","https://offers.smartbuy.hdfc.bank.in/v2/infinia/home"}','verified',now()),
  ('axis-ace-gpay-utility-2000','axis-ace','Eligible utility payment through Google Pay','{"merchant":"Google Pay electricity","amount":2000,"category":"utilities","channel":"app"}','{"rewardType":"cashback","baseValue":100,"rate":5}','{"https://www.axis.bank.in/cards/credit-card/axis-bank-ace-credit-card"}','verified',now()),
  ('hsbc-liveplus-grocery-5000','hsbc-liveplus','Eligible grocery payment within cap','{"merchant":"Grocery store","amount":5000,"category":"grocery","channel":"offline"}','{"rewardType":"cashback","baseValue":500,"rate":10}','{"https://www.hsbc.co.in/credit-cards/products/live-plus/"}','verified',now()),
  ('axis-magnus-retail-2000','axis-magnus','Eligible retail payment below monthly accelerator threshold','{"merchant":"Retail store","amount":2000,"category":"shopping","channel":"offline"}','{"rewardType":"points","units":120,"unitLabel":"EDGE Points","standardValue":24}','{"https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card"}','verified',now()),
  ('amex-mrcc-retail-2000','amex-mrcc','Base Membership Rewards accrual; redemption value remains reviewed','{"merchant":"Retail store","amount":2000,"category":"shopping","channel":"offline"}','{"rewardType":"points","units":40,"unitLabel":"MR Points","standardValue":10,"optimisedValue":20}','{"https://www.americanexpress.com/in/credit-cards/membership-rewards-card/"}','needs_review',now()),
  ('hsbc-lakme-offer-3000','hsbc-liveplus','Eligible offline Lakme offer with voucher activation','{"merchant":"Lakme Salon offline","amount":3000,"category":"shopping","channel":"offline"}','{"offerValue":1100,"requiresEnrollment":true}','{"https://www.hsbc.co.in/content/dam/hsbc/in/documents/credit-cards/offers/lakme-salon-tnc.pdf"}','verified',now())
on conflict (case_key) do update set
  description = excluded.description,
  payment_input = excluded.payment_input,
  expected_result = excluded.expected_result,
  source_urls = excluded.source_urls,
  status = excluded.status,
  verified_at = excluded.verified_at,
  updated_at = now();

commit;
