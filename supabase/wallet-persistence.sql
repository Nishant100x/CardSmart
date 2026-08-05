-- CardSmart wallet and cap-usage persistence.
-- Reuses the existing public.cards table and is safe to run more than once.

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  bank text,
  name text,
  rate text,
  benefits text[],
  details jsonb not null default '{}'::jsonb,
  is_preset boolean not null default true,
  icon text,
  cap_usage_value numeric,
  cap_usage_source text,
  cap_usage_updated_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.cards
  add column if not exists cap_usage_value numeric,
  add column if not exists cap_usage_source text,
  add column if not exists cap_usage_updated_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

do $$
begin
  alter table public.cards
    add constraint cards_cap_usage_source_check
    check (cap_usage_source is null or cap_usage_source in ('manual', 'tracked'));
exception
  when duplicate_object then null;
end $$;

create index if not exists cards_user_created_idx
  on public.cards (user_id, created_at);

create index if not exists cards_user_card_idx
  on public.cards (user_id, card_id);

create or replace function public.set_cardsmart_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cards_updated_at on public.cards;

create trigger set_cards_updated_at
  before update on public.cards
  for each row execute procedure public.set_cardsmart_updated_at();

alter table public.cards enable row level security;

drop policy if exists "Users can view own cards" on public.cards;
drop policy if exists "Users can insert own cards" on public.cards;
drop policy if exists "Users can update own cards" on public.cards;
drop policy if exists "Users can delete own cards" on public.cards;

create policy "Users can view own cards"
on public.cards
for select
using ((select auth.uid()) = user_id);

create policy "Users can insert own cards"
on public.cards
for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update own cards"
on public.cards
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own cards"
on public.cards
for delete
using ((select auth.uid()) = user_id);

revoke all on table public.cards from anon;
grant select, insert, update, delete on table public.cards to authenticated;
