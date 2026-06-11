/* GMAP(LT) 模擬テスト アプリ本体 */
"use strict";

const CATEGORIES = {
  structure:    "論理構造の把握",
  reasoning:    "推論・論証の評価",
  quantitative: "数的推論",
  data:         "図表・データ解釈",
  puzzle:       "条件整理・推論",
  problem:      "問題解決・意思決定",
};

const WRONG_KEY = "gmapWrongV1";
const HISTORY_KEY = "gmapHistoryV1";

TESTS.sort((a, b) => a.id - b.id);

/* ---------- storage ---------- */
function loadJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 容量超過などは無視 */ }
}
function getWrongMap() { return loadJSON(WRONG_KEY, {}); }
function addWrong(testId, qIndex) {
  const map = getWrongMap();
  const key = testId + "-" + qIndex;
  map[key] = { t: testId, i: qIndex, at: Date.now() };
  saveJSON(WRONG_KEY, map);
}
function removeWrong(testId, qIndex) {
  const map = getWrongMap();
  delete map[testId + "-" + qIndex];
  saveJSON(WRONG_KEY, map);
}
function getHistory() { return loadJSON(HISTORY_KEY, {}); }
function recordResult(testId, score, total) {
  const h = getHistory();
  const prev = h[testId];
  h[testId] = {
    last: score,
    best: prev ? Math.max(prev.best, score) : score,
    total: total,
    date: new Date().toISOString().slice(0, 10),
    attempts: prev ? prev.attempts + 1 : 1,
  };
  saveJSON(HISTORY_KEY, h);
}

/* ---------- dom helpers ---------- */
const app = document.getElementById("app");
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function clearApp() {
  app.innerHTML = "";
  window.scrollTo(0, 0);
}
function buildTable(table) {
  const t = el("table", "q-table");
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  table.head.forEach((h) => hr.appendChild(el("th", null, h)));
  thead.appendChild(hr);
  t.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((c) => tr.appendChild(el("td", null, String(c))));
    tbody.appendChild(tr);
  });
  t.appendChild(tbody);
  return t;
}

/* ---------- quiz session ---------- */
let session = null; // { mode, title, items:[{test, qIndex, q}], pos, results:[], startedAt }

function startTest(test) {
  session = {
    mode: "test",
    testId: test.id,
    title: test.title,
    items: test.questions.map((q, i) => ({ test, qIndex: i, q })),
    pos: 0,
    results: [],
    startedAt: Date.now(),
  };
  renderQuestion();
}

function startReview() {
  const map = getWrongMap();
  const items = [];
  Object.values(map).forEach((w) => {
    const test = TESTS.find((t) => t.id === w.t);
    if (test && test.questions[w.i]) {
      items.push({ test, qIndex: w.i, q: test.questions[w.i] });
    }
  });
  if (items.length === 0) return;
  // 出題順をシャッフル
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  session = {
    mode: "review",
    title: "復習モード（間違えた問題）",
    items, pos: 0, results: [], startedAt: Date.now(),
  };
  renderQuestion();
}

function fmtElapsed() {
  const s = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.floor(s / 60) + "分" + (s % 60) + "秒";
}

function renderQuestion() {
  clearApp();
  const item = session.items[session.pos];
  const q = item.q;
  const total = session.items.length;

  const header = el("div", "quiz-header");
  header.appendChild(el("span", null, session.title));
  header.appendChild(el("span", null, "問" + (session.pos + 1) + " / " + total));
  app.appendChild(header);

  const track = el("div", "progress-track");
  const fill = el("div", "progress-fill");
  fill.style.width = (session.pos / total) * 100 + "%";
  track.appendChild(fill);
  app.appendChild(track);

  const card = el("div", "card");
  card.appendChild(el("span", "cat-chip", CATEGORIES[q.category] || q.category));
  if (session.mode === "review") {
    const src = el("div", "subtitle", "出典：" + item.test.title);
    card.appendChild(src);
  }
  card.appendChild(el("div", "q-text", q.q));
  if (q.table) card.appendChild(buildTable(q.table));

  const marks = ["ア", "イ", "ウ", "エ"];
  const buttons = [];
  q.choices.forEach((choice, idx) => {
    const b = el("button", "choice");
    b.appendChild(el("span", "mark", marks[idx]));
    b.appendChild(el("span", null, choice));
    b.addEventListener("click", () => answer(idx, buttons, card));
    buttons.push(b);
    card.appendChild(b);
  });
  app.appendChild(card);

  const quit = el("button", "link-btn", "中断してホームに戻る");
  quit.addEventListener("click", () => {
    if (confirm("テストを中断しますか？（この回の解答は記録されません）")) renderHome();
  });
  app.appendChild(quit);
}

