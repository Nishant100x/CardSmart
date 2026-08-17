-- CardSmart monitoring verification and manual review queue.

-- 1. Latest runs
select
  id,
  status,
  sources_checked,
  sources_changed,
  candidates_created,
  started_at,
  finished_at,
  error_log
from public.card_monitoring_runs
order by started_at desc
limit 20;

-- 2. Coverage and source health
select
  count(*) filter (where is_active) as active_sources,
  count(distinct card_id) filter (where is_active and card_id is not null) as priority_cards_covered,
  count(*) filter (where last_content_hash is not null) as baselines_created,
  count(*) filter (where last_error is not null) as sources_with_errors,
  min(last_checked_at) filter (where is_active) as oldest_check,
  max(last_checked_at) filter (where is_active) as newest_check
from public.card_sources;

-- 3. Sources needing attention
select issuer, card_id, source_type, url, last_http_status, last_checked_at, last_error
from public.card_sources
where is_active and last_error is not null
order by last_checked_at desc nulls last;

-- 4. Human review queue. Reviewing this result does not change production.
select
  candidate.id,
  candidate.detected_at,
  candidate.issuer,
  candidate.card_id,
  candidate.change_type,
  candidate.confidence,
  candidate.old_value,
  candidate.proposed_value,
  candidate.evidence,
  source.url as official_source
from public.card_change_candidates candidate
left join public.card_sources source on source.id = candidate.source_id
where candidate.status = 'pending'
order by candidate.detected_at desc;
