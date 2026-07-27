import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL("https://7788oio.icu"),
  title: {
    default: "7788 游戏服务器",
    template: "%s · 7788 游戏服务器",
  },
  description:
    "Terraria 灾厄与 Minecraft 私人整合服的内容介绍、进服教程和运行状态。",
  openGraph: {
    title: "7788 游戏服务器",
    description: "两片世界，一个网站。在玩什么、信息汇总与此刻状态。",
    type: "website",
    locale: "zh_CN",
    siteName: "7788 游戏服务器",
    images: [
      {
        url: "/og.png",
        width: 1734,
        height: 907,
        alt: "7788 游戏服务器 — Terraria 与 Minecraft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "7788 游戏服务器",
    description: "两片世界，一个网站。在玩什么、信息汇总与此刻状态。",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
