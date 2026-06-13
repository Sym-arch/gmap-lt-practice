import Link from "next/link";
import Stripe from "stripe";
import { grantPurchase } from "@/lib/purchases";

export const dynamic = "force-dynamic";
export const metadata = { title: "登録完了" };

/* Stripe決済から戻ってきたページ。
   セッションをStripe APIで検証し、支払い済みなら：
   1) Supabaseに該当ユーザーが居なければ inviteUserByEmail で作成し招待メール送信
   2) purchases に記録を追加（プレミアム会員化）
   Webhookも同じ処理を行うので、片方が失敗しても保険になる。 */
export default async function SuccessPage({ searchParams }) {
  const { session_id: sessionId } = await searchParams;

  let state = "unknown"; // "new" / "existing" / "unknown"
  let email = null;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (sessionId && secretKey) {
    try {
      const stripe = new Stripe(secretKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        const result = await grantPurchase(session);
        email = result.email || null;
        if (result.ok) {
          state = result.invited ? "new" : "existing";
        }
      }
    } catch {
      state = "unknown";
    }
  }

  return (
    <div className="card trial-end">
      {state === "new" && (
        <>
          <div className="big">ご登録ありがとうございます</div>
          <p>
            ご登録のメールアドレス{email ? `（${email}）` : ""}に、
            <br />
            <b>ログイン用パスワードの設定リンク</b>を送信しました。
            <br />
            メールを確認し、リンクをクリックしてパスワードを設定してください。
          </p>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12 }}>
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
          <Link href="/login" className="btn block">
            ログイン画面へ
          </Link>
        </>
      )}

      {state === "existing" && (
        <>
          <div className="big">ご登録ありがとうございます</div>
          <p>
            会員登録が完了し、すべての模擬試験をご利用いただけます。
            <br />
            お持ちのアカウントでログインしてご利用ください。
          </p>
          <Link href="/login" className="btn block">
            ログインする
          </Link>
          <Link href="/" className="link-btn">
            試験一覧へ
          </Link>
        </>
      )}

      {state === "unknown" && (
        <>
          <div className="big">決済の確認中です</div>
          <p>
            決済情報を確認できませんでした。決済が完了している場合は数十秒後に
            ページを再読み込みしてください。問題が続く場合はお問い合わせください。
          </p>
          <Link href="/upgrade" className="btn block">
            購入ページに戻る
          </Link>
        </>
      )}
    </div>
  );
}
