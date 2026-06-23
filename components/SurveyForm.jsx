"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";

/* ---- 選択肢定義 ---- */
const FIRMS = [
  "McKinsey", "BCG", "Bain", "Roland Berger",
  "Deloitte", "PwC", "EY", "KPMG",
  "Accenture", "BayCurrent", "ABeam", "その他",
];
const OTHER_TARGETS = [
  "総合商社", "投資銀行", "PE/VC", "メガベンチャー",
  "大手メーカー", "IT/SaaS", "官公庁", "その他",
];
const JUKU_NEEDS = [
  "ES添削", "面接対策", "ケース面接対策", "Webテスト対策",
  "GD対策", "業界研究", "企業別対策", "メンター相談", "その他",
];
const RATING_LABELS = { 1: "よくない", 2: "やや不満", 3: "普通", 4: "良い", 5: "とても良い" };

/* ---- 初期フォーム状態 ---- */
const INIT = {
  q1_operability: 0, q2_signup_ease: 0, q3_readability: 0,
  q4_explanation: 0, q5_dashboard: 0, q6_difficulty: 0,
  q7_feedback: "",
  q8_target_firms: [], q9_other_targets: [], q9_other_free: "",
  q10_juku_status: "", q11_juku_needs: [], q11_juku_other: "",
  q12_price_range: "", q13_study_hours: "", q14_concerns: "",
};

