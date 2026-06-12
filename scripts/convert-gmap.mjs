/* 旧 data/testNN.js（registerTest形式）→ lib/exams/gmap/testNN.js（ESモジュール）変換 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";

mkdirSync("lib/exams/gmap", { recursive: true });

for (let n = 1; n <= 10; n++) {
  const nn = String(n).padStart(2, "0");
  const src = readFileSync(`data/test${nn}.js`, "utf8");
  let captured = null;
  new Function("registerTest", src)((t) => (captured = t));
  if (!captured) throw new Error(`test${nn}: registerTest が呼ばれませんでした`);
  const out =
    "const test = " + JSON.stringify(captured, null, 2) + ";\n\nexport default test;\n";
  writeFileSync(`lib/exams/gmap/test${nn}.js`, out, "utf8");
  console.log(`test${nn}: ${captured.questions.length}問 OK`);
}
