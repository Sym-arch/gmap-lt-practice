import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* GET /api/progress/summary
   マイページ表示用のサマリを返す：
   - totals: { answered, correct }
   - days  : { "YYYY-MM-DD": 解答数 }
   - byExam: { examId: { answered, correct } }
   - byTest: { examId: { testId: { best, last, total, attempts, last_at } } }
   - wrong : { examId: 件数 } */
export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "no_supabase" });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "no_user" });

  const [answersRes, progressRes, wrongsRes] = await Promise.all([
    supabase
      .from("quiz_answers")
      .select("exam_id, correct, answered_at")
      .eq("user_id", user.id)
      .order("answered_at", { ascending: false })
      .limit(5000),
    supabase
      .from("quiz_progress")
      .select("exam_id, test_id, best_score, last_score, total, attempts, last_at")
      .eq("user_id", user.id),
    supabase
      .from("wrong_questions")
      .select("exam_id")
      .eq("user_id", user.id),
  ]);

  const answers = answersRes.data || [];
  const totals = { answered: answers.length, correct: 0 };
  const days = {};
  const byExam = {};

  for (const a of answers) {
    if (a.correct) totals.correct += 1;
    const key = a.answered_at.slice(0, 10);
    days[key] = (days[key] || 0) + 1;
    const ex = byExam[a.exam_id] || { answered: 0, correct: 0 };
    ex.answered += 1;
    if (a.correct) ex.correct += 1;
    byExam[a.exam_id] = ex;
  }

  const byTest = {};
  for (const p of progressRes.data || []) {
    byTest[p.exam_id] = byTest[p.exam_id] || {};
    byTest[p.exam_id][p.test_id] = {
      best: p.best_score,
      last: p.last_score,
      total: p.total,
      attempts: p.attempts,
      last_at: p.last_at,
    };
  }

  const wrong = {};
  for (const w of wrongsRes.data || []) {
    wrong[w.exam_id] = (wrong[w.exam_id] || 0) + 1;
  }

  return NextResponse.json({ ok: true, totals, days, byExam, byTest, wrong });
}