function answer(selected, buttons, card) {
  const item = session.items[session.pos];
  const q = item.q;
  const correct = selected === q.answer;
  session.results.push({ item, selected, correct });

  buttons.forEach((b, idx) => {
    b.disabled = true;
    if (idx === q.answer) b.classList.add("correct");
    else if (idx === selected) b.classList.add("wrong");
    else b.classList.add("dim");
  });

  // 復習リストの更新
  if (correct) {
    if (session.mode === "review") removeWrong(item.test.id, item.qIndex);
  } else {
    addWrong(item.test.id, item.qIndex);
  }

  const fb = el("div", "feedback " + (correct ? "ok" : "ng"));
  fb.appendChild(el("div", "verdict", correct ? "正解！" : "不正解（正解：" + ["ア", "イ", "ウ", "エ"][q.answer] + "）"));
  fb.appendChild(el("div", "exp", q.exp));
  card.appendChild(fb);

  const next = el("button", "btn block", session.pos + 1 < session.items.length ? "次の問題へ" : "結果を見る");
  next.addEventListener("click", () => {
    session.pos++;
    if (session.pos < session.items.length) renderQuestion();
    else renderResult();
  });
  card.appendChild(next);
  next.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderResult() {
  clearApp();
  const total = session.items.length;
  const score = session.results.filter((r) => r.correct).length;

  if (session.mode === "test") recordResult(session.testId, score, total);

  app.appendChild(el("h1", null, session.title + "　結果"));
  app.appendChild(el("div", "result-score", score + " / " + total));
  app.appendChild(el("div", "result-sub", "正答率 " + Math.round((score / total) * 100) + "%　｜　所要時間 " + fmtElapsed()));

  // カテゴリ別集計
  const catCard = el("div", "card");
  catCard.appendChild(el("h2", null, "カテゴリ別成績"));
  Object.keys(CATEGORIES).forEach((cat) => {
    const inCat = session.results.filter((r) => r.item.q.category === cat);
    if (inCat.length === 0) return;
    const ok = inCat.filter((r) => r.correct).length;
    const wrap = el("div", "cat-result");
    const line = el("div", "cat-line");
    line.appendChild(el("span", null, CATEGORIES[cat]));
    line.appendChild(el("span", null, ok + " / " + inCat.length));
    wrap.appendChild(line);
    const bar = el("div", "cat-bar");
    const f = el("div", "cat-bar-fill");
    f.style.width = (ok / inCat.length) * 100 + "%";
    bar.appendChild(f);
    wrap.appendChild(bar);
    catCard.appendChild(wrap);
  });
  app.appendChild(catCard);

  // 間違えた問題の一覧
  const wrongs = session.results.filter((r) => !r.correct);
  if (wrongs.length > 0) {
    const wc = el("div", "card");
    wc.appendChild(el("h2", null, "間違えた問題（" + wrongs.length + "問）"));
    wc.appendChild(el("div", "subtitle", "復習リストに保存されました。ホームの「復習モード」から解き直せます。"));
    wrongs.forEach((r) => {
      const w = el("div", "wrong-item");
      w.appendChild(el("div", "wq", r.item.q.q));
      w.appendChild(el("div", "wa", "正解：" + ["ア", "イ", "ウ", "エ"][r.item.q.answer] + "　" + r.item.q.choices[r.item.q.answer]));
      w.appendChild(el("div", "wexp", r.item.q.exp));
      wc.appendChild(w);
    });
    app.appendChild(wc);
  } else if (session.mode === "review") {
    const done = el("div", "card");
    done.appendChild(el("h2", null, "全問正解！"));
    done.appendChild(el("div", "subtitle", "正解した問題は復習リストから削除されました。"));
    app.appendChild(done);
  }

  const row = el("div", "btn-row");
  const home = el("button", "btn secondary", "ホームへ");
  home.addEventListener("click", renderHome);
  row.appendChild(home);
  if (session.mode === "test") {
    const retry = el("button", "btn", "もう一度挑戦");
    const test = TESTS.find((t) => t.id === session.testId);
    retry.addEventListener("click", () => startTest(test));
    row.appendChild(retry);
  }
  app.appendChild(row);
}

/* ---------- home ---------- */
function renderHome() {
  clearApp();
  session = null;
  app.appendChild(el("h1", null, "GMAP（LT）模擬テスト"));
  app.appendChild(el("div", "subtitle", "クリティカルシンキング 全10回 ｜ 各30問（6カテゴリ×5問）"));

  // 復習モード
  const wrongCount = Object.keys(getWrongMap()).length;
  const review = el("button", "review-banner");
  const rLeft = el("div");
  rLeft.appendChild(el("div", "name", "復習モード"));
  rLeft.appendChild(el("div", "meta", wrongCount > 0 ? "間違えた問題をまとめて解き直す（正解すると一覧から消えます）" : "間違えた問題はありません"));
  review.appendChild(rLeft);
  review.appendChild(el("span", "review-count", wrongCount + "問"));
  review.disabled = wrongCount === 0;
  review.addEventListener("click", startReview);
  app.appendChild(review);

  // テスト一覧
  const history = getHistory();
  TESTS.forEach((test) => {
    const h = history[test.id];
    const row = el("button", "test-row");
    const left = el("div");
    left.appendChild(el("div", "name", test.title));
    left.appendChild(el("div", "meta", test.questions.length + "問" + (h ? "　受験" + h.attempts + "回 ｜ 前回 " + h.date : "　未受験")));
    row.appendChild(left);
    const badge = h
      ? el("span", "score-badge", "ベスト " + h.best + "/" + h.total)
      : el("span", "score-badge none", "—");
    row.appendChild(badge);
    row.addEventListener("click", () => startTest(test));
    app.appendChild(row);
  });

  // データ初期化
  const reset = el("button", "link-btn", "成績・復習データをリセット");
  reset.addEventListener("click", () => {
    if (confirm("成績と復習リストをすべて削除します。よろしいですか？")) {
      localStorage.removeItem(WRONG_KEY);
      localStorage.removeItem(HISTORY_KEY);
      renderHome();
    }
  });
  const foot = el("footer", "app-footer");
  foot.appendChild(reset);
  app.appendChild(foot);
}

renderHome();

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* オフライン非対応環境では無視 */ });
  });
}
