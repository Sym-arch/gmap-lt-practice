/* 問題データ本体。サーバー側（APIルート）からのみ import すること。
   クライアントコンポーネントから import すると有料問題が漏えいするので厳禁。 */

import gmap01 from "@/lib/exams/gmap/test01";
import gmap02 from "@/lib/exams/gmap/test02";
import gmap03 from "@/lib/exams/gmap/test03";
import gmap04 from "@/lib/exams/gmap/test04";
import gmap05 from "@/lib/exams/gmap/test05";
import gmap06 from "@/lib/exams/gmap/test06";
import gmap07 from "@/lib/exams/gmap/test07";
import gmap08 from "@/lib/exams/gmap/test08";
import gmap09 from "@/lib/exams/gmap/test09";
import gmap10 from "@/lib/exams/gmap/test10";
import tgweb01 from "@/lib/exams/tgweb/test01";
import tgweb02 from "@/lib/exams/tgweb/test02";
import tgweb03 from "@/lib/exams/tgweb/test03";
import tgweb04 from "@/lib/exams/tgweb/test04";
import tgweb05 from "@/lib/exams/tgweb/test05";
import tamatebako01 from "@/lib/exams/tamatebako/test01";
import tamatebako02 from "@/lib/exams/tamatebako/test02";
import tamatebako03 from "@/lib/exams/tamatebako/test03";
import tamatebako04 from "@/lib/exams/tamatebako/test04";
import spi301 from "@/lib/exams/spi3/test01";

export const EXAM_TESTS = {
  gmap: [gmap01, gmap02, gmap03, gmap04, gmap05, gmap06, gmap07, gmap08, gmap09, gmap10],
  tgweb: [tgweb01, tgweb02, tgweb03, tgweb04, tgweb05],
  tamatebako: [tamatebako01, tamatebako02, tamatebako03, tamatebako04],
  spi3: [spi301],
};

export function getTest(examId, testId) {
  const tests = EXAM_TESTS[examId];
  if (!tests) return null;
  return tests.find((t) => t.id === testId) || null;
}
