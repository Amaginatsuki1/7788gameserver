import { siteConfig } from "@/lib/site-config";
import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "7788 游戏服务器",
    template: "%s · 7788 游戏服务器",
  },
  description:
    "Terraria 探索战斗服的内容、教程与状态；Minecraft 世界信息待定。",
  openGraph: {
    title: "7788 游戏服务器",
    description: "两片世界，一个网站。在玩什么、信息汇总与此刻状态。",
    type: "website",
    locale: "zh_CN",
    siteName: "7788 游戏服务器",
    images: [
      {
        url: "/hero-minecraft-blue-hour.png",
        width: 1983,
        height: 793,
        alt: "7788 游戏服务器首页主视觉",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "7788 游戏服务器",
    description: "两片世界，一个网站。在玩什么、信息汇总与此刻状态。",
    images: ["/hero-minecraft-blue-hour.png"],
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
