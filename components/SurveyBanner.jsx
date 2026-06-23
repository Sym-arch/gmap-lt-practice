"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* サインアップ3日後、アンケート未回答のユーザーにホームページで表示するバナー。
   /api/me が surveyReminder: true を返したときのみ表示。 */
export default function SurveyBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("surveyBannerDismissed")) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => { if (d.loggedIn && d.surveyReminder) setShow(true); })
      .catch(() => {});
  }, []);

  if (!show || dismissed) return null;

  function dismiss() {
    sessionStorage.setItem("surveyBannerDismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="survey-banner">
      <div className="survey-banner-body">
        <b>アンケートへのご協力をお願いします</b>
        <span>モニタープランご利用のご感想をお聞かせください（約3分）</span>
      </div>
      <div className="survey-banner-actions">
        <Link href="/survey" className="btn survey-banner-btn">回答する</Link>
        <button type="button" className="survey-banner-close" onClick={dismiss} aria-label="閉じる">
          ✕
        </button>
      </div>
    </div>
  );
}
