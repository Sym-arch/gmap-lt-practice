"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStats, getStreak } from "@/components/storage";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { EXAMS } from "@/lib/examMeta";

export default function ProfilePanel() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStats(getStats());
    setStreak(getStreak());
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, []);

  if (!stats || !me) {
    return <div className="card">読み込み中…</div>;
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

  const accuracy =
    stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  // 直近7日間の学習量（棒グラフ）
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: (stats.days && stats.days[key]) || 0,
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
            {me.premium ? "プレミアム会員" : "無料プラン"}
          </div>
        </div>
      </div>

      <h2 className="section-title">学習状況</h2>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{stats.answered}</div>
          <div className="stat-label">解いた問題数</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{accuracy}%</div>
          <div className="stat-label">通算正答率</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{streak}<span className="stat-unit">日</span></div>
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
          const e = (stats.byExam && stats.byExam[ex.id]) || {
            answered: 0,
            correct: 0,
          };
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
        {stats.answered === 0 && (
          <div className="subtitle" style={{ marginTop: 10 }}>
            まだ問題を解いていません。試験に挑戦すると、ここに学習の記録が表示されます。
          </div>
        )}
      </div>

      <Link href="/" className="btn secondary block">
        試験一覧へ
      </Link>

      <button className="link-btn" onClick={logout}>
        ログアウト
      </button>
    </div>
  );

  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
}

function initial(email) {
  if (!email) return "?";
  return email.trim().charAt(0).toUpperCase();
}
