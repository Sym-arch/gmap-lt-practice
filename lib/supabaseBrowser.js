"use client";

import { createBrowserClient } from "@supabase/ssr";

let client = null;

/* ブラウザ用Supabaseクライアント。環境変数が未設定なら null（ログイン機能オフ） */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) client = createBrowserClient(url, anonKey);
  return client;
}
