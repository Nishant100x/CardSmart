-- CardSmart hourly monitoring schedule.
-- Prerequisite: deploy the card-monitor Edge Function and run
-- card-monitoring-setup.sql first.
--
-- Create these two Vault secrets once before running the schedule below:
-- select vault.create_secret(
--   'https://YOUR_PROJECT_REF.supabase.co',
--   'cardsmart_project_url',
--   'CardSmart Supabase project URL'
-- );
-- select vault.create_secret(
--   'REPLACE_WITH_THE_SAME_RANDOM_MONITOR_SECRET_USED_BY_THE_EDGE_FUNCTION',
--   'cardsmart_monitor_secret',
--   'Authenticates scheduled CardSmart monitoring runs'
-- );

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'cardsmart_project_url'
  ) then
    raise exception 'Missing Vault secret: cardsmart_project_url';
  end if;
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'cardsmart_monitor_secret'
  ) then
    raise exception 'Missing Vault secret: cardsmart_monitor_secret';
  end if;
end;
$$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'cardsmart-card-monitor-hourly';

select cron.schedule(
  'cardsmart-card-monitor-hourly',
  '7 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'cardsmart_project_url'
      limit 1
    ) || '/functions/v1/card-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-monitor-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cardsmart_monitor_secret'
        limit 1
      )
    ),
    body := '{"limit":5}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);

select jobid, jobname, schedule, active
from cron.job
where jobname = 'cardsmart-card-monitor-hourly';
