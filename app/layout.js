import "./globals.css";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const GA_ID = "G-SZWJXFZFBS";

export const metadata = {
  title: `${SITE_NAME}｜${SITE_TAGLINE}`,
  description:
    "GMAP(LT)・TG-WEB・玉手箱・SPI3の本格模擬試験。外資系コンサルティングファーム志望者のためのWebテスト対策プラットフォーム。無料体験あり。",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#197b55",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {/* Google Analytics（GA4） */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>

        <SiteHeader />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        </footer>
      </body>
    </html>
  );
}
