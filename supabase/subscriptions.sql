-- =====================================================================
-- サブスクリプション状態テーブル（Supabase SQL Editorで実行）
-- =====================================================================
-- ・決済完了時にアプリ（service role）が user_id 基準で upsert
-- ・以降の更新／解約は Stripe Webhook が stripe_subscription_id 基準で更新
-- ・アクセス判定（lib/access.js）は本人が自分の行を読めればよいので select のみ許可
-- =====================================================================

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- 本人は自分のサブスク状態を読める（書き込みは service role が RLS をバイパスして実行）
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);
