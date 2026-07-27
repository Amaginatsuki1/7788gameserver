import type { Metadata } from "next";
import { GameDetailPage } from "@/components/game-detail-page";
import { minecraftMods } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Minecraft 冒险生存服",
  description:
    "以 Create、农夫乐事与维度探索为核心的 Minecraft Java 冒险生存整合服。",
};

export default function MinecraftPage() {
  return (
    <GameDetailPage
      worldLabel="WORLD 02 / MINECRAFT"
      titleLines={["Minecraft"]}
      description="围绕 Create、农夫乐事与探索维度展开。有人建设自动化产线，有人经营农场与厨房，也有人负责寻找地牢、遗迹和新的世界。"
      joinHref="/minecraft/join"
      statusLabel="冒险生存"
      specs={[
        { label: "游戏版本", value: "Minecraft Java 1.20.1" },
        { label: "加载器", value: "Forge 47.x" },
        { label: "世界类型", value: "Survival / Hard" },
        { label: "启用模组", value: "12" },
        { label: "核心玩法", value: "Create / Settlement" },
        { label: "存档策略", value: "定时自动备份" },
      ]}
      address="mc.7788oio.icu"
      profileLabel="PLAY STYLE"
      profileTitle="每个人都有自己的工程。"
      profileDescription="围绕自动化、聚落生活和维度探索构成三条清晰的玩法路径，共享资源和交通网络，各自选择喜欢的方向。"
      features={[
        {
          code: "CREATE / 01",
          title: "机械动力与自动化",
          body: "用齿轮、传动轴和列车搭起生产网络，让重复劳动交给机器完成。",
        },
        {
          code: "LIVING / 02",
          title: "烹饪与聚落生活",
          body: "建农场、开厨房、布置公共空间，让基地不只是仓库和工作台。",
        },
        {
          code: "EXPLORE / 03",
          title: "维度探索与生物",
          body: "前往暮色森林与强化地牢，寻找稀有材料、装备和新的生物群落。",
        },
      ]}
      mods={minecraftMods}
      modTitleLines={["完整模组清单"]}
      modDescription="完整列出整合包当前启用的 12 个模组，包括自动化、生活、探索与客户端体验组件。"
      closingLabel="CO-OP / FIVE PLAYERS"
      closingTitle="慢慢建设，随时回来。"
      closingBody="公共仓库、铁路和聚落由大家一起维护；个人基地和探索路线则保留各自的风格。"
    />
  );
}
