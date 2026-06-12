import Link from "next/link";
import { EXAMS } from "@/lib/examMeta";
import { PRICE_LABEL, FREE_QUESTION_COUNT } from "@/lib/site";

export default function LandingPage() {
  return (
    <div>
      <section className="hero">
        <span className="hero-badge">外資系コンサルティングファーム志望者向け</span>
        <h1>
          コンサル選考のWebテスト、
          <br />
          本番より少し難しい模試で仕上げる。
        </h1>
        <p>
          GMAP(LT)・TG-WEB・玉手箱・SPI3に対応した本格模擬試験。
          外資コンサルの出題傾向に寄せた問題で、思考力とスピードを同時に鍛えます。
          各試験の最初の{FREE_QUESTION_COUNT}問は無料でお試しいただけます。
        </p>
        <div className="hero-cta">
          <a href="#exams" className="btn">無料で腕試しする</a>
          <Link href="/upgrade" className="btn secondary">
            {PRICE_LABEL}で全試験解放
          </Link>
        </div>
      </section>

      <h2 className="section-title" id="exams">試験を選ぶ</h2>
      <div className="exam-grid">
        {EXAMS.map((exam) => (
          <Link
            key={exam.id}
            href={`/exams/${exam.id}`}
            className="exam-card"
            style={{ "--accent": exam.accent }}
          >
            <span className="exam-tagline">{exam.tagline}</span>
            <span className="exam-name">{exam.name}</span>
            <span className="exam-desc">{exam.desc}</span>
            <span className="exam-foot">
              <span>模擬試験 全{exam.testCount}回</span>
              <span className="exam-free">無料体験あり</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">このサービスの特徴</h2>
      <div className="feature-grid">
        <div className="feature">
          <b>外資コンサル傾向に特化</b>
          戦略・総合ファームの選考で実際に課される試験タイプと出題分野に絞って収録。
        </div>
        <div className="feature">
          <b>全問にていねいな解説</b>
          答え合わせで終わらせない。なぜその選択肢なのか、思考プロセスから解説します。
        </div>
        <div className="feature">
          <b>間違えた問題だけ復習</b>
          誤答は自動で復習リストへ。正解できるまで繰り返し、苦手を確実に潰せます。
        </div>
        <div className="feature">
          <b>カテゴリ別の成績分析</b>
          受験のたびに分野別正答率を表示。どこを伸ばすべきかが一目でわかります。
        </div>
      </div>

      <div className="price-card">
        <div className="price-label">全試験パック（買い切り・追加課金なし）</div>
        <div className="price">{PRICE_LABEL}</div>
        <div className="price-note">月額ではありません。一度の購入でずっと使えます。</div>
        <ul>
          <li>GMAP(LT)・TG-WEB・玉手箱・SPI3 すべての模擬試験</li>
          <li>1回30問 × 全10回 × 4試験タイプ</li>
          <li>全問解説つき・復習モード・成績記録</li>
          <li>今後追加される模試・問題もそのまま利用可能</li>
        </ul>
        <Link href="/upgrade" className="btn">全試験パックを購入する</Link>
      </div>
    </div>
  );
}
