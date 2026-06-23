import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getServiceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* GET /api/survey — ログイン中ユーザーの既存回答を取得（なければ response: null） */
export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, reason: "no_supabase" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "no_user" }, { status: 401 });

  const { data } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, response: data || null });
}

/* POST /api/survey — 回答を upsert（1ユーザー1回答、再送で上書き・updated_at 更新） */
export async function POST(req) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, reason: "no_supabase" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "no_user" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_body" }, { status: 400 });
  }

  const toInt = (v) => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? n : null; };
  const toArr = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === "string" && s.length > 0) : []);
  const toText = (v) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 2000) : null);

  const payload = {
    user_id:          user.id,
    q1_operability:   toInt(body.q1_operability),
    q2_signup_ease:   toInt(body.q2_signup_ease),
    q3_readability:   toInt(body.q3_readability),
    q4_explanation:   toInt(body.q4_explanation),
    q5_dashboard:     toInt(body.q5_dashboard),
    q6_difficulty:    toInt(body.q6_difficulty),
    q7_feedback:      toText(body.q7_feedback),
    q8_target_firms:  toArr(body.q8_target_firms),
    q9_other_targets: toArr(body.q9_other_targets),
    q9_other_free:    toText(body.q9_other_free),
    q10_juku_status:  toText(body.q10_juku_status),
    q11_juku_needs:   toArr(body.q11_juku_needs),
    q11_juku_other:   toText(body.q11_juku_other),
    q12_price_range:  toText(body.q12_price_range),
    q13_study_hours:  toText(body.q13_study_hours),
    q14_concerns:     toText(body.q14_concerns),
  };

  const { error } = await supabase
    .from("survey_responses")
    .upsert(payload, { onConflict: "user_id" });

  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });

  // アンケート回答完了 → subscriptions.survey_completed = true（service role で更新）
  const svc = getServiceClient();
  if (svc) {
    await svc
      .from("subscriptions")
      .update({ survey_completed: true })
      .eq("user_id", user.id)
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
