import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* POST /api/progress/result
   body: { examId, testId, score, total }
   テスト1回分の結果を quiz_progress にUPSERTする。
   - 既存行がなければ作成
   - 既存行があれば attempts++、last は今回値、best は max(既存, 今回) */
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
  const score = parseInt(body.score, 10);
  const total = parseInt(body.total, 10);
  if (
    !examId ||
    !Number.isInteger(testId) ||
    !Number.isInteger(score) ||
    !Number.isInteger(total)
  ) {
    return NextResponse.json({ ok: false, reason: "bad_args" }, { status: 400 });
  }

  // 既存行を読んで attempts / best を更新（行が無ければ insert）
  const { data: existing } = await supabase
    .from("quiz_progress")
    .select("best_score, attempts")
    .eq("user_id", user.id)
    .eq("exam_id", examId)
    .eq("test_id", testId)
    .maybeSingle();

  const next = {
    user_id: user.id,
    exam_id: examId,
    test_id: testId,
    best_score: existing ? Math.max(existing.best_score, score) : score,
    last_score: score,
    total,
    attempts: existing ? existing.attempts + 1 : 1,
    last_at: new Date().toISOString(),
  };

  await supabase
    .from("quiz_progress")
    .upsert(next, { onConflict: "user_id,exam_id,test_id" });

  return NextResponse.json({ ok: true });
}
