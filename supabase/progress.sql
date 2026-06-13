-- =====================================================================
-- 学習進捗テーブル一式（Supabase SQL Editor で実行してください）
-- =====================================================================
-- 以下の3つのテーブルとRLSポリシーをまとめて作成します。
--   quiz_progress    : 試験×回ごとの成績（ベスト・最終・受験回数）
--   quiz_answers     : 個別の解答ログ（学習量グラフ・通算正答率の元データ）
--   wrong_questions  : 間違えた問題の復習リスト（端末をまたいで同期）
-- いずれも本人のみが自分の行を読み書きできる Row Level Security を有効化。
-- =====================================================================

-- ---------- 1) quiz_progress：試験×回ごとの成績 ----------
create table if not exists public.quiz_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id text not null,
  test_id int not null,
  best_score int not null,
  last_score int not null,
  total int not null,
  attempts int not null default 1,
  last_at timestamptz not null default now(),
  primary key (user_id, exam_id, test_id)
);

alter table public.quiz_progress enable row level security;

create policy "read own progress"
  on public.quiz_progress for select
  using (auth.uid() = user_id);

create policy "upsert own progress"
  on public.quiz_progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.quiz_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ---------- 2) quiz_answers：個別の解答ログ ----------
create table if not exists public.quiz_answers (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id text not null,
  test_id int not null,
  q_index int not null,
  correct boolean not null,
  answered_at timestamptz not null default now()
);

create index if not exists quiz_answers_user_time_idx
  on public.quiz_answers (user_id, answered_at desc);

alter table public.quiz_answers enable row level security;

create policy "read own answers"
  on public.quiz_answers for select
  using (auth.uid() = user_id);

create policy "insert own answers"
  on public.quiz_answers for insert
  with check (auth.uid() = user_id);


-- ---------- 3) wrong_questions：復習リスト ----------
create table if not exists public.wrong_questions (
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id text not null,
  test_id int not null,
  q_index int not null,
  added_at timestamptz not null default now(),
  primary key (user_id, exam_id, test_id, q_index)
);

alter table public.wrong_questions enable row level security;

create policy "read own wrongs"
  on public.wrong_questions for select
  using (auth.uid() = user_id);

create policy "insert own wrongs"
  on public.wrong_questions for insert
  with check (auth.uid() = user_id);

create policy "delete own wrongs"
  on public.wrong_questions for delete
  using (auth.uid() = user_id);
