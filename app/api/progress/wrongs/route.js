import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* GET /api/progress/wrongs?exam=gmap
   その試験の復習リスト（誤答した問題の集合）を返す。 */
export async function GET(req) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, items: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, items: [] });

  const examId = new URL(req.url).searchParams.get("exam");
  if (!examId) return NextResponse.json({ ok: false, items: [] });

  const { data } = await supabase
    .from("wrong_questions")
    .select("test_id, q_index")
    .eq("user_id", user.id)
    .eq("exam_id", examId);

  const items = (data || []).map((r) => ({ t: r.test_id, i: r.q_index }));
  return NextResponse.json({ ok: true, items });
}
