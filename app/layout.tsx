import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://app.instyle.group/recruitment-test-2026";
const ASSETS = "https://app.instyle.group/_shared/static";
const TITLE = "INSTYLE GROUP 採用カルチャーテスト 2026";
const DESCRIPTION =
  "INSTYLE GROUP の働き方・価値観への適合度を測る、イプサティブ評価形式の採用カルチャーテスト。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: `${ASSETS}/favicon.png`,
    apple: `${ASSETS}/favicon.png`,
  },
  openGraph: {
    type: "website",
    siteName: "INSTYLE GROUP",
    locale: "ja_JP",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${ASSETS}/ogp.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${ASSETS}/ogp.jpg`],
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
