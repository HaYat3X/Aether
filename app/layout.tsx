import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";

import { ThemeProvider } from "./components/ThemeProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Lumo",
    template: "Lumo | %s",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" }, // モダンブラウザ（OS設定に自動追従）
      { url: "/favicon.ico" }, // フォールバック
    ],
    apple: "/aether_icon_dark_512.png", // iOS用
  },
  description:
    "Lumo is a knowledge graph management tool that helps you organize and visualize your information in a structured way.",
};

export const viewport: Viewport = {
  themeColor: "#060a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      data-theme="light"
      className={`${outfit.variable} ${jetbrainsMono.variable} ${notoSansJP.variable}`}
    >
      <body className="min-h-dvh overflow-hidden">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
