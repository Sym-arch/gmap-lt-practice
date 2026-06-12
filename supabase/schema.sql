-- SupabaseのSQL Editorでこのファイルの内容を実行してください。
-- 購入記録テーブル：誰が全試験パックを購入したかを保持する。

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null default 'all_access',
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

-- 本人は自分の購入記録を読める（プレミアム判定に使用）
create policy "read own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

-- insert/update/delete のポリシーは作らない。
-- 書き込みはサーバー側（service roleキー）からのみ行う。
