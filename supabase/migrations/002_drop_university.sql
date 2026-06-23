-- ==============================================================
-- Migration 002: profiles.university カラムを削除
-- Supabase SQL Editor で実行してください
-- ==============================================================

-- university カラムを削除
alter table public.profiles
  drop column if exists university;

-- トリガー関数を更新（university 削除・Google OAuth の metadata にも対応）
create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null or old.email_confirmed_at <> new.email_confirmed_at) then
    insert into public.profiles (id, last_name, first_name, email)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data ->> 'last_name',
        new.raw_user_meta_data ->> 'family_name',
        ''
      ),
      coalesce(
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'given_name',
        new.raw_user_meta_data ->> 'name',
        ''
      ),
      new.email
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
