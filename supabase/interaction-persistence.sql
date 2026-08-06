-- CardSmart recommendation and tracked-payment activity persistence.
-- Safe to run more than once in the Supabase SQL Editor.

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  query text,
  category text,
  amount numeric,
  best_card text,
  best_card_id text,
  benefit text,
  estimated_saving text,
  estimated_reward numeric,
  incremental_reward numeric,
  reason text,
  tip text,
  full_response jsonb not null default '{}'::jsonb,
  status text not null default 'checked',
  tracked_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

alter table public.interactions
  add column if not exists category text,
  add column if not exists amount numeric,
  add column if not exists best_card_id text,
  add column if not exists estimated_reward numeric,
  add column if not exists incremental_reward numeric,
  add column if not exists full_response jsonb not null default '{}'::jsonb,
  add column if not exists status text default 'checked',
  add column if not exists tracked_at timestamp with time zone;

update public.interactions
set status = 'checked'
where status is null;

do $$
begin
  alter table public.interactions
    add constraint interactions_status_check
    check (status in ('checked', 'tracked'));
exception
  when duplicate_object then null;
end $$;

create index if not exists interactions_user_created_idx
  on public.interactions (user_id, created_at desc);

alter table public.interactions enable row level security;

drop policy if exists "Users can view own interactions" on public.interactions;
drop policy if exists "Users can insert own interactions" on public.interactions;
drop policy if exists "Users can update own interactions" on public.interactions;
drop policy if exists "Users can delete own interactions" on public.interactions;

create policy "Users can view own interactions"
on public.interactions
for select
using ((select auth.uid()) = user_id);

create policy "Users can insert own interactions"
on public.interactions
for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update own interactions"
on public.interactions
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own interactions"
on public.interactions
for delete
using ((select auth.uid()) = user_id);

revoke all on table public.interactions from anon;
grant select, insert, update, delete on table public.interactions to authenticated;
