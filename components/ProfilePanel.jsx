"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStats, getStreak } from "@/components/storage";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import Spinner from "@/components/Spinner";
import { EXAMS } from "@/lib/examMeta";

export default function ProfilePanel() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
    fetch("/api/progress/summary")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setSummary(d);
        else setSummary({ ok: false });
      })
      .catch(() => setSummary({ ok: false }));
  }, []);

  if (!me || !summary) {
    return <div className="card"><Spinner /></div>;
  }

  if (!me.loggedIn) {
    return (
      <div className="card trial-end">
        <div className="big">ログインが必要です</div>
        <p>学習状況はログインするとご確認いただけます。</p>
        <Link href="/login?next=/profile" className="btn block">
          ログイン
        </Link>
      </div>
    );
  }

  // DBから取得できれば優先、ダメなら localStorage（オフライン互換）
  const useDb = summary.ok === true;
  const local = !useDb ? getStats() : null;
  const totals = useDb
    ? summary.totals
    : { answered: local.answered || 0, correct: local.correct || 0 };
  const daysMap = useDb ? summary.days : local.days || {};
  const byExam = useDb ? summary.byExam : local.byExam || {};

  const streak = computeStreak(daysMap);
  const accuracy =
    totals.answered > 0 ? Math.round((totals.correct / totals.answered) * 100) : 0;

  // 直近7日間の学習量
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: daysMap[key] || 0,
    });
  }
  const maxDay = Math.max(1, ...last7.map((d) => d.count));

  return (
    <div>
      <div className="profile-head">
        <div className="profile-avatar-lg">{initial(me.email)}</div>
        <div>
          <div className="profile-email">{me.email}</div>
          <div className="profile-plan">
            {me.isMonitor ? "モニタープラン" : me.premium ? "通常プラン" : ""}
          </div>
        </div>
      </div>

      <h2 className="section-title">学習状況</h2>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{totals.answered}</div>
          <div className="stat-label">解いた問題数</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{accuracy}%</div>
          <div className="stat-label">通算正答率</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">
            {streak}
            <span className="stat-unit">日</span>
          </div>
          <div className="stat-label">連続学習</div>
        </div>
      </div>

      <div className="card">
        <h2>直近7日間の学習量</h2>
        <div className="bar-chart">
          {last7.map((d, i) => (
            <div className="bar-col" key={i}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ height: `${(d.count / maxDay) * 100}%` }}
                  title={`${d.count}問`}
                />
              </div>
              <div className="bar-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>試験別の学習量</h2>
        {EXAMS.map((ex) => {
          const e = byExam[ex.id] || { answered: 0, correct: 0 };
          const acc =
            e.answered > 0 ? Math.round((e.correct / e.answered) * 100) : 0;
          return (
            <div className="cat-result" key={ex.id}>
              <div className="cat-line">
                <span>{ex.name}</span>
                <span>
                  {e.answered}問{e.answered > 0 ? `・正答率${acc}%` : ""}
                </span>
              </div>
              <div className="cat-bar">
                <div
                  className="cat-bar-fill"
                  style={{
                    width: `${e.answered > 0 ? acc : 0}%`,
                    background: ex.accent,
                  }}
                />
              </div>
            </div>
          );
        })}
        {totals.answered === 0 && (
          <div className="subtitle" style={{ marginTop: 10 }}>
            まだ問題を解いていません。試験に挑戦すると、ここに学習の記録が表示されます。
          </div>
        )}
      </div>

      {useDb && summary.byTest && Object.keys(summary.byTest).length > 0 && (
        <div className="card">
          <h2>受験記録</h2>
          {EXAMS.map((ex) => {
            const tests = summary.byTest[ex.id];
            if (!tests) return null;
            const ids = Object.keys(tests)
              .map((n) => parseInt(n, 10))
              .sort((a, b) => a - b);
            return (
              <div key={ex.id} style={{ marginBottom: 14 }}>
                <div className="cat-line" style={{ marginBottom: 4 }}>
                  <span>{ex.name}</span>
                </div>
                {ids.map((n) => {
                  const t = tests[n];
                  return (
                    <div className="record-row" key={n}>
                      <span>第{n}回</span>
                      <span>
                        ベスト {t.best}/{t.total}・受験{t.attempts}回
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <Link href="/" className="btn secondary block">
        試験一覧へ
      </Link>

      {me.premium && (
        <>
          <button
            className="link-btn"
            onClick={openPortal}
            disabled={portalBusy}
          >
            {portalBusy ? "ポータルを開いています…" : "プランを管理・解約する"}
          </button>
          {portalError && (
            <div className="error-box" style={{ marginTop: 8 }}>
              {portalError}
            </div>
          )}
        </>
      )}

      <button className="link-btn" onClick={logout}>
        ログアウト
      </button>
    </div>
  );

  async function openPortal() {
    setPortalBusy(true);
    setPortalError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "ポータルを開けませんでした。");
      }
    } catch {
      setPortalError("通信エラーが発生しました。");
    } finally {
      setPortalBusy(false);
    }
  }

  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
}

function computeStreak(daysMap) {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (daysMap[key]) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function initial(email) {
  if (!email) return "?";
  return email.trim().charAt(0).toUpperCase();
}
