import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, premium } = await getAccess();

  let surveyReminder = false;
  if (user) {
    // サインアップから3日以上経過 かつ アンケート未回答のユーザーにリマインダーを出す
    const daysSince = (Date.now() - new Date(user.created_at).getTime()) / 86_400_000;
    if (daysSince >= 3) {
      const supabase = await getSupabaseServer();
      if (supabase) {
        // テーブル未作成などで失敗してもログイン判定に影響させない
        try {
          const { data } = await supabase
            .from("survey_responses")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          surveyReminder = !data;
        } catch {
          surveyReminder = false;
        }
      }
    }
  }

  return NextResponse.json({
    loggedIn: !!user,
    email: user ? user.email : null,
    premium,
    surveyReminder,
    authConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  });
}
