import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, premium } = await getAccess();

  let surveyReminder = false;
  let isMonitor = false;

  if (user) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      try {
        // subscriptions から plan と survey_completed を 1 クエリで取得
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, survey_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        isMonitor = sub?.plan === "monitor";

        // モニタープランかつ未回答かつ3日経過でバナー表示
        if (isMonitor && !sub?.survey_completed) {
          const daysSince =
            (Date.now() - new Date(user.created_at).getTime()) / 86_400_000;
          surveyReminder = daysSince >= 3;
        }
      } catch {
        // 取得失敗してもログイン判定には影響させない
      }
    }
  }

  return NextResponse.json({
    loggedIn: !!user,
    email: user ? user.email : null,
    premium,
    isMonitor,
    surveyReminder,
    authConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  });
}
