-- ECP Lab — Push Notifications Infrastructure (Aug 14, 2026)
-- Architecture:
--   1. Mobile app registers an Expo push token into users.push_token (see mobile/lib/push.ts)
--   2. On ANY insert into notifications, a DB trigger fires and calls the
--      notify-push edge function via pg_net (async, non-blocking)
--   3. The edge function resolves recipients (user_id or role) -> push tokens
--      -> sends via the Expo Push API (https://exp.host/--/api/v2/push/send)
--
-- Edge function source: deploy `notify-push` (see mobile push setup / supabase dashboard)
--
-- Prereqs:
--   - extension pg_net enabled
--   - vault secret 'push_service_role_key' = SUPABASE_SERVICE_ROLE_KEY
--   - edge function notify-push deployed and ACTIVE

-- ============================================================================
-- 1. Enable pg_net (async HTTP from Postgres)
-- ============================================================================
create extension if not exists pg_net;

-- ============================================================================
-- 2. Store the service role key in Vault (used to auth the edge function call)
--    NOTE: the real value must be set. Run in a controlled environment:
--    select vault.update_secret(
--      (select id from vault.secrets where name = 'push_service_role_key' limit 1),
--      '<SUPABASE_SERVICE_ROLE_KEY>', 'push_service_role_key');
-- ============================================================================
insert into vault.secrets (name, secret)
values ('push_service_role_key', 'REPLACE_WITH_SERVICE_ROLE_KEY')
on conflict (name) do nothing;

-- ============================================================================
-- 3. Trigger: after INSERT on notifications -> call notify-push edge function
-- ============================================================================
create or replace function public.notify_push_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_key text;
  v_edge_url text := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify-push';
  v_req bigint;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_service_role_key'
  limit 1;

  if v_key is null or v_key = '' or v_key = 'REPLACE_WITH_SERVICE_ROLE_KEY' then
    return new;
  end if;

  select net.http_post(
    url := v_edge_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('notificationId', new.id)
  ) into v_req;

  return new;
end;
$fn$;

drop trigger if exists notify_push_on_insert_trigger on public.notifications;
create trigger notify_push_on_insert_trigger
after insert on public.notifications
for each row
execute function public.notify_push_on_insert();
