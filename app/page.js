import Link from "next/link";
import { EXAMS } from "@/lib/examMeta";
import { SITE_NAME, PRICE_LABEL, FREE_QUESTION_COUNT } from "@/lib/site";

export default function LandingPage() {
  return (
    <div>
      <section className="hero">
        <span className="hero-badge">外資系コンサルティングファーム志望者のために</span>
        <h1>
          トップファーム内定へ、
          <br />
          確かな準備を。
        </h1>
        <p>
          {SITE_NAME}は、GMAP(LT)・TG-WEB・玉手箱・SPI3に対応した模擬試験プラットフォームです。
          コンサルティングファームの出題傾向に合わせた問題と、思考プロセスから理解できる解説で、
          選考突破に必要な力を着実に積み上げます。各試験の冒頭{FREE_QUESTION_COUNT}問は、登録なしでお試しいただけます。
        </p>
        <div className="hero-cta">
          <a href="#exams" className="btn">無料で試してみる</a>
          <Link href="/upgrade" className="btn secondary">
            会員登録する
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

      <h2 className="section-title">{SITE_NAME}の特徴</h2>
      <div className="feature-grid">
        <div className="feature">
          <b>コンサル選考の傾向に特化</b>
          戦略・総合ファームの選考で実際に課される試験タイプと出題分野に絞って収録しています。
        </div>
        <div className="feature">
          <b>全問にていねいな解説</b>
          答え合わせで終わらせず、なぜその選択肢なのか、思考プロセスから解説します。
        </div>
        <div className="feature">
          <b>間違えた問題だけ復習</b>
          誤答は自動で復習リストへ。正解できるまで繰り返し、苦手を確実になくせます。
        </div>
        <div className="feature">
          <b>カテゴリ別の成績分析</b>
          受験のたびに分野別の正答率を表示。次に伸ばすべき領域がひと目でわかります。
        </div>
      </div>

      <div className="price-card">
        <div className="price-label">会員プラン（お支払いは一度きり）</div>
        <div className="price">{PRICE_LABEL}</div>
        <div className="price-note">月額費用はかかりません。ご登録後は追加のお支払いなくご利用いただけます。</div>
        <ul>
          <li>GMAP(LT)・TG-WEB・玉手箱・SPI3 すべての模擬試験</li>
          <li>1回30問 × 全10回 × 4試験タイプ</li>
          <li>全問解説つき・復習モード・成績記録</li>
          <li>今後追加される模試・問題もそのまま利用可能</li>
        </ul>
        <Link href="/upgrade" className="btn">会員登録する</Link>
      </div>
    </div>
  );
}
