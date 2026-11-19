import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import ScrollTop from "@/components/layout/ScrollTop";
import SiteHeader from "@/components/layout/SiteHeader";
import { themeScript } from "@/components/layout/ThemeToggle";
import { getKanjiIndex, getVocabLessons } from "@/lib/data";
import "./globals.css";

const vn = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"], variable: "--font-vn", display: "swap" });
const jpSans = Noto_Sans_JP({ weight: ["400", "500", "600", "700"], variable: "--font-jp-sans", display: "swap", preload: false });
const jpMincho = Shippori_Mincho({ weight: ["500", "700"], variable: "--font-jp-mincho", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Minna no Nihongo I · Ôn tập N5", template: "%s · Minna no Nihongo" },
  description: "Ôn từ vựng Minna no Nihongo I, kanji, ngữ pháp, nhóm động từ, bài tập, cách đọc số – giờ – ngày tháng và luyện nói.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#121119" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const words = getVocabLessons().flatMap((l) => l.words);
  return (
    <html lang="vi" className={`${vn.variable} ${jpSans.variable} ${jpMincho.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader words={words} kanjiIndex={getKanjiIndex()} />
        <main className="site-main">
          <div className="container">{children}</div>
        </main>
        <footer className="site-footer">
          <div className="container">
            Học theo giáo trình Minna no Nihongo sơ cấp I. Tiến độ “đã thuộc” được lưu trên trình duyệt của bạn.
          </div>
        </footer>
        <ScrollTop />
      </body>
    </html>
  );
}
