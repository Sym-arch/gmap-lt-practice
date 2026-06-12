import UpgradePanel from "@/components/UpgradePanel";
import { EXAMS } from "@/lib/examMeta";
import { PRICE_LABEL } from "@/lib/site";

export const metadata = { title: "全試験パックを購入" };

export default function UpgradePage() {
  return (
    <div>
      <h1>全試験パック</h1>
      <div className="subtitle">
        買い切り{PRICE_LABEL}。月額課金はありません。一度の購入で今後追加される模試もすべて使えます。
      </div>

      <div className="price-card">
        <div className="price-label">外資コンサル志望者向け 全試験パック</div>
        <div className="price">{PRICE_LABEL}</div>
        <div className="price-note">買い切り・追加課金なし</div>
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
          クレジットカード・デビットカードに対応しています（Stripeによる安全な決済）。
        </p>
        <p style={{ fontSize: 14 }}>
          <b>Q. 購入後すぐに使えますか？</b>
          <br />
          はい。決済完了と同時に、ログイン中のアカウントで全試験が解放されます。
        </p>
        <p style={{ fontSize: 14 }}>
          <b>Q. 別の端末でも使えますか？</b>
          <br />
          同じアカウントでログインすれば、どの端末からでも全問題にアクセスできます。
        </p>
      </div>
    </div>
  );
}
