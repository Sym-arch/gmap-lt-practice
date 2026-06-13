import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* POST /api/progress/answer
   body: { examId, testId, qIndex, correct }
   ログイン中ユーザーの解答ログ1件を quiz_answers に記録し、
   不正解なら wrong_questions に追加、正解で復習中なら削除する。 */
export async function POST(req) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, reason: "no_supabase" });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "no_user" });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_body" }, { status: 400 });
  }
  const examId = String(body.examId || "");
  const testId = parseInt(body.testId, 10);
  const qIndex = parseInt(body.qIndex, 10);
  const correct = !!body.correct;
  if (!examId || !Number.isInteger(testId) || !Number.isInteger(qIndex)) {
    return NextResponse.json({ ok: false, reason: "bad_args" }, { status: 400 });
  }

  await supabase.from("quiz_answers").insert({
    user_id: user.id,
    exam_id: examId,
    test_id: testId,
    q_index: qIndex,
    correct,
  });

  if (correct) {
    // 復習中に正解 → リストから削除（テスト本番でも余計な行は出ないので削除でOK）
    await supabase
      .from("wrong_questions")
      .delete()
      .eq("user_id", user.id)
      .eq("exam_id", examId)
      .eq("test_id", testId)
      .eq("q_index", qIndex);
  } else {
    await supabase.from("wrong_questions").upsert(
      {
        user_id: user.id,
        exam_id: examId,
        test_id: testId,
        q_index: qIndex,
      },
      { onConflict: "user_id,exam_id,test_id,q_index" }
    );
  }

  return NextResponse.json({ ok: true });
}
