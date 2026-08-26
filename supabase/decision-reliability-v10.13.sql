-- CardSmart V10.13 decision-reliability and beta feedback loop.
-- Safe to run more than once in the Supabase SQL Editor.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid references auth.users (id) on delete cascade,
  event_name text not null,
  view_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check check (event_name in (
    'screen_viewed',
    'payment_started',
    'wallet_required',
    'clarification_shown',
    'clarification_answered',
    'recommendation_viewed',
    'recommendation_followed',
    'alternative_card_used',
    'intent_confirmed',
    'intent_corrected',
    'reward_issue_reported',
    'wallet_saved',
    'redemption_preference_updated'
  ));

alter table public.product_events
  drop constraint if exists product_events_metadata_size_check;

alter table public.product_events
  add constraint product_events_metadata_size_check
  check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 4096);

create index if not exists product_events_created_idx
  on public.product_events (created_at desc);
create index if not exists product_events_event_created_idx
  on public.product_events (event_name, created_at desc);
create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at desc)
  where user_id is not null;

alter table public.product_events enable row level security;

drop policy if exists "Clients can insert scoped product events" on public.product_events;
create policy "Clients can insert scoped product events"
on public.product_events
for insert
with check (user_id is null or (select auth.uid()) = user_id);

revoke all on table public.product_events from anon, authenticated;
grant insert on table public.product_events to anon, authenticated;

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid references auth.users (id) on delete cascade,
  interaction_id uuid references public.interactions (id) on delete set null,
  verdict text not null,
  issue_type text,
  merchant_text text,
  canonical_merchant text,
  category text,
  payment_channel text,
  recommended_card_id text,
  used_card_id text,
  correction_merchant text,
  correction_category text,
  correction_payment_channel text,
  rule_confidence text,
  intent_confidence text,
  created_at timestamp with time zone not null default now()
);

alter table public.recommendation_feedback
  drop constraint if exists recommendation_feedback_verdict_check;
alter table public.recommendation_feedback
  add constraint recommendation_feedback_verdict_check
  check (verdict in ('correct', 'incorrect', 'corrected', 'alternative_used'));

alter table public.recommendation_feedback
  drop constraint if exists recommendation_feedback_issue_check;
alter table public.recommendation_feedback
  add constraint recommendation_feedback_issue_check
  check (issue_type is null or issue_type in ('intent', 'reward_or_offer', 'card_choice'));

create index if not exists recommendation_feedback_created_idx
  on public.recommendation_feedback (created_at desc);
create index if not exists recommendation_feedback_verdict_created_idx
  on public.recommendation_feedback (verdict, created_at desc);
create index if not exists recommendation_feedback_user_created_idx
  on public.recommendation_feedback (user_id, created_at desc)
  where user_id is not null;

alter table public.recommendation_feedback enable row level security;

drop policy if exists "Clients can submit scoped recommendation feedback" on public.recommendation_feedback;
create policy "Clients can submit scoped recommendation feedback"
on public.recommendation_feedback
for insert
with check (
  (user_id is null and interaction_id is null)
  or (
    (select auth.uid()) = user_id
    and (
      interaction_id is null
      or exists (
        select 1
        from public.interactions
        where interactions.id = recommendation_feedback.interaction_id
          and interactions.user_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "Users can view own recommendation feedback" on public.recommendation_feedback;
create policy "Users can view own recommendation feedback"
on public.recommendation_feedback
for select
using ((select auth.uid()) = user_id);

revoke all on table public.recommendation_feedback from anon, authenticated;
grant insert on table public.recommendation_feedback to anon, authenticated;
grant select on table public.recommendation_feedback to authenticated;

create or replace view public.cardsmart_reliability_daily
with (security_invoker = true)
as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where event_name = 'payment_started') as payments_started,
  count(*) filter (where event_name = 'clarification_shown') as clarifications_shown,
  count(*) filter (where event_name = 'recommendation_viewed') as recommendations_viewed,
  count(*) filter (where event_name = 'recommendation_followed') as recommendations_followed,
  count(*) filter (where event_name = 'intent_corrected') as intents_corrected,
  count(*) filter (where event_name = 'reward_issue_reported') as reward_issues_reported,
  count(distinct session_id) as unique_sessions
from public.product_events
group by 1;

revoke all on public.cardsmart_reliability_daily from anon, authenticated;

comment on table public.product_events is
  'Privacy-minimised CardSmart product funnel events. Raw payment text is excluded from event metadata.';
comment on table public.recommendation_feedback is
  'Explicit user feedback and corrections. Corrections are review inputs and never auto-publish reward or merchant rules.';

select
  (select count(*) from public.product_events) as product_events,
  (select count(*) from public.recommendation_feedback) as recommendation_feedback,
  to_regclass('public.cardsmart_reliability_daily') is not null as reliability_view_ready;
