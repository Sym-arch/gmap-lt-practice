-- =====================================================================
-- 会員情報テーブル＋メール認証完了トリガー（Supabase SQL Editorで実行）
-- =====================================================================
-- ・signupで auth.users が作られた時点では user_metadata に氏名等が入るだけ
-- ・ユーザーがメール認証リンクを踏んで email_confirmed_at が入ると、
--   トリガーが発火して profiles テーブルに正式な会員情報を挿入する
-- =====================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  furigana text not null default '',
  university text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 本人は自分の行を読める
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 本人が氏名等を編集できる（任意）
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ---------- メール認証完了時のトリガー ----------
-- auth.users.email_confirmed_at が NULL → 値付き に変わった瞬間、
-- raw_user_meta_data から会員情報を取り出して profiles に insert する。
create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null or old.email_confirmed_at <> new.email_confirmed_at) then
    insert into public.profiles (id, full_name, furigana, university, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(new.raw_user_meta_data ->> 'furigana', ''),
      coalesce(new.raw_user_meta_data ->> 'university', ''),
      new.email
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_email_confirmed();
