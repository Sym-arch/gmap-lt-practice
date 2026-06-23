-- ==============================================================
-- email_logs テーブル（二重送信防止・送信履歴管理）
-- Supabase SQL Editor で実行してください
-- ==============================================================

create table if not exists public.email_logs (
  id          bigserial    primary key,
  user_id     uuid         not null references auth.users(id) on delete cascade,
  email_type  text         not null,
  -- 'survey_started'               モニタープラン開始3日後
  -- 'survey_reminder'              サインアップ7日後
  -- 'monitor_expired_paid_started' サインアップ8日後（status=active のとき）
  sent_at     timestamptz  not null default now(),
  success     boolean      not null default true,
  error_msg   text
);

-- 重複チェック用インデックス（user_id + email_type + success でまとめて検索）
create index if not exists email_logs_lookup_idx
  on public.email_logs (user_id, email_type, success);

-- Edge Function は service role で動作するため RLS はかけるが select ポリシーは付与しない
alter table public.email_logs enable row level security;
