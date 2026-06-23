-- survey_responses: ユーザーアンケート回答テーブル
-- user_id で auth.users / quiz_progress / subscriptions と JOIN 分析可能
--
-- 結合可能な既存データ:
--   profiles         (user_id)                    ← 氏名・大学・メール
--   subscriptions    (user_id, status, source)     ← 課金状況・モニタープラン判定
--   quiz_progress    (user_id, exam_id, best_score, attempts) ← 試験別成績
--   quiz_answers     (user_id, exam_id, correct, answered_at) ← 解答ログ
--   wrong_questions  (user_id, exam_id, test_id, q_index)     ← 苦手分野

create table if not exists public.survey_responses (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,

  -- セクション1: アプリの使用感 (1〜5 段階)
  q1_operability  int check (q1_operability  between 1 and 5),  -- 操作性・速度
  q2_signup_ease  int check (q2_signup_ease  between 1 and 5),  -- サインアップのしやすさ
  q3_readability  int check (q3_readability  between 1 and 5),  -- 問題文の見やすさ
  q4_explanation  int check (q4_explanation  between 1 and 5),  -- 解説のわかりやすさ
  q5_dashboard    int check (q5_dashboard    between 1 and 5),  -- ダッシュボードの使いやすさ
  q6_difficulty   int check (q6_difficulty   between 1 and 5),  -- 難易度・形式の適切さ
  q7_feedback     text,                                          -- 自由記述（改善点）

  -- セクション2: 就活の意識調査
  q8_target_firms   text[],  -- 志望コンサルファーム (複数選択)
  q9_other_targets  text[],  -- ファーム以外の志望業界 (複数選択)
  q9_other_free     text,    -- その他志望先 (自由記述)
  q10_juku_status   text,    -- 就活塾の利用状況 (単一選択)
  q11_juku_needs    text[],  -- 就活塾に求めること (複数選択)
  q11_juku_other    text,    -- その他ニーズ (自由記述)
  q12_price_range   text,    -- 適切な料金 (単一選択)
  q13_study_hours   text,    -- 1日の就活対策時間 (単一選択)
  q14_concerns      text,    -- 就活の悩み (自由記述)

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint survey_responses_user_unique unique (user_id)
);

alter table public.survey_responses enable row level security;

create policy "自分の回答を読める" on public.survey_responses
  for select using (auth.uid() = user_id);

create policy "自分の回答を作成できる" on public.survey_responses
  for insert with check (auth.uid() = user_id);

create policy "自分の回答を更新できる" on public.survey_responses
  for update using (auth.uid() = user_id);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger survey_responses_updated_at
  before update on public.survey_responses
  for each row execute procedure public.set_updated_at();
