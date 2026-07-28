import type { Metadata } from "next";
import { GameDetailPage } from "@/components/game-detail-page";
import { minecraftMods } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Minecraft 内容待定",
  description:
    "7788 Minecraft 世界的版本、模组、玩法与进服方案待定。",
};

export default function MinecraftPage() {
  return (
    <GameDetailPage
      worldLabel="WORLD 02 / MINECRAFT"
      titleLines={["Minecraft"]}
      description="游戏版本、加载器、玩法、模组与连接方式待定。"
      joinHref="/minecraft/join"
      statusLabel="待办"
      statusTone="planning"
      specs={[
        { label: "游戏版本", value: "待定" },
        { label: "加载器", value: "待定" },
        { label: "世界类型", value: "待定" },
        { label: "启用模组", value: "待定" },
        { label: "核心玩法", value: "待定" },
        { label: "存档策略", value: "待定" },
      ]}
      address="待定"
      profileLabel="MINECRAFT"
      profileTitle="世界内容待定。"
      profileDescription="玩法、版本与整合方案待定。"
      features={[
        {
          code: "INFO / 01",
          title: "玩法方向",
          body: "待定。",
        },
        {
          code: "INFO / 02",
          title: "版本与加载器",
          body: "待定。",
        },
        {
          code: "INFO / 03",
          title: "整合包与联机",
          body: "待定。",
        },
      ]}
      mods={minecraftMods}
      modTitleLines={["模组清单待定"]}
      modDescription="模组内容与数量待定。"
      closingLabel="MINECRAFT / STATUS"
      closingTitle="开放计划待定。"
      closingBody="加入方式待定。"
    />
  );
}
