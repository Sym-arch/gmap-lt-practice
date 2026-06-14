"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";

export default function LandingHero() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, []);

  // ログイン済みユーザーにはヒーローを出さず、「試験を選ぶ」セクションから始める
  if (me?.loggedIn) {
    return null;
  }

  // 未ログイン（または取得中）の通常表示
  return (
    <section className="hero">
      <span className="hero-badge">GMAP(LT)・TG-WEB・玉手箱・SPI3 対応</span>
      <h1>
        外資系コンサルティングファーム
        <br />
        志望者のためのWebテスト模試
      </h1>
      <p>
        {SITE_NAME}は、トップファーム内定を目指す方のための模擬試験プラットフォームです。
        コンサルティングファームの出題傾向に合わせた問題と、思考プロセスから理解できる解説で、
        選考突破に必要な力を着実に積み上げます。
      </p>
      <div className="hero-cta">
        <Link href="/exams/gmap" className="btn">無料で試してみる</Link>
        <Link href="/signup" className="btn secondary">会員登録する</Link>
      </div>
    </section>
  );
}
