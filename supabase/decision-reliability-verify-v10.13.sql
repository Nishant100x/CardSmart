-- CardSmart V10.13 beta reliability dashboard.
-- Run in the Supabase SQL Editor. This is an owner/admin query, not a public API.

select *
from public.cardsmart_reliability_daily
where day >= date_trunc('day', now()) - interval '14 days'
order by day desc;

select
  verdict,
  issue_type,
  count(*) as responses,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1) as response_share_pct
from public.recommendation_feedback
where created_at >= now() - interval '14 days'
group by verdict, issue_type
order by responses desc;

select
  coalesce(metadata ->> 'rule_confidence', 'unknown') as rule_confidence,
  count(*) as recommendations,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1) as recommendation_share_pct
from public.product_events
where event_name = 'recommendation_viewed'
  and created_at >= now() - interval '14 days'
group by 1
order by recommendations desc;

select
  merchant_text,
  canonical_merchant,
  category,
  payment_channel,
  correction_merchant,
  correction_category,
  correction_payment_channel,
  created_at
from public.recommendation_feedback
where verdict = 'corrected'
order by created_at desc
limit 100;

select
  merchant_text,
  canonical_merchant,
  recommended_card_id,
  rule_confidence,
  intent_confidence,
  created_at
from public.recommendation_feedback
where issue_type = 'reward_or_offer'
order by created_at desc
limit 100;
