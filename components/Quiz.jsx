"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addWrong,
  removeWrong,
  getWrongMap,
  recordResult,
  recordAnswer,
} from "@/components/storage";
import Spinner from "@/components/Spinner";
import { PRICE_LABEL } from "@/lib/site";

const MARKS = ["ア", "イ", "ウ", "エ"];

/* q.underline に指定した文字列を、問題文中で実際に下線付きで表示する */
function renderQText(q) {
  if (!q.underline || !q.q.includes(q.underline)) return q.q;
  const parts = q.q.split(q.underline);
  const out = [];
  parts.forEach((p, i) => {
    if (i > 0) {
      out.push(
        <u key={`u${i}`} className="q-underline">
          {q.underline}
        </u>
      );
    }
    out.push(<span key={`t${i}`}>{p}</span>);
  });
  return out;
}

/*
  クイズエンジン。
  mode="test"   : /api/questions から1回分を取得して出題（無料体験ゲートはAPI側）
  mode="review" : localStorageの復習リストの問題をAPIから取得して出題
*/
export default function Quiz({ examId, examName, categories, mode, testId }) {
  const router = useRouter();
  const [state, setState] = useState("loading"); // loading | quiz | result | trial-end | locked | empty | error
  const [items, setItems] = useState([]); // [{t, i, q, testTitle?}]
  const [title, setTitle] = useState("");
  const [access, setAccess] = useState("full");
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [paywall, setPaywall] = useState(false);
  const startedAt = useRef(Date.now());
  const nextBtnRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (mode === "review") {
          // 1) DB側の復習リストを優先（ログイン済みなら）。失敗・空の場合は localStorage を使う
          let wrongItems = [];
          try {
            const r = await fetch(`/api/progress/wrongs?exam=${examId}`);
            const d = await r.json();
            if (d.ok && Array.isArray(d.items) && d.items.length > 0) {
              wrongItems = d.items;
            }
          } catch {
            /* DB取得失敗時は localStorage にフォールバック */
          }
          if (wrongItems.length === 0) {
            const map = getWrongMap(examId);
            wrongItems = Object.values(map).map((w) => ({ t: w.t, i: w.i }));
          }
          if (wrongItems.length === 0) {
            if (!cancelled) setState("empty");
            return;
          }
          const res = await fetch("/api/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ examId, items: wrongItems }),
          });
          const data = await res.json();
          if (cancelled) return;
          if (!data.items || data.items.length === 0) {
            setState("empty");
            return;
          }
          const shuffled = [...data.items];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          setItems(shuffled);
          setTitle("復習モード（間違えた問題）");
          setAccess("review");
          startedAt.current = Date.now();
          setState("quiz");
        } else {
          const res = await fetch(`/api/questions?exam=${examId}&test=${testId}`);
          if (res.status === 403) {
            if (!cancelled) setState("locked");
            return;
          }
          const data = await res.json();
          if (cancelled) return;
          if (!data.questions) {
            setState("error");
            return;
          }
          setItems(data.questions.map((q, i) => ({ t: data.testId, i, q })));
          setTitle(data.title);
          setAccess(data.access);
          startedAt.current = Date.now();
          setState("quiz");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [examId, mode, testId]);

  useEffect(() => {
    if (selected != null && nextBtnRef.current) {
      nextBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selected]);

  function answer(idx) {
    if (selected != null) return;
    const item = items[pos];
    const correct = idx === item.q.answer;
    setSelected(idx);
    setResults((r) => [...r, { item, selected: idx, correct }]);
    recordAnswer(examId, correct);
    if (correct) {
      if (mode === "review") removeWrong(examId, item.t, item.i);
    } else {
      addWrong(examId, item.t, item.i);
    }
    // ログイン中ユーザーはDBにも同期（失敗してもUIは継続）
    fetch("/api/progress/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId,
        testId: item.t,
        qIndex: item.i,
        correct,
      }),
    }).catch(() => {});
  }

  function next() {
    if (pos + 1 < items.length) {
      setSelected(null);
      setPos(pos + 1);
      window.scrollTo(0, 0);
    } else if (access === "trial") {
      // 無料体験の最後の問題を解き終えた時点で、3問目以降を会員登録の壁でブロック
      setPaywall(true);
    } else {
      setSelected(null);
      if (mode === "test") {
        const score = results.filter((r) => r.correct).length;
        recordResult(examId, testId, score, items.length);
        fetch("/api/progress/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId, testId, score, total: items.length }),
        }).catch(() => {});
      }
      setState("result");
      window.scrollTo(0, 0);
    }
  }

  function elapsed() {
    const s = Math.floor((Date.now() - startedAt.current) / 1000);
    return `${Math.floor(s / 60)}分${s % 60}秒`;
  }

  /* ---------- 状態別画面 ---------- */

  if (state === "loading") {
    return <div className="card"><Spinner label="問題を読み込んでいます" /></div>;
  }

  if (state === "locked") {
    return (
      <div className="card trial-end">
        <div className="big">この模試は会員限定です</div>
        <p>
          会員登録すると、{examName}を含む4試験タイプの模擬試験すべてをご利用いただけます
          （お支払いは一度きり {PRICE_LABEL}）。
        </p>
        <Link href="/signup" className="btn block">
          会員登録について見る
        </Link>
        <Link href={`/exams/${examId}`} className="link-btn">
          試験トップに戻る
        </Link>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="card trial-end">
        <div className="big">復習する問題はありません</div>
        <p>間違えた問題は自動でここに溜まります。まずは模試に挑戦しましょう。</p>
        <Link href={`/exams/${examId}`} className="btn block">
          試験トップに戻る
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="card">
        <div className="error-box">読み込みに失敗しました。再読み込みしてください。</div>
        <Link href={`/exams/${examId}`} className="link-btn">試験トップに戻る</Link>
      </div>
    );
  }

  if (state === "result") {
    return renderResult();
  }

  /* ---------- 出題画面 ---------- */
  const item = items[pos];
  const q = item.q;
  const total = items.length;
  const answered = selected != null;

  return (
    <div>
      <div className="quiz-header">
        <span>{title}</span>
        <span>
          問{pos + 1} / {total}
          {access === "trial" ? "（無料体験）" : ""}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(pos / total) * 100}%` }} />
      </div>

      <div className="card">
        <span className="cat-chip">{categories[q.category] || q.category}</span>
        {mode === "review" && item.testTitle && (
          <div className="subtitle">出典：{item.testTitle}</div>
        )}
        <div className="q-text">{renderQText(q)}</div>
        {q.table && (
          <table className="q-table">
            <thead>
              <tr>
                {q.table.head.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci}>{String(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {q.choices.map((choice, idx) => {
          let cls = "choice";
          if (answered) {
            if (idx === q.answer) cls += " correct";
            else if (idx === selected) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button key={idx} className={cls} disabled={answered} onClick={() => answer(idx)}>
              <span className="mark">{MARKS[idx]}</span>
              <span>{choice}</span>
            </button>
          );
        })}

        {answered && (
          <>
            <div className={`feedback ${selected === q.answer ? "ok" : "ng"}`}>
              <div className="verdict">
                {selected === q.answer
                  ? "正解！"
                  : `不正解（正解：${MARKS[q.answer]}）`}
              </div>
              <div className="exp">{q.exp}</div>
            </div>
            <button ref={nextBtnRef} className="btn block" onClick={next}>
              {pos + 1 < total ? "次の問題へ" : "結果を見る"}
            </button>
          </>
        )}
      </div>

      <Link href={`/exams/${examId}`} className="link-btn">
        中断して試験トップに戻る
      </Link>

      {paywall && (
        <div className="paywall">
          <div className="paywall-modal">
            <div className="paywall-title">会員登録する</div>
            <p className="paywall-text">
              3問目以降は会員限定です。会員登録すると、{examName}の続きに加え、
              GMAP(LT)・TG-WEB・玉手箱・SPI3 すべての模試・解説・復習モードをご利用いただけます。
            </p>
            <Link href="/signup" className="btn block">
              会員登録する（{PRICE_LABEL}・買い切り）
            </Link>
            <Link href={`/exams/${examId}`} className="link-btn">
              試験トップに戻る
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  /* ---------- 結果画面 ---------- */
  function renderResult() {
    const total = items.length;
    const score = results.filter((r) => r.correct).length;
    const wrongs = results.filter((r) => !r.correct);
    const catKeys = Object.keys(categories);

    return (
      <div>
        <h1>{title}　結果</h1>
        <div className="result-score">
          {score} / {total}
        </div>
        <div className="result-sub">
          正答率 {Math.round((score / total) * 100)}%　｜　所要時間 {elapsed()}
        </div>

        <div className="card">
          <h2>カテゴリ別成績</h2>
          {catKeys.map((cat) => {
            const inCat = results.filter((r) => r.item.q.category === cat);
            if (inCat.length === 0) return null;
            const ok = inCat.filter((r) => r.correct).length;
            return (
              <div className="cat-result" key={cat}>
                <div className="cat-line">
                  <span>{categories[cat]}</span>
                  <span>
                    {ok} / {inCat.length}
                  </span>
                </div>
                <div className="cat-bar">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${(ok / inCat.length) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {wrongs.length > 0 ? (
          <div className="card">
            <h2>間違えた問題（{wrongs.length}問）</h2>
            <div className="subtitle">
              復習リストに保存されました。試験トップの「復習モード」から解き直せます。
            </div>
            {wrongs.map((r, i) => (
              <div className="wrong-item" key={i}>
                <div className="wq">{r.item.q.q}</div>
                <div className="wa">
                  正解：{MARKS[r.item.q.answer]}　{r.item.q.choices[r.item.q.answer]}
                </div>
                <div className="wexp">{r.item.q.exp}</div>
              </div>
            ))}
          </div>
        ) : mode === "review" ? (
          <div className="card">
            <h2>全問正解！</h2>
            <div className="subtitle">正解した問題は復習リストから削除されました。</div>
          </div>
        ) : null}

        <div className="btn-row">
          <Link href={`/exams/${examId}`} className="btn secondary">
            試験トップへ
          </Link>
          {mode === "test" && (
            <button
              className="btn"
              onClick={() => {
                setResults([]);
                setPos(0);
                setSelected(null);
                startedAt.current = Date.now();
                setState("quiz");
                window.scrollTo(0, 0);
              }}
            >
              もう一度挑戦
            </button>
          )}
        </div>
      </div>
    );
  }
}
