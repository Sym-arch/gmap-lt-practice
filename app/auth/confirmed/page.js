import ConfirmHandler from "@/components/ConfirmHandler";

export const metadata = { title: "メール認証" };

/* Supabaseのメール認証リンクから戻ってくるページ。
   ConfirmHandler がリンクのトークンを検証してメール認証を完了させ、
   そのままログイン状態にする。 */
export default function ConfirmedPage() {
  return <ConfirmHandler />;
}
