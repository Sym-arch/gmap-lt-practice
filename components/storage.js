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
