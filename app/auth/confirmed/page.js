import Link from "next/link";

export const metadata = { title: "メール認証完了" };

/* Supabaseのメール認証リンクから戻ってくるページ。
   認証が完了したユーザーに会員登録完了を知らせる。 */
export default function ConfirmedPage() {
  return (
    <div className="card trial-end">
      <div className="big">Top Firm Pass 会員登録ありがとうございます</div>
      <p>
        メール認証が完了しました。
        <br />
        ご登録のメールアドレスとパスワードでログインいただけます。
      </p>
      <Link href="/login" className="btn block">
        ログインする
      </Link>
      <Link href="/" className="link-btn">
        試験一覧へ
      </Link>
    </div>
  );
}
