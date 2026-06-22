"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import Spinner from "@/components/Spinner";

/* メール認証リンクのクライアント側ハンドラ。
   通常は サーバールート /auth/confirm（token_hash方式）で完結するが、
   このページは次の役割を担う：
   - サーバールートが検証に失敗したときのエラー表示（?error=...）
   - 旧テンプレート（code方式 / 暗黙フローのhashトークン）のフォールバック検証
   - 認証成功時は、そのままログイン状態で目的ページへ自動遷移する */
export default function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState("working"); // working | done | error
  const [detail, setDetail] = useState("");

  const next = sanitizeNext(searchParams.get("next"));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        if (!cancelled) {
          setState("error");
          setDetail("認証機能が未設定です。");
        }
        return;
      }

      const url = new URL(window.location.href);
      const qs = url.searchParams;
      const hash = new URLSearchParams(
        url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
      );

      const serverError = qs.get("error"); // サーバールートからの失敗通知
      const tokenHash = qs.get("token_hash") || hash.get("token_hash");
      const type = qs.get("type") || hash.get("type") || "email";
      const code = qs.get("code") || hash.get("code");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const errDesc =
        qs.get("error_description") || hash.get("error_description");

      let ok = false;

      try {
        if (accessToken && refreshToken) {
          // 暗黙フロー：URLハッシュにトークンが乗ってくる方式
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) ok = true;
          else setDetail(error.message);
        } else if (tokenHash) {
          // token_hash 方式（別端末でも有効）
          const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          });
          if (!error) ok = true;
          else setDetail(error.message);
        } else if (code) {
          // PKCE の code 方式（登録した端末と同じブラウザでのみ有効）
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) ok = true;
          else setDetail(error.message);
        } else {
          // トークンが無い：すでにセッションがあるか確認
          const { data } = await supabase.auth.getSession();
          if (data.session) ok = true;
          else if (errDesc) setDetail(errDesc);
          else if (serverError) setDetail("認証リンクの検証に失敗しました。");
        }
      } catch (e) {
        setDetail((e && e.message) || "");
      }

      // サーバー側の保険：ログイン済みなのに未確認なら確認済みにする
      try {
        await fetch("/api/auth/ensure-confirmed", { method: "POST" });
      } catch {
        /* 失敗しても致命的ではない */
      }

      if (cancelled) return;

      if (ok) {
        // セッションが作られているので、そのままログイン状態で目的ページへ遷移
        setState("done");
        router.replace(next);
        router.refresh();
      } else {
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, next]);

  if (state === "working") {
    return (
      <div className="card trial-end">
        <Spinner label="メール認証を確認しています" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="card trial-end">
        <div className="big">認証リンクの確認に失敗しました</div>
        <p>
          リンクの有効期限が切れているか、すでに使用済みの可能性があります。
          <br />
          お手数ですが、ログイン画面からログインをお試しください。
          ログインできない場合は、もう一度会員登録メールの認証リンクを開いてください。
        </p>
        {detail && (
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
            （{detail}）
          </p>
        )}
        <Link href="/login" className="btn block">
          ログイン画面へ
        </Link>
      </div>
    );
  }

  // done（自動遷移までのつなぎ表示）
  return (
    <div className="card trial-end">
      <Spinner label="ログインしています" />
    </div>
  );
}

/* オープンリダイレクト防止：サイト内の相対パスのみ許可 */
function sanitizeNext(next) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}
