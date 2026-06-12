import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { getTest, EXAM_TESTS } from "@/lib/examData";
import { getExamMeta } from "@/lib/examMeta";
import { FREE_QUESTION_COUNT } from "@/lib/site";

export const dynamic = "force-dynamic";

/* GET /api/questions?exam=gmap&test=1
   問題データのゲートキーパー。無料ユーザーには各試験「第1回」の先頭2問だけを返す。 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("exam");
  const testId = parseInt(searchParams.get("test"), 10);

  const meta = getExamMeta(examId);
  const test = getTest(examId, testId);
  if (!meta || !test) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { user, premium } = await getAccess();

  if (premium) {
    return NextResponse.json({
      access: "full",
      examId,
      testId,
      title: test.title,
      partial: !!test.partial,
      questions: test.questions,
    });
  }

  if (testId === 1) {
    return NextResponse.json({
      access: "trial",
      examId,
      testId,
      title: test.title,
      loggedIn: !!user,
      questions: test.questions.slice(0, FREE_QUESTION_COUNT),
    });
  }

  return NextResponse.json({ access: "locked", loggedIn: !!user }, { status: 403 });
}

/* POST /api/questions  body: { examId, items: [{ t, i }, ...] }
   復習モード用。指定された (テストID, 問題番号) の問題を返す。
   無料ユーザーは無料体験分（第1回の先頭2問）のみ取得できる。 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { examId, items } = body || {};
  const meta = getExamMeta(examId);
  if (!meta || !Array.isArray(items)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { premium } = await getAccess();

  const allowed = items.filter(
    (it) => premium || (it.t === 1 && it.i < FREE_QUESTION_COUNT)
  );

  const result = [];
  for (const it of allowed.slice(0, 400)) {
    const test = getTest(examId, it.t);
    const q = test && test.questions[it.i];
    if (q) result.push({ t: it.t, i: it.i, testTitle: test.title, q });
  }
  return NextResponse.json({ examId, items: result });
}
