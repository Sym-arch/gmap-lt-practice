"use client";

/* localStorage ユーティリティ（成績・復習リストは端末側に保存） */

export function loadJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 容量超過などは無視 */
  }
}

export const wrongKey = (examId) => `wrong:${examId}`;
export const historyKey = (examId) => `history:${examId}`;

export function getWrongMap(examId) {
  return loadJSON(wrongKey(examId), {});
}

export function addWrong(examId, testId, qIndex) {
  const map = getWrongMap(examId);
  map[`${testId}-${qIndex}`] = { t: testId, i: qIndex, at: Date.now() };
  saveJSON(wrongKey(examId), map);
}

export function removeWrong(examId, testId, qIndex) {
  const map = getWrongMap(examId);
  delete map[`${testId}-${qIndex}`];
  saveJSON(wrongKey(examId), map);
}

export function getHistory(examId) {
  return loadJSON(historyKey(examId), {});
}

export function recordResult(examId, testId, score, total) {
  const h = getHistory(examId);
  const prev = h[testId];
  h[testId] = {
    last: score,
    best: prev ? Math.max(prev.best, score) : score,
    total,
    date: new Date().toISOString().slice(0, 10),
    attempts: prev ? prev.attempts + 1 : 1,
  };
  saveJSON(historyKey(examId), h);
}

/* ---------- 学習統計（解いた問題数の可視化） ---------- */
const STATS_KEY = "stats:v1";

export function getStats() {
  return loadJSON(STATS_KEY, { answered: 0, correct: 0, days: {}, byExam: {} });
}

/* 1問解くたびに呼ぶ。累積の解答数・正答数・日別・試験別を記録する。 */
export function recordAnswer(examId, correct) {
  const s = getStats();
  s.answered = (s.answered || 0) + 1;
  s.correct = (s.correct || 0) + (correct ? 1 : 0);

  const today = new Date().toISOString().slice(0, 10);
  s.days = s.days || {};
  s.days[today] = (s.days[today] || 0) + 1;

  s.byExam = s.byExam || {};
  const ex = s.byExam[examId] || { answered: 0, correct: 0 };
  ex.answered += 1;
  if (correct) ex.correct += 1;
  s.byExam[examId] = ex;

  saveJSON(STATS_KEY, s);
}

/* 連続学習日数（今日からさかのぼって連続して学習した日数） */
export function getStreak() {
  const s = getStats();
  const days = s.days || {};
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (days[key]) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* 旧静的版（GMAP単体アプリ）のデータを新キーへ引き継ぐ */
export function migrateLegacyGmapData() {
  try {
    const oldWrong = localStorage.getItem("gmapWrongV1");
    if (oldWrong && !localStorage.getItem(wrongKey("gmap"))) {
      localStorage.setItem(wrongKey("gmap"), oldWrong);
    }
    const oldHistory = localStorage.getItem("gmapHistoryV1");
    if (oldHistory && !localStorage.getItem(historyKey("gmap"))) {
      localStorage.setItem(historyKey("gmap"), oldHistory);
    }
  } catch {
    /* ignore */
  }
}
