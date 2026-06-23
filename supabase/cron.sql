-- ==============================================================
-- Supabase Cron 設定（pg_cron + pg_net）
-- Supabase SQL Editor で実行してください
--
-- 事前準備：
--   Supabase ダッシュボード > Database > Extensions で
--   「pg_cron」と「pg_net」を有効化してください
--
-- 変数の置き換え：
--   YOUR_PROJECT_REF  → Supabase Project Settings > General > Reference ID
--   YOUR_SERVICE_ROLE_KEY → Project Settings > API > service_role key
-- ==============================================================

-- 既存のジョブがあれば削除してから登録
select cron.unschedule('send-survey-emails-daily')
  where exists (select 1 from cron.job where jobname = 'send-survey-emails-daily');

-- 毎日 日本時間 9:00（UTC 0:00）に Edge Function を呼び出す
select cron.schedule(
  'send-survey-emails-daily',
  '0 0 * * *',
  $$
  select
    net.http_post(
      url        := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-survey-emails',
      headers    := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
                   ),
      body       := '{}'::jsonb
    ) as request_id;
  $$
);

-- 登録確認
select jobid, jobname, schedule, active from cron.job;
