"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import Spinner from "@/components/Spinner";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

function trackConversion(isTrial) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    window.fbq("track", "CompleteRegistration");
    window.fbq("track", isTrial ? "StartTrial" : "Subscribe", {
      value: isTrial ? 0 : 1480,
      currency: "JPY",
    });
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", "sign_up", {
      method: isTrial ? "trial" : "paid",
      value: isTrial ? 0 : 1480,
      currency: "JPY",
    });
  }
}

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState("form"); // form / pay / finalizing / check-email
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [campaign, setCampaign] = useState(null);

  const [form, setForm] = useState({
    last_name: "",
    first_name: "",
    email: "",
    password: "",
  });

  const dataRef = useRef({ sessionId: null, trial: false, form });
  dataRef.current.form = form;

  // キャンペーン状況を取得
  useEffect(() => {
    fetch("/api/campaign")
      .then((r) => r.json())
      .then(setCampaign)
      .catch(() => setCampaign({ active: false }));
  }, []);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    if (!form.last_name.trim())  return "姓を入力してください。";
    if (!form.first_name.trim()) return "名を入力してください。";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "メールアドレスの形式が正しくありません。";
    if (form.password.length < 8)
      return "パスワードは8文字以上で設定してください。";
    return null;
  }

  async function startCheckout(e) {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) { setError(v); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last_name:  form.last_name.trim(),
          first_name: form.first_name.trim(),
          email:      form.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "お手続きを開始できませんでした。");
        return;
      }
      dataRef.current.sessionId = data.sessionId;
      dataRef.current.trial     = data.trial;
      setClientSecret(data.clientSecret);
      setStep("pay");
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  const onCheckoutComplete = useCallback(async () => {
    setBusy(true);
    setError("");
    setStep("finalizing");
    try {
      const { sessionId, form: f } = dataRef.current;
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setError("認証機能が未設定です。管理者にお問い合わせください。");
        return;
      }

      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email:    f.email.trim(),
        password: f.password,
        options: {
          data: {
            last_name:  f.last_name.trim(),
            first_name: f.first_name.trim(),
            full_name: `${f.last_name.trim()} ${f.first_name.trim()}`.trim(),
          },
        },
      });
      if (signErr && !/already|registered|exists/i.test(signErr.message)) {
        setError("アカウント作成に失敗しました：" + signErr.message);
        return;
      }
      let session = signData?.session || null;

      // 決済をアカウントに紐づけて保存
      await fetch("/api/signup/complete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId }),
      }).catch(() => {});

      // セッションを確保
      if (!session) {
        session = (await supabase.auth.getSession()).data.session || null;
      }
      if (!session) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email:    f.email.trim(),
          password: f.password,
        });
        session = signInData?.session || null;
      }

      if (session) {
        trackConversion(dataRef.current.trial);
        window.location.href = "/";
        return;
      }

      setStep("check-email");
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

  // ---------- 全画面ローディング ----------
  if (step === "finalizing") {
    return (
      <div className="loading-overlay">
        {error ? (
          <div className="card trial-end" style={{ maxWidth: 420 }}>
            <div className="big">エラーが発生しました</div>
            <p>{error}</p>
            <Link href="/login" className="btn block">ログイン画面へ</Link>
          </div>
        ) : (
          <Spinner label="ご登録を完了しています。少々お待ちください…" />
        )}
      </div>
    );
  }

  // ---------- check-email フォールバック ----------
  if (step === "check-email") {
    return (
      <div className="card trial-end">
        <div className="big">メール認証を完了してください</div>
        <p>
          ご登録のメールアドレス宛に <b>Top Firm Pass</b> から認証メールをお送りしました。<br />
          メール内のリンクをクリックして認証を完了するとログインできます。
        </p>
        <Link href="/login" className="link-btn">ログイン画面へ</Link>
      </div>
    );
  }

  // ---------- 決済画面 ----------
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
          <h2>② お支払い情報の登録</h2>
          <div className="subtitle">
            {dataRef.current.trial
              ? "初月の請求はありません。トライアル終了後に月額料金が発生します。"
              : "カード情報を入力してください。登録後すぐに学習を始められます。"}
          </div>
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
          onClick={() => { setStep("form"); setClientSecret(null); }}
        >
          入力内容を修正する
        </button>
      </div>
    );
  }

  // ---------- フォーム画面（既定） ----------
  if (busy && !error) {
    return <div className="card"><Spinner label="準備中…" /></div>;
  }

  return (
    <form onSubmit={startCheckout}>
      {campaign?.active && (
        <div className="campaign-banner">
          <span className="campaign-badge">先着{campaign.limit}名</span>
          <div>
            <b>初月無料キャンペーン実施中</b>
            <span>いまご登録の方は最初の{campaign.trialDays}日間が無料。</span>
          </div>
        </div>
      )}

      <div className="subtitle">
        {campaign?.active
          ? `初月（${campaign.trialDays}日間）は無料で、トライアル終了後に月額のご請求が始まります。`
          : "ご登録後すぐに学習を始められます。"}
      </div>

      <div className="card">
        <h2>① 個人情報</h2>
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

        {error && <div className="error-box">{error}</div>}

        <button className="btn block" disabled={busy}>
          {busy
            ? "決済画面を準備中…"
            : campaign?.active
              ? "② お支払いに進む（初月の請求はありません）"
              : "② お支払いに進む"}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        すでにアカウントをお持ちの方は <Link href="/login">こちらからログイン</Link>
      </div>
    </form>
  );
}
