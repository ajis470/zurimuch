import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "オカズマッチ｜好きなタイプのAV女優を直感的にマッチング",
    template: "%s | オカズマッチ",
  },
  description: "簡単直感操作！今自分が好きなAV女優から顔・身長・カップ・肉付き等の重視するポイントを直感的に操作して探している「タイプ」の女優をAIがマッチング。今夜の「オカズ」や新しい「推し」が今すぐ見つかります。",
  metadataBase: new URL("https://zurimuch.com"),
  alternates: {
    canonical: "https://zurimuch.com/",
  },
  openGraph: {
    siteName: "オカズマッチ",
    locale: "ja_JP",
    type: "website",
    url: "https://zurimuch.com/",
    title: "オカズマッチ｜好きなタイプのAV女優を直感的にマッチング",
    description: "簡単直感操作！顔・身長・カップ・肉付き等の重視するポイントをスライダーで調整して「タイプ」のAV女優をAIがマッチング。",
  },
  verification: {
    google: "EPCxg9LUgcGcEHXlmFwwcDOrED74R-6gjUt23-KGB5U",
  },
  other: {
    rating: "adult",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-433P4LPWEB"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-433P4LPWEB');
          `}
        </Script>
      </body>
    </html>
  );
}
