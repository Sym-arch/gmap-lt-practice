// Supabase Edge Function: send-survey-emails
// Resend API でアンケート督促メールを送信する。
// Supabase Cron から毎日 1 回呼び出される。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY          = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL              = Deno.env.get("RESEND_FROM_EMAIL")
                                  ?? "Top Firm Pass <noreply@topfirmpass.com>";
const SITE_URL                = Deno.env.get("SITE_URL") ?? "https://topfirmpass.com";

type EmailType =
  | "survey_started"
  | "survey_reminder"
  | "monitor_expired_paid_started";

interface Candidate {
  user_id:            string;
  email:              string;
  created_at:         string;
  first_name:         string;
  last_name:          string;
  sub_status:         string;
  current_period_end: string | null;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ---- ユーティリティ ----

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

async function alreadySent(userId: string, type: EmailType): Promise<boolean> {
  const { count } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("email_type", type)
    .eq("success", true);
  return (count ?? 0) > 0;
}

async function logResult(
  userId:   string,
  type:     EmailType,
  success:  boolean,
  errorMsg: string | undefined,
) {
  await supabase.from("email_logs").insert({
    user_id:    userId,
    email_type: type,
    success,
    error_msg:  errorMsg ?? null,
  });
}

async function sendEmail(
  to:      string,
  subject: string,
  html:    string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (res.ok) return { ok: true };
  const body = await res.text().catch(() => "");
  return { ok: false, error: body };
}

// ---- メールテンプレート ----

function tmplSurveyStarted(name: string) {
  return {
    subject: "【Top Firm Pass】ご利用状況のご確認とアンケートのお願い",
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:auto;color:#333;line-height:1.7">
  <p>${name}さん、こんにちは。</p>
  <p>Top Firm Pass をご利用いただき、ありがとうございます。</p>
  <p>モニタープランをお使いいただいて <strong>3日</strong> が経ちました。<br>
  ご利用の感想・改善要望を、約3分のアンケートでお聞かせください。</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${SITE_URL}/survey"
       style="background:#16a34a;color:#fff;padding:13px 36px;border-radius:6px;
              text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
      アンケートに回答する
    </a>
  </div>
  <p style="font-size:12.5px;color:#999">
    このメールへの返信は受け付けておりません。<br>
    ご不明な点は <a href="${SITE_URL}" style="color:#16a34a">Top Firm Pass</a> サイト内のお問い合わせよりご連絡ください。
  </p>
</div>`,
  };
}

function tmplSurveyReminder(name: string) {
  return {
    subject: "【リマインダー】アンケートへのご回答をお願いします",
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:auto;color:#333;line-height:1.7">
  <p>${name}さん、こんにちは。</p>
  <p>先日ご案内したアンケートへの回答がまだ届いていません。</p>
  <p>ご回答は <strong>約3分</strong> で完了します。<br>
  皆さまのご意見がサービスの改善に直接役立ちます。ぜひご協力をお願いします。</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${SITE_URL}/survey"
       style="background:#16a34a;color:#fff;padding:13px 36px;border-radius:6px;
              text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
      アンケートに回答する（約3分）
    </a>
  </div>
  <p style="font-size:12.5px;color:#999">
    このメールへの返信は受け付けておりません。<br>
    ご不明な点は <a href="${SITE_URL}" style="color:#16a34a">Top Firm Pass</a> サイト内のお問い合わせよりご連絡ください。
  </p>
</div>`,
  };
}

function tmplMonitorExpiredPaidStarted(name: string) {
  return {
    subject: "【Top Firm Pass】通常プランへの移行が完了しました",
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:auto;color:#333;line-height:1.7">
  <p>${name}さん、こんにちは。</p>
  <p>モニタープランの無料期間が終了し、<strong>通常プラン</strong>へ移行しました。<br>
  引き続きすべての機能をご利用いただけます。</p>
  <p>まだアンケートにご回答されていない場合は、ぜひご協力ください（約3分）。</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${SITE_URL}/survey"
       style="background:#16a34a;color:#fff;padding:13px 36px;border-radius:6px;
              text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
      アンケートに回答する
    </a>
  </div>
  <p style="font-size:12.5px;color:#999">
    このメールへの返信は受け付けておりません。<br>
    ご不明な点は <a href="${SITE_URL}" style="color:#16a34a">Top Firm Pass</a> サイト内のお問い合わせよりご連絡ください。
  </p>
</div>`,
  };
}

// ---- メイン ----

Deno.serve(async (req) => {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* body なし */ }

  // テストモード：{ "test": true, "to": "your@email.com" } を POST すると
  // 3種類のメールを全て指定アドレスへ送信（日数条件・重複チェックをスキップ）
  if (body.test === true) {
    const to = typeof body.to === "string" ? body.to : null;
    if (!to) {
      return new Response(
        JSON.stringify({ ok: false, error: '"to" is required in test mode' }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const name = typeof body.name === "string" ? body.name : "テストユーザー";
    const results: Record<string, boolean> = {};
    for (const [type, tmpl] of [
      ["survey_started",               tmplSurveyStarted(name)],
      ["survey_reminder",              tmplSurveyReminder(name)],
      ["monitor_expired_paid_started", tmplMonitorExpiredPaidStarted(name)],
    ] as [string, { subject: string; html: string }][]) {
      const r = await sendEmail(to, `[TEST] ${tmpl.subject}`, tmpl.html);
      results[type] = r.ok;
    }
    return new Response(
      JSON.stringify({ ok: true, mode: "test", to, results }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 通常モード：毎日 Cron から呼ばれる本番処理
  let sent = 0, skipped = 0, failed = 0;
  const errors: string[] = [];

  const { data: candidates, error: rpcErr } = await supabase.rpc(
    "get_monitor_email_candidates",
  );

  if (rpcErr) {
    return new Response(
      JSON.stringify({ ok: false, error: rpcErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  for (const c of (candidates as Candidate[]) ?? []) {
    const days  = daysSince(c.created_at);
    const name  = c.first_name || "ご利用者";

    // survey_started：3日経過後（まだ未送信なら送る）
    if (days >= 3) {
      if (!(await alreadySent(c.user_id, "survey_started"))) {
        const { subject, html } = tmplSurveyStarted(name);
        const r = await sendEmail(c.email, subject, html);
        await logResult(c.user_id, "survey_started", r.ok, r.error);
        r.ok ? sent++ : (failed++, r.error && errors.push(r.error));
      } else {
        skipped++;
      }
    }

    // survey_reminder：7日経過後（まだ未送信なら送る）
    if (days >= 7) {
      if (!(await alreadySent(c.user_id, "survey_reminder"))) {
        const { subject, html } = tmplSurveyReminder(name);
        const r = await sendEmail(c.email, subject, html);
        await logResult(c.user_id, "survey_reminder", r.ok, r.error);
        r.ok ? sent++ : (failed++, r.error && errors.push(r.error));
      } else {
        skipped++;
      }
    }

    // monitor_expired_paid_started：8日経過後 かつ 通常プランに移行済み（status=active）
    if (days >= 8 && c.sub_status === "active") {
      if (!(await alreadySent(c.user_id, "monitor_expired_paid_started"))) {
        const { subject, html } = tmplMonitorExpiredPaidStarted(name);
        const r = await sendEmail(c.email, subject, html);
        await logResult(c.user_id, "monitor_expired_paid_started", r.ok, r.error);
        r.ok ? sent++ : (failed++, r.error && errors.push(r.error));
      } else {
        skipped++;
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent, skipped, failed, errors }),
    { headers: { "Content-Type": "application/json" } },
  );
});
