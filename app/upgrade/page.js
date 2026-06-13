import UpgradePanel from "@/components/UpgradePanel";
import { EXAMS } from "@/lib/examMeta";
import { SITE_NAME, PRICE_LABEL } from "@/lib/site";

export const metadata = { title: "会員登録" };

export default function UpgradePage() {
  return (
    <div>
      <h1>会員登録</h1>
      <div className="subtitle">
        {SITE_NAME}のすべての模擬試験をご利用いただけます。
        お支払いは一度きり（{PRICE_LABEL}）で、月額費用はかかりません。
      </div>

      <div className="price-card">
        <div className="price-label">会員プラン</div>
        <div className="price">{PRICE_LABEL}</div>
        <div className="price-note">お支払いは一度きり・追加費用なし</div>
        <ul>
          {EXAMS.map((e) => (
            <li key={e.id}>
              {e.name}（{e.tagline}）模擬試験 全{e.testCount}回
            </li>
          ))}
          <li>全問ていねいな解説つき</li>
          <li>間違えた問題の復習モード・成績記録</li>
        </ul>
        <UpgradePanel />
      </div>

      <div className="card">
        <h2>よくある質問</h2>
        <p style={{ fontSize: 14 }}>
          <b>Q. 支払い方法は？</b>
          <br />
          クレジットカード・デビットカードに対応しています（Stripeによる決済）。
        </p>
        <p style={{ fontSize: 14 }}>
          <b>Q. 登録の流れは？</b>
          <br />
          メールアドレスを入力して決済に進んでいただきます。決済完了後、ご登録のメールアドレスに
          ログイン用パスワードの設定リンクをお送りします。
        </p>
        <p style={{ fontSize: 14 }}>
          <b>Q. 別の端末でも使えますか？</b>
          <br />
          同じアカウントでログインすれば、どの端末からでもご利用いただけます。
        </p>
      </div>
    </div>
  );
}
