import type { Metadata } from "next";
import { GameDetailPage } from "@/components/game-detail-page";
import { terrariaMods } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Terraria 探索战斗服",
  description: "7788 Terraria tModLoader 灾厄整合服的玩法、版本和模组概览。",
};

export default function TerrariaPage() {
  return (
    <GameDetailPage
      worldLabel="WORLD 01 / TERRARIA"
      titleLines={["Terraria"]}
      description="以 Calamity 为主线的五人小服。保留大型内容模组带来的探索感，再用合成查询、魔法存储和体验优化减少重复劳动。"
      joinHref="/terraria/join"
      statusLabel="探索战斗"
      specs={[
        { label: "游戏版本", value: "Terraria 1.4.4.9" },
        { label: "加载器", value: "tModLoader 2026.05.3.0" },
        { label: "世界类型", value: "Large / Expert" },
        { label: "启用模组", value: "28" },
        { label: "核心玩法", value: "Calamity / Boss Progression" },
        { label: "存档策略", value: "定时自动备份" },
      ]}
      address="tr.7788oio.icu:18035"
      profileLabel="PLAY STYLE"
      profileTitle="内容有分量，日常不费劲。"
      profileDescription="围绕主线冒险、物资管理和多人体验构成三条清晰的玩法路径，既保留挑战，也减少重复操作。"
      features={[
        {
          code: "CORE / 01",
          title: "灾厄主线与终局内容",
          body: "Calamity、Wrath of the Gods 与 Hunt of the Old God 构成主要冒险线。",
        },
        {
          code: "SYSTEM / 02",
          title: "存储与查询",
          body: "Magic Storage、Recipe Browser 与 Boss Checklist 负责整理物资和推进信息。",
        },
        {
          code: "QOL / 03",
          title: "多人体验优化",
          body: "ImproveGame、自动重铸和额外装备栏等内容减少联机中的重复操作。",
        },
      ]}
      mods={terrariaMods}
      modTitleLines={["完整模组清单"]}
      modDescription="完整列出整合包当前启用的 28 个模组，包括内容、前置、汉化与客户端体验组件。"
      closingLabel="CO-OP / FIVE PLAYERS"
      closingTitle="慢慢推进，随时回来。"
      closingBody="Boss 进度和公共资源由大家一起维护；个人装备、建筑与探索路线则保留各自的节奏。"
    />
  );
}
