"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { SITE_NAME } from "@/lib/site";

export default function SiteHeader() {
  const [me, setMe] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // パスが変わるたびに認証状態を取り直す（ログイン直後にヘッダーを更新するため）
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, premium: false }));
  }, [pathname]);

  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    setMe({ loggedIn: false, premium: false, authConfigured: me?.authConfigured });
    router.push("/");
    router.refresh();
  }

  const initial = me?.email ? me.email.trim().charAt(0).toUpperCase() : "?";

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <img src="/icon-192.png" alt="" className="brand-img" />
        <span className="brand-name">{SITE_NAME}</span>
      </Link>
      <nav className="header-nav">
        {/* me の取得が終わるまでは何も出さない（ログイン済みユーザーに
            「会員登録/ログイン」が一瞬見えるのを防ぐ） */}
        {me == null ? null : me.loggedIn ? (
          <Link href="/profile" className="profile-avatar" title="マイページ">
            {initial}
          </Link>
        ) : (
          <>
            <Link href="/signup" className="header-upgrade">
              会員登録
            </Link>
            <Link href="/login" className="header-link">
              ログイン
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
