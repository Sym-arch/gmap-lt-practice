"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWrongMap,
  getHistory,
  migrateLegacyGmapData,
  wrongKey,
  historyKey,
} from "@/components/storage";
import { FREE_QUESTION_COUNT, PRICE_LABEL } from "@/lib/site";

export default function ExamHome({ meta }) {
  const router = useRouter();
  const [wrongCount, setWrongCount] = useState(0);
  const [history, setHistory] = useState({});
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (meta.id === "gmap") migrateLegacyGmapData();
    setWrongCount(Object.keys(getWrongMap(meta.id)).length);
    setHistory(getHistory(meta.id));
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ premium: false }));
  }, [meta.id]);

  const premium = !!me?.premium;

  function resetData() {
    if (confirm("この試験の成績と復習リストをすべて削除します。よろしいですか？")) {
      localStorage.removeItem(wrongKey(meta.id));
      localStorage.removeItem(historyKey(meta.id));
      setWrongCount(0);
      setHistory({});
    }
  }

  const rows = [];
  for (let n = 1; n <= meta.testCount; n++) {
    const available = n <= meta.availableTests;
    const h = history[n];
    const locked = !premium && n !== 1;

    let badge;
    if (!available) {
      badge = <span className="lock-badge">近日公開</span>;
    } else if (locked) {
      badge = <span className="lock-badge">会員限定</span>;
    } else if (h) {
      badge = <span className="score-badge">ベスト {h.best}/{h.total}</span>;
    } else if (!premium && n === 1) {
      badge = <span className="free-badge">無料体験</span>;
    } else {
      badge = <span className="score-badge none">未受験</span>;
    }

    let meta2;
    if (!available) {
      meta2 = "全30問・準備中";
    } else if (!premium && n === 1) {
      meta2 = `最初の${FREE_QUESTION_COUNT}問を無料で解けます`;
    } else if (n === 1 && meta.partialFirstTest) {
      meta2 = `現在${FREE_QUESTION_COUNT}問を先行収録`;
    } else if (h) {
      meta2 = `30問・受験${h.attempts}回・前回 ${h.date}`;
    } else {
      meta2 = "30問";
    }

    rows.push(
      <button
        key={n}
        className="test-row"
        disabled={!available}
        onClick={() => {
          if (!available) return;
          if (locked) router.push("/upgrade");
          else router.push(`/exams/${meta.id}/tests/${n}`);
        }}
      >
        <div>
          <div className="name">模擬テスト 第{n}回</div>
          <div className="meta">{meta2}</div>
        </div>
        {badge}
      </button>
    );
  }

  return (
    <div>
      <Link href="/" className="back-link">
        ← 試験一覧に戻る
      </Link>
      <div className="exam-header" style={{ "--accent": meta.accent }}>
        <span className="exam-chip">{meta.tagline}</span>
      </div>
      <h1>{meta.name} 模擬試験</h1>
      <div className="subtitle">{meta.desc}</div>

      {!premium && (
        <div className="notice">
          第1回の最初の{FREE_QUESTION_COUNT}問を無料で体験できます。すべての模試は{" "}
          <Link href="/upgrade">会員登録</Link>（{PRICE_LABEL}・買い切り）でご利用いただけます。
        </div>
      )}

      <button
        className="review-banner"
        disabled={wrongCount === 0}
        onClick={() => router.push(`/exams/${meta.id}/review`)}
      >
        <div>
          <div className="name">復習モード</div>
          <div className="meta">
            {wrongCount > 0
              ? "間違えた問題を解き直す。正解すると一覧から消えます"
              : "間違えた問題はありません"}
          </div>
        </div>
        <span className="review-count">{wrongCount}問</span>
      </button>

      {rows}

      <button className="link-btn" onClick={resetData}>
        この試験の成績・復習データをリセット
      </button>
    </div>
  );
}
