-- Add mobile contact support to an existing CardSmart profile setup.
-- Safe to run more than once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists mobile_number text,
  add column if not exists mobile_verified_at timestamp with time zone;

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
