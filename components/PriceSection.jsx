"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRICE_LABEL, PRICE_UNIT_SUFFIX } from "@/lib/site";

export default function PriceSection() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, []);

  // ログイン済みユーザーには価格セクションを出さない
  if (me?.loggedIn) return null;

  return (
    <div className="price-card">
      <div className="price-label">会員プラン（月額制）</div>
      <div className="price">
        {PRICE_LABEL}
        <span className="price-tax">{PRICE_UNIT_SUFFIX}</span>
      </div>
      <div className="price-note">
        4試験すべての模試・解説・復習機能をご利用いただけます。
      </div>
      <ul>
        <li>GMAP(LT)・TG-WEB・玉手箱・SPI3 すべての模擬試験</li>
        <li>1回30問 × 全10回 × 4試験タイプ</li>
        <li>全問解説つき・復習モード・成績記録</li>
        <li>今後追加される模試・問題もそのまま利用可能</li>
      </ul>
      <Link href="/signup" className="btn">会員登録する</Link>
    </div>
  );
}
