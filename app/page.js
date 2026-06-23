import LandingHero from "@/components/LandingHero";
import PriceSection from "@/components/PriceSection";
import ExamGrid from "@/components/ExamGrid";
import SurveyBanner from "@/components/SurveyBanner";
import { SITE_NAME } from "@/lib/site";

export default function LandingPage() {
  return (
    <div>
      <SurveyBanner />
      <LandingHero />

      <h2 className="section-title" id="exams">試験を選ぶ</h2>
      <ExamGrid />

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

      <PriceSection />
    </div>
  );
}
