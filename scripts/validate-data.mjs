/* 全問題データの整合性チェック（問数・カテゴリ・answer範囲・解説の有無） */
const exams = {
  gmap: { files: 10, cats: ["structure", "reasoning", "quantitative", "data", "puzzle", "problem"] },
  tgweb: { files: 5, cats: ["keisu", "gengo", "eigo"] },
  tamatebako: { files: 5, cats: ["keisu", "gengo", "eigo"] },
  spi3: { files: 4, cats: ["higengo", "gengo", "kozo", "eigo"] },
};

let issues = 0;
for (const [exam, cfg] of Object.entries(exams)) {
  for (let n = 1; n <= cfg.files; n++) {
    const nn = String(n).padStart(2, "0");
    const mod = await import(`../lib/exams/${exam}/test${nn}.js`);
    const t = mod.default;
    const counts = {};
    t.questions.forEach((q, i) => {
      const tag = `${exam}/test${nn} Q${i + 1}`;
      if (!cfg.cats.includes(q.category)) { console.log(`NG ${tag}: 不明カテゴリ ${q.category}`); issues++; }
      if (!Array.isArray(q.choices) || q.choices.length !== 4) { console.log(`NG ${tag}: 選択肢が4つでない`); issues++; }
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) { console.log(`NG ${tag}: answer不正 ${q.answer}`); issues++; }
      if (!q.exp || q.exp.length < 20) { console.log(`NG ${tag}: 解説が短すぎる`); issues++; }
      if (!q.q || q.q.length < 5) { console.log(`NG ${tag}: 問題文が空`); issues++; }
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    const partial = t.partial ? "（partial）" : "";
    console.log(`${exam}/test${nn}: ${t.questions.length}問 ${JSON.stringify(counts)} ${partial}`);
    if (!t.partial && t.questions.length !== 30) { console.log(`NG ${exam}/test${nn}: 30問でない`); issues++; }
  }
}
console.log(issues === 0 ? "\nすべてOK" : `\n問題が ${issues} 件あります`);
process.exit(issues === 0 ? 0 : 1);
