import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import GAListener from "@/components/GAListener";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const GA_ID = "G-SZWJXFZFBS";
// Meta（Facebook）ピクセルID。Vercel等の環境変数 NEXT_PUBLIC_META_PIXEL_ID に設定すると有効化。
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
// SPA遷移は GAListener が手動で page_view を送るため、自動送信はオフ
gtag('config', '${GA_ID}', { send_page_view: false });`}
        </Script>
        <Suspense fallback={null}>
          <GAListener gaId={GA_ID} />
        </Suspense>

        {/* Meta（Facebook）ピクセル — コンバージョン計測用 */}
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}

        <SiteHeader />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        </footer>
      </body>
    </html>
  );
}
