"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/* Next.jsのSPA遷移ごとに GA4 と Meta Pixel へ PageView を送る。
   これにより、各ページの表示回数・離脱率（GA4）、Meta広告のページ別PV/計測が
   SPA遷移でも正しく取れる。 */
export default function GAListener({ gaId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    // GA4（ページ別PV・離脱率）
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    // Meta Pixel（SPA遷移ぶんの PageView。初回は layout 側で送信済み）
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}
