"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UpgradePanel() {
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "エラーが発生しました。");
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
        <div style={{ fontWeight: 800, marginBottom: 10 }}>ご登録済みです</div>
        <Link href="/" className="btn">試験を選んで開始する</Link>
      </div>
    );
  }

  // 未ログイン or ログイン済みだが未購入 → どちらもメールアドレス入力＋決済へ
  return (
    <div className="upgrade-form">
      {!me.loggedIn && (
        <div className="upgrade-email-field">
          <label htmlFor="upgrade-email">メールアドレス</label>
          <input
            id="upgrade-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-name@example.com"
            autoComplete="email"
            required
          />
        </div>
      )}
      <button className="btn" onClick={buy} disabled={busy || (!me.loggedIn && !email)}>
        {busy ? "お手続きページへ移動中…" : "決済に進む"}
      </button>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 10, lineHeight: 1.6 }}>
        Stripeの決済ページに移動します。決済完了後、ご登録のメールアドレスに
        ログイン用パスワードの設定リンクをお送りします。
      </div>
      {error && (
        <div className="error-box" style={{ marginTop: 12, color: "#fff", background: "rgba(255,255,255,0.18)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
