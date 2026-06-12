"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { SITE_NAME } from "@/lib/site";

export default function SiteHeader() {
  const [me, setMe] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, []);

  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    setMe({ loggedIn: false, premium: false, authConfigured: me?.authConfigured });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">C</span>
        <span className="brand-name">{SITE_NAME}</span>
      </Link>
      <nav className="header-nav">
        {me?.premium ? (
          <span className="premium-chip">プレミアム</span>
        ) : (
          <Link href="/upgrade" className="header-upgrade">
            ¥1,500で全試験解放
          </Link>
        )}
        {me?.loggedIn ? (
          <button className="header-link" onClick={logout}>
            ログアウト
          </button>
        ) : (
          <Link href="/login" className="header-link">
            ログイン
          </Link>
        )}
      </nav>
    </header>
  );
}
