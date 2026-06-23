-- purchases テーブルは廃止。ユーザー管理は subscriptions に一本化。
-- 既存の purchases テーブルが残っている場合は以下で削除してください。
drop table if exists public.purchases cascade;
