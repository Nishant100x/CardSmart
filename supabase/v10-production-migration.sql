-- CardSmart V10.6 production preferences and self-service deletion.
-- Run after the existing profile, wallet and interaction migrations.

alter table public.profiles
  add column if not exists user_preferences jsonb not null default '{}'::jsonb;

create or replace function public.delete_cardsmart_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_cardsmart_account() from public;
grant execute on function public.delete_cardsmart_account() to authenticated;
