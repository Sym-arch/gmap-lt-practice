import LpExperience from "@/components/LpExperience";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME}｜外資・総合コンサルのWebテスト対策を、これ一つで`,
  description:
    "志望ファームを選ぶだけで、対策すべきWebテストがわかる。GMAP(LT)・TG-WEB・玉手箱・SPI3に対応。本番形式の模試と思考プロセスからの解説。月額¥1,480（税込）・冒頭問題は無料体験。",
  alternates: { canonical: "/lp" },
  openGraph: {
    title: `${SITE_NAME}｜Webテスト対策を、これ一つで`,
    description:
      "志望ファームを選ぶだけで、対策すべきWebテストがわかる。GMAP・TG-WEB・玉手箱・SPI3対応。月額¥1,480。",
    type: "website",
  },
};

/* Meta広告からの流入専用ランディングページ（診断型・体験型）。
   既存トップ（/）には手を加えず、広告のリンク先をこの /lp に向ける。 */
export default function AdLandingPage() {
  return <LpExperience />;
}
