import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME}｜${SITE_TAGLINE}`,
  description:
    "GMAP(LT)・TG-WEB・玉手箱・SPI3の本格模擬試験。外資系コンサルティングファーム志望者向けのWebテスト対策。無料体験あり、買い切り¥1,500で全試験アクセス。",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        </footer>
      </body>
    </html>
  );
}