/* ---- 1〜5段階評価コンポーネント ---- */
function RatingField({ name, label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="survey-rating-group">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={`survey-rating-btn${value === n ? " survey-rating-active" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              style={{ position: "absolute", opacity: 0, width: 0 }}
            />
            <span className="survey-rating-num">{n}</span>
            <span className="survey-rating-label">{RATING_LABELS[n]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---- チェックボックスグループ ---- */
function CheckGroup({ options, selected, onChange }) {
  const toggle = (opt) =>
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  return (
    <div className="survey-check-group">
      {options.map((opt) => (
        <label key={opt} className="survey-check-item">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

/* ---- ラジオボタングループ ---- */
function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="survey-check-group">
      {options.map((opt) => (
        <label key={opt} className="survey-check-item">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

/* ---- モニタープラン辞退リンク（インライン） ---- */
function EndTrialLink() {
  const [state, setState] = useState("idle"); // idle | confirm | processing | done | error
  const [errMsg, setErrMsg] = useState("");

  async function endTrial() {
    setState("processing");
    try {
      const res = await fetch("/api/billing/end-trial", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrMsg(data.error || "処理に失敗しました。");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setErrMsg("通信エラーが発生しました。");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p style={{ fontSize: 13, color: "var(--ok)", marginTop: 4 }}>
        ✓ 通常プランに変更されました。次回請求日から月額料金が発生します。
      </p>
    );
  }
  if (state === "error") {
    return (
      <p style={{ fontSize: 13, color: "var(--ng)", marginTop: 4 }}>
        {errMsg}
        <button
          type="button"
          onClick={() => setState("idle")}
          style={{ marginLeft: 8, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
        >
          やり直す
        </button>
      </p>
    );
  }
  if (state === "confirm") {
    return (
      <p style={{ fontSize: 13, marginTop: 4, color: "var(--ink)" }}>
        今すぐ月額¥1,480の課金が開始されます。よろしいですか？
        <button
          type="button"
          onClick={endTrial}
          style={{ marginLeft: 10, color: "var(--ng)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, textDecoration: "underline" }}
        >
          変更する
        </button>
        <button
          type="button"
          onClick={() => setState("idle")}
          style={{ marginLeft: 8, color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
        >
          キャンセル
        </button>
      </p>
    );
  }
  if (state === "processing") {
    return <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>処理中…</p>;
  }
  return (
    <button
      type="button"
      onClick={() => setState("confirm")}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--ink-soft)", fontSize: 13,
        textDecoration: "underline", padding: 0, marginTop: 6,
      }}
    >
      モニタープランを辞退（通常プランに変更）
    </button>
  );
}

/* ---- メインコンポーネント ---- */
export default function SurveyForm() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()).catch(() => ({ loggedIn: false })),
      fetch("/api/survey").then((r) => r.json()).catch(() => ({ ok: false, response: null })),
    ]).then(([meData, surveyData]) => {
      setMe(meData);
      if (surveyData.ok && surveyData.response) {
        const r = surveyData.response;
        setExisting(r);
        setForm({
          q1_operability:  r.q1_operability  || 0,
          q2_signup_ease:  r.q2_signup_ease  || 0,
          q3_readability:  r.q3_readability  || 0,
          q4_explanation:  r.q4_explanation  || 0,
          q5_dashboard:    r.q5_dashboard    || 0,
          q6_difficulty:   r.q6_difficulty   || 0,
          q7_feedback:     r.q7_feedback     || "",
          q8_target_firms:  r.q8_target_firms  || [],
          q9_other_targets: r.q9_other_targets || [],
          q9_other_free:    r.q9_other_free    || "",
          q10_juku_status:  r.q10_juku_status  || "",
          q11_juku_needs:   r.q11_juku_needs   || [],
          q11_juku_other:   r.q11_juku_other   || "",
          q12_price_range:  r.q12_price_range  || "",
          q13_study_hours:  r.q13_study_hours  || "",
          q14_concerns:     r.q14_concerns     || "",
        });
      }
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitState("submitting");
    setError("");
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("送信に失敗しました。もう一度お試しください。");
        setSubmitState("error");
        return;
      }
      setSubmitState("done");
    } catch {
      setError("通信エラーが発生しました。");
      setSubmitState("error");
    }
  }

  /* ---- ローディング ---- */
  if (loading) {
    return <div className="card"><Spinner /></div>;
  }

  /* ---- 未ログイン ---- */
  if (!me?.loggedIn) {
    return (
      <div className="card trial-end">
        <div className="big">ログインが必要です</div>
        <p>アンケートはログイン中のユーザーのみ回答できます。</p>
        <Link href="/login?next=/survey" className="btn block">ログイン</Link>
      </div>
    );
  }

  /* ---- 送信完了 ---- */
  if (submitState === "done") {
    return (
      <div className="card trial-end">
        <div className="big">ありがとうございました！</div>
        <p>
          ご回答いただきありがとうございます。<br />
          いただいたご意見を参考に、サービスをより良くしてまいります。
        </p>
        <Link href="/" className="btn block">トップへ戻る</Link>
      </div>
    );
  }

  /* ---- 回答済み（編集前） ---- */
  if (existing && !editing) {
    return (
      <div className="card trial-end">
        <div className="big">回答済みです</div>
        <p>
          {new Date(existing.updated_at).toLocaleDateString("ja-JP")} に回答済みです。<br />
          内容を変更したい場合は「編集する」からご修正いただけます。
        </p>
        <button className="btn block" onClick={() => setEditing(true)}>回答を編集する</button>
        <Link href="/" className="link-btn" style={{ display: "block", marginTop: 10, textAlign: "center" }}>
          トップへ戻る
        </Link>
      </div>
    );
  }

  /* ---- フォーム ---- */
  return (
    <form onSubmit={handleSubmit}>
      <p className="subtitle">
        {existing ? "回答内容を編集しています。" : "ご利用ありがとうございます。"}
        アンケートへのご協力をお願いします（所要時間：約3分）。
      </p>
      <EndTrialLink />

      {/* ===== セクション1: アプリの使用感 ===== */}
      <div className="card" style={{ marginBottom: 16, marginTop: 20 }}>
        <h2>① アプリの使用感について</h2>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          各項目を1〜5で評価してください（1＝よくない、5＝とても良い）。
        </p>

        <RatingField name="q1" label="1. 操作性・画面の切り替え速度"
          value={form.q1_operability} onChange={(v) => set("q1_operability", v)} />
        <RatingField name="q2" label="2. サインアップのしやすさ"
          value={form.q2_signup_ease} onChange={(v) => set("q2_signup_ease", v)} />
        <RatingField name="q3" label="3. 問題文・選択肢の見やすさ"
          value={form.q3_readability} onChange={(v) => set("q3_readability", v)} />
        <RatingField name="q4" label="4. 解説のわかりやすさ"
          value={form.q4_explanation} onChange={(v) => set("q4_explanation", v)} />
        <RatingField name="q5" label="5. ダッシュボード・分析機能の使いやすさ"
          value={form.q5_dashboard} onChange={(v) => set("q5_dashboard", v)} />
        <RatingField name="q6" label="6. 実際の選考と比べた難易度・形式の適切さ"
          value={form.q6_difficulty} onChange={(v) => set("q6_difficulty", v)} />

        <div className="field">
          <label>
            7. その他、改善点や欲しい機能があれば教えてください
            <span className="survey-optional">任意</span>
          </label>
          <textarea
            className="survey-textarea"
            value={form.q7_feedback}
            onChange={(e) => set("q7_feedback", e.target.value)}
            placeholder="自由にご記入ください"
            rows={4}
          />
        </div>
      </div>

      {/* ===== セクション2: 就活の意識調査 ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>② 就活の意識調査</h2>

        <div className="field">
          <label>
            8. 志望するコンサルファームを教えてください
            <span className="survey-optional">複数選択可</span>
          </label>
          <CheckGroup
            options={FIRMS}
            selected={form.q8_target_firms}
            onChange={(v) => set("q8_target_firms", v)}
          />
        </div>

        <div className="field">
          <label>
            9. コンサル以外の志望先があれば教えてください
            <span className="survey-optional">複数選択・任意</span>
          </label>
          <CheckGroup
            options={OTHER_TARGETS}
            selected={form.q9_other_targets}
            onChange={(v) => set("q9_other_targets", v)}
          />
          <input
            className="survey-input"
            value={form.q9_other_free}
            onChange={(e) => set("q9_other_free", e.target.value)}
            placeholder="その他（自由記述）"
            style={{ marginTop: 8 }}
          />
        </div>

        <div className="field">
          <label>10. 就活塾を利用していますか？</label>
          <RadioGroup
            name="q10"
            options={["利用している", "検討している", "過去に利用していた", "利用していない"]}
            value={form.q10_juku_status}
            onChange={(v) => set("q10_juku_status", v)}
          />
        </div>

        <div className="field">
          <label>
            11. 就活塾に求めることは何ですか？
            <span className="survey-optional">複数選択可</span>
          </label>
          <CheckGroup
            options={JUKU_NEEDS}
            selected={form.q11_juku_needs}
            onChange={(v) => set("q11_juku_needs", v)}
          />
          <input
            className="survey-input"
            value={form.q11_juku_other}
            onChange={(e) => set("q11_juku_other", e.target.value)}
            placeholder="その他（自由記述）"
            style={{ marginTop: 8 }}
          />
        </div>

        <div className="field">
          <label>12. 就活塾の料金として、いくらが適切ですか？</label>
          <RadioGroup
            name="q12"
            options={[
              "月額1,000円未満",
              "月額1,000〜3,000円",
              "月額3,000〜5,000円",
              "月額5,000〜10,000円",
              "月額10,000円以上",
              "買い切りなら検討したい",
              "無料でないと使わない",
            ]}
            value={form.q12_price_range}
            onChange={(v) => set("q12_price_range", v)}
          />
        </div>

        <div className="field">
          <label>13. 就活対策に1日何時間かけていますか？</label>
          <RadioGroup
            name="q13"
            options={["30分未満", "30分〜1時間", "1〜2時間", "2〜3時間", "3時間以上"]}
            value={form.q13_study_hours}
            onChange={(v) => set("q13_study_hours", v)}
          />
        </div>

        <div className="field">
          <label>
            14. 就活に関する悩みがあれば教えてください
            <span className="survey-optional">任意</span>
          </label>
          <textarea
            className="survey-textarea"
            value={form.q14_concerns}
            onChange={(e) => set("q14_concerns", e.target.value)}
            placeholder="自由にご記入ください"
            rows={4}
          />
        </div>
      </div>

      {/* ===== 送信ボタン ===== */}
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
      <button
        type="submit"
        className="btn block"
        disabled={submitState === "submitting"}
      >
        {submitState === "submitting"
          ? "送信中…"
          : existing ? "回答を更新する" : "アンケートを送信する"}
      </button>
    </form>
  );
}
