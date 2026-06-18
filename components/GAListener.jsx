"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/* Next.jsのSPA遷移ごとに GA4 へ page_view を送る。
   これにより、各ページの表示回数・離脱率（エンゲージメント）が正しく計測される。 */
export default function GAListener({ gaId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
