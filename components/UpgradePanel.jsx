"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UpgradePanel() {
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, []);

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error === "login_required" ? "ログインが必要です。" : data.error || "エラーが発生しました。");
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  if (!me) {
    return <button className="btn" disabled>読み込み中…</button>;
  }

  if (me.premium) {
    return (
      <div>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>✓ ご登録済みです</div>
        <Link href="/" className="btn">試験を選んで開始する</Link>
      </div>
    );
  }

  if (!me.loggedIn) {
    return (
      <div>
        <Link href="/login?next=/upgrade" className="btn">
          アカウントを作成して進む
        </Link>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
          ご登録内容をアカウントに紐づけるため、先にアカウント作成（無料）をお願いします。
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn" onClick={buy} disabled={busy}>
        {busy ? "お手続きページへ移動中…" : "会員登録を完了する"}
      </button>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
        Stripeの安全な決済ページに移動します。
      </div>
      {error && (
        <div className="error-box" style={{ marginTop: 12, color: "#fff", background: "rgba(255,255,255,0.15)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
