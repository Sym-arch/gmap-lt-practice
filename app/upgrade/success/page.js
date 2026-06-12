import Link from "next/link";
import Stripe from "stripe";
import { grantPurchase } from "@/lib/purchases";

export const dynamic = "force-dynamic";
export const metadata = { title: "登録完了" };

/* Stripe決済から戻ってきたページ。
   セッションをStripe APIで検証し、支払い済みならその場で購入記録を付与する
   （Webhookが届く前でも即座に全問解放されるように）。 */
export default async function SuccessPage({ searchParams }) {
  const { session_id: sessionId } = await searchParams;
  let ok = false;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (sessionId && secretKey) {
    try {
      const stripe = new Stripe(secretKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await grantPurchase(session);
        ok = true;
      }
    } catch {
      ok = false;
    }
  }

  return (
    <div className="card trial-end">
      {ok ? (
        <>
          <div className="big">ご登録ありがとうございます</div>
          <p>
            会員登録が完了しました。
            GMAP(LT)・TG-WEB・玉手箱・SPI3のすべての模擬試験をご利用いただけます。
          </p>
          <Link href="/" className="btn block">
            試験を選んで開始する
          </Link>
        </>
      ) : (
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
