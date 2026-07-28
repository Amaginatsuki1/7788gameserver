import type { Metadata } from "next";
import { JoinGuidePage } from "@/components/join-guide-page";

export const metadata: Metadata = {
  title: "Minecraft 教程待办",
  description:
    "7788 Minecraft 进服教程待定。",
};

const steps = [
  {
    number: "01",
    title: "游戏运行环境",
    body: "待定。",
    note: "版本、加载器与 Java 环境待定",
    visualLabel: "运行环境",
    visualTitle: "待定",
    visualPath: ["游戏版本待定", "加载器待定", "Java 环境待定"],
  },
  {
    number: "02",
    title: "整合包",
    body: "待定。",
    note: "模组、配置与获取方式待定",
    visualLabel: "整合包",
    visualTitle: "待定",
    visualPath: ["模组清单待定", "配置文件待定", "获取方式待定"],
  },
  {
    number: "03",
    title: "服务器连接",
    body: "待定。",
    note: "地址与加入条件待定",
    visualLabel: "服务器连接",
    visualTitle: "待定",
    visualPath: ["服务器地址待定", "加入条件待定", "连接方式待定"],
  },
  {
    number: "04",
    title: "进服步骤",
    body: "待定。",
    note: "安装与进入步骤待定",
    visualLabel: "进服步骤",
    visualTitle: "待定",
    visualPath: ["安装方式待定", "启动方式待定", "进入步骤待定"],
  },
];

export default function MinecraftJoinPage() {
  return (
    <JoinGuidePage
      gameName="Minecraft"
      gameHref="/minecraft"
      eyebrow="JOIN GUIDE · MINECRAFT"
      eyebrowTone="seafoam"
      titleLines={["四项待办", "等待确认"]}
      intro="版本、整合包、服务器地址与操作步骤待定。"
      address="待定"
      checklist={[
        "游戏版本与加载器待定",
        "整合包与配置待定",
        "服务器连接待定",
        "进服步骤待定",
      ]}
      steps={steps}
      helpItems={[
        {
          label: "VERSION",
          title: "版本与加载器",
          body: "待定。",
        },
        {
          label: "MODPACK",
          title: "整合包与配置",
          body: "待定。",
        },
        {
          label: "CONNECTION",
          title: "连接地址与规则",
          body: "待定。",
        },
      ]}
    />
  );
}
