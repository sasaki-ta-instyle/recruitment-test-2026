import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://app.instyle.group/recruitment-test-2026";
// public/ 配下に置いた採用テスト専用ロゴ/OGP（basePath 込みの絶対 URL）
const FAVICON_URL = `${SITE_URL}/favicon.png`;
const OGP_URL = `${SITE_URL}/ogp.jpg`;
const TITLE = "INSTYLE GROUP 採用カルチャーテスト";
const DESCRIPTION =
  "INSTYLE GROUP の働き方・価値観への適合度を測る、イプサティブ評価形式の採用カルチャーテスト。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: FAVICON_URL,
    apple: FAVICON_URL,
  },
  openGraph: {
    type: "website",
    siteName: "INSTYLE GROUP",
    locale: "ja_JP",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OGP_URL, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OGP_URL],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
