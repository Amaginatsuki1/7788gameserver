import type { Metadata } from "next";
import { JoinGuidePage } from "@/components/join-guide-page";

export const metadata: Metadata = {
  title: "Minecraft 进服教程",
  description:
    "从安装 Forge、导入整合包到连接 7788 Minecraft 服务器的完整步骤。",
};

const steps = [
  {
    number: "01",
    title: "准备 Minecraft 与 Java",
    body: "安装 Minecraft Java 版，并确认启动器使用 Java 17。先运行一次 1.20.1，再退出游戏。",
    note: "目标版本：Minecraft 1.20.1 / Java 17",
    visualLabel: "启动器与 Java 设置",
    visualTitle: "先建立正确的游戏环境",
    visualPath: ["安装 Java 17", "启动 1.20.1", "进入主菜单后退出"],
  },
  {
    number: "02",
    title: "安装 Forge 与整合包",
    body: "从朋友群取得当期整合包，按照包内说明安装 Forge 47.x，并将模组和配置文件完整导入。",
    note: "核心内容：Create、农夫乐事、暮色森林与多人体验模组",
    visualLabel: "Forge 与整合包导入",
    visualTitle: "保持模组和配置一致",
    visualPath: ["安装 Forge 47.x", "导入整合包", "保留包内配置"],
  },
  {
    number: "03",
    title: "核对启动配置",
    body: "在启动器中选择对应的 Forge 配置，建议分配 6 GB 内存。进入主菜单后检查模组列表是否完整。",
    note: "推荐内存：6 GB / 不要单独更新包内模组",
    visualLabel: "启动器配置页面",
    visualTitle: "选择 Forge 并分配内存",
    visualPath: ["选择 Forge 配置", "分配 6 GB 内存", "核对模组列表"],
  },
  {
    number: "04",
    title: "加入多人世界",
    body: "打开“多人游戏 → 添加服务器”，填写公开地址并保存。白名单由服主在朋友群内统一添加。",
    note: "服务器地址：mc.7788oio.icu",
    visualLabel: "Minecraft 多人游戏",
    visualTitle: "保存服务器并加入",
    visualPath: ["打开多人游戏", "添加服务器", "填写地址并连接"],
  },
];

export default function MinecraftJoinPage() {
  return (
    <JoinGuidePage
      gameName="Minecraft"
      gameHref="/minecraft"
      eyebrow="JOIN GUIDE · MINECRAFT"
      eyebrowTone="seafoam"
      titleLines={["四步进入", "冒险生存世界"]}
      intro="第一次安装建议预留约 15 分钟。使用统一整合包和启动配置，可以避开大多数版本与模组不一致问题。"
      address="mc.7788oio.icu"
      checklist={[
        "使用 Minecraft Java 正版账号",
        "准备 Java 17 与至少 6 GB 可用内存",
        "向服主私下获取整合包并加入白名单",
        "先检查状态页是否有维护通知",
      ]}
      steps={steps}
      helpItems={[
        {
          label: "CONNECTION FAILED",
          title: "服务器显示无法连接？",
          body: "先确认地址没有多余空格，再检查状态页是否正在维护。",
        },
        {
          label: "MOD MISMATCH",
          title: "提示模组不一致？",
          body: "重新导入当期整合包，不要单独升级 Forge 或其中某个模组。",
        },
        {
          label: "WHITELIST",
          title: "提示不在白名单？",
          body: "把游戏内名称发给服主，确认大小写与正版账号名称完全一致。",
        },
      ]}
    />
  );
}
