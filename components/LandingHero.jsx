"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingHero() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, []);

  // ログイン済みにはヒーローを出さない
  if (me?.loggedIn) return null;

  return (
    <section className="lp-hero">
      {/* 背景の光彩デコレーション */}
      <div className="lp-hero-glow lp-hero-glow--tr" aria-hidden="true" />
      <div className="lp-hero-glow lp-hero-glow--bl" aria-hidden="true" />

      <div className="lp-hero-inner">
        <div className="lp-hero-badge">
          外資系コンサルティングファーム志望者向け
        </div>

        <h1 className="lp-hero-title">
          トップファームの<br />
          Webテスト、<span className="lp-hero-accent">突破する。</span>
        </h1>

        <p className="lp-hero-sub">
          GMAP(LT)・TG-WEB・玉手箱・SPI3の4試験に完全特化。<br />
          コンサルの選考傾向を徹底分析した問題と解説で、最短で実力を積み上げる。
        </p>

        <div className="lp-hero-cta">
          <Link href="/exams/gmap" className="lp-btn-primary">
            無料で体験する
          </Link>
          <Link href="/signup" className="lp-btn-outline">
            会員登録する →
          </Link>
        </div>

        {/* 数字バー */}
        <div className="lp-hero-stats">
          <div className="lp-stat">
            <span className="lp-stat-num">4</span>
            <span className="lp-stat-label">試験タイプ</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-num">400<span className="lp-stat-unit">問+</span></span>
            <span className="lp-stat-label">収録問題数</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-num">10+</span>
            <span className="lp-stat-label">対応ファーム</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-num">全問</span>
            <span className="lp-stat-label">解説つき</span>
          </div>
        </div>
      </div>
    </section>
  );
}
