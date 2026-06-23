-- ==============================================================
-- Migration 001: plan・survey_completed 追加 + メール候補取得関数
-- Supabase SQL Editor で実行してください
-- ==============================================================

-- 1. plan カラムを追加（monitor / normal / master）
alter table public.subscriptions
  add column if not exists plan text not null default 'normal';

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('monitor', 'normal', 'master'));

-- 2. アンケート完了フラグ
alter table public.subscriptions
  add column if not exists survey_completed boolean not null default false;

-- 3. 既存データマイグレーション
-- source='campaign'（初月無料）の既存ユーザーを monitor プランへ
update public.subscriptions
  set plan = 'monitor'
  where source = 'campaign' and plan = 'normal';

-- purchases テーブルの旧買い切りユーザーを subscriptions へ移行
-- （subscriptions が無い人のみ insert）
insert into public.subscriptions (user_id, status, plan)
  select p.user_id, 'active', 'normal'
  from public.purchases p
  where not exists (
    select 1 from public.subscriptions s where s.user_id = p.user_id
  )
on conflict (user_id) do nothing;

-- 4. メール送信候補を取得する DB 関数
-- auth.users へのアクセスが必要なため security definer で定義
create or replace function public.get_monitor_email_candidates()
returns table (
  user_id            uuid,
  email              text,
  created_at         timestamptz,
  first_name         text,
  last_name          text,
  sub_status         text,
  current_period_end timestamptz
)
security definer
set search_path = public
language sql
as $$
  select
    u.id,
    u.email,
    u.created_at,
    coalesce(u.raw_user_meta_data->>'first_name', '') as first_name,
    coalesce(u.raw_user_meta_data->>'last_name',  '') as last_name,
    s.status                                          as sub_status,
    s.current_period_end
  from auth.users u
  join public.subscriptions s on s.user_id = u.id
  where s.plan           = 'monitor'
    and s.survey_completed = false
    and u.email is not null;
$$;
