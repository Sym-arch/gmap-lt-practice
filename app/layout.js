import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

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
    <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SZWJXFZFBS"></script>
    
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-SZWJXFZFBS');
</script>
  
        <SiteHeader />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        </footer>
      </body>
    </html>
  );
}
