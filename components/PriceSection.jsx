"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRICE_LABEL } from "@/lib/site";

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
      <div className="price-label">会員プラン（お支払いは一度きり）</div>
      <div className="price">
        {PRICE_LABEL}
        <span className="price-tax">（税込）</span>
      </div>
      <div className="price-note">
        月額費用はかかりません。ご登録後は追加のお支払いなくご利用いただけます。
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
