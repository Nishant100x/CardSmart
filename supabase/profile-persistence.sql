-- CardSmart recommendation profile persistence.
-- Safe to run more than once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists mobile_number text,
  add column if not exists mobile_verified_at timestamp with time zone,
  add column if not exists work_status text,
  add column if not exists primary_card_goal text,
  add column if not exists annual_fee_comfort text,
  add column if not exists age_range text,
  add column if not exists credit_score_range text,
  add column if not exists monthly_spends jsonb not null default '{}'::jsonb;

create or replace function public.handle_cardsmart_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, mobile_number)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'mobile_number'
  )
  on conflict (id) do update
  set
    name = coalesce(excluded.name, public.profiles.name),
    mobile_number = coalesce(excluded.mobile_number, public.profiles.mobile_number);

  return new;
end;
$$;

drop trigger if exists on_cardsmart_user_created on auth.users;

create trigger on_cardsmart_user_created
  after insert on auth.users
  for each row execute procedure public.handle_cardsmart_new_user();

insert into public.profiles as p (id, name, mobile_number)
select
  id,
  raw_user_meta_data ->> 'name',
  raw_user_meta_data ->> 'mobile_number'
from auth.users
on conflict (id) do update
set
  name = coalesce(p.name, excluded.name),
  mobile_number = coalesce(p.mobile_number, excluded.mobile_number);

create or replace function public.set_cardsmart_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_cardsmart_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
using ((select auth.uid()) = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
grant select, insert, update on table public.profiles to authenticated;
