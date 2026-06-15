"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import Spinner from "@/components/Spinner";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

const STORAGE_KEY = "tfp_signup_pw";

export default function SignupForm() {
  const [step, setStep] = useState("form"); // form / pay / done
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState(null);

  const [form, setForm] = useState({
    last_name: "",
    first_name: "",
    university: "",
    email: "",
    email2: "",
    password: "",
    password2: "",
  });

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    if (!form.last_name.trim()) return "姓を入力してください。";
    if (!form.first_name.trim()) return "名を入力してください。";
    if (!form.university.trim()) return "ご所属の大学を入力してください。";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "メールアドレスの形式が正しくありません。";
    if (form.email !== form.email2)
      return "確認用メールアドレスが一致しません。";
    if (form.password.length < 8)
      return "パスワードは8文字以上で設定してください。";
    if (form.password !== form.password2)
      return "確認用パスワードが一致しません。";
    return null;
  }

  async function startCheckout(e) {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last_name: form.last_name.trim(),
          first_name: form.first_name.trim(),
          university: form.university.trim(),
          email: form.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "お手続きを開始できませんでした。");
        return;
      }
      // パスワードはサーバーに送らず、決済完了後にここから完了APIに渡す
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionId: data.sessionId, password: form.password })
      );
      setClientSecret(data.clientSecret);
      setStep("pay");
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  // Stripe Embedded Checkout の完了コールバック
  const onCheckoutComplete = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError(
          "登録情報が見つかりません。最初からやり直してください。"
        );
        return;
      }
      const { sessionId, password } = JSON.parse(raw);
      const res = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, password }),
      });
      const data = await res.json();
      sessionStorage.removeItem(STORAGE_KEY);
      if (!res.ok) {
        setError(data.error || "会員登録の完了に失敗しました。");
        return;
      }
      setStep("done");
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }, []);

  const options = useMemo(
    () => (clientSecret ? { clientSecret, onComplete: onCheckoutComplete } : null),
    [clientSecret, onCheckoutComplete]
  );

  /* ---------- 完了画面 ---------- */
  if (step === "done") {
    return (
      <div className="card trial-end">
        <div className="big">Top Firm Pass 会員登録ありがとうございます</div>
        <p>
          会員登録が完了しました。
          <br />
          ご登録のメールアドレスとパスワードで、そのままログインいただけます。
        </p>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14 }}>
          ご登録のメールアドレスには、決済完了の領収メールをお送りしています。
        </p>
        <Link href="/login" className="btn block">
          ログインへ
        </Link>
      </div>
    );
  }

  /* ---------- 決済画面 ---------- */
  if (step === "pay") {
    if (!stripePromise) {
      return (
        <div className="card">
          <div className="error-box">
            決済の公開キー（NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY）が未設定です。
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <h2>② お支払い</h2>
          <div className="subtitle">会員登録をお願いします。</div>
        </div>
        {options ? (
          <div id="stripe-embedded-checkout-wrap">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          <div className="card"><Spinner /></div>
        )}
        {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setStep("form");
            setClientSecret(null);
          }}
        >
          入力内容を修正する
        </button>
      </div>
    );
  }

  /* ---------- フォーム画面（既定） ---------- */
  return (
    <form onSubmit={startCheckout}>
      <div className="card">
        <h2>① 個人情報</h2>
        <div className="subtitle">
          メール認証完了後、これらの情報をご登録のアカウントに紐づけます。
        </div>

        <div className="field-row">
          <div className="field">
            <label>姓（漢字）</label>
            <input
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
              required
              autoComplete="family-name"
              placeholder="例：山田"
            />
          </div>
          <div className="field">
            <label>名（漢字）</label>
            <input
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              required
              autoComplete="given-name"
              placeholder="例：太郎"
            />
          </div>
        </div>
        <div className="field">
          <label>ご所属の大学</label>
          <input
            value={form.university}
            onChange={(e) => setField("university", e.target.value)}
            required
            placeholder="例：東京大学"
          />
        </div>
        <div className="field">
          <label>メールアドレス</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>メールアドレス（確認）</label>
          <input
            type="email"
            value={form.email2}
            onChange={(e) => setField("email2", e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>パスワード（8文字以上）</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label>パスワード（確認）</label>
          <input
            type="password"
            value={form.password2}
            onChange={(e) => setField("password2", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <button className="btn block" disabled={busy}>
          {busy ? "決済画面を準備中…" : "② お支払いに進む"}
        </button>
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        すでにアカウントをお持ちの方は <Link href="/login">こちらからログイン</Link>
      </div>
    </form>
  );
}
