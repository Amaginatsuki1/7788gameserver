import type { Metadata } from "next";
import { JoinGuidePage } from "@/components/join-guide-page";

export const metadata: Metadata = {
  title: "Terraria 进服教程",
  description: "从安装 tModLoader、订阅 Steam 合集到连接 7788 Terraria 服务器的图文教程。",
};

const steps = [
  {
    number: "01",
    title: "安装并启动 tModLoader",
    body: "在 Steam 搜索并安装 tModLoader。安装完成后先启动一次，确认能够进入主菜单，然后退出游戏。",
    note: "请先确保 Steam 已安装 Terraria；首次启动会建立后续需要的本地目录。",
    visualLabel: "Steam 商店中的 tModLoader 页面",
    visualTitle: "安装并运行一次",
    visualPath: ["搜索 tModLoader", "安装游戏", "启动一次后退出"],
    images: [
      {
        src: "/guide-terraria-01-install-tmodloader.webp",
        alt: "Steam 商店中的 tModLoader 页面",
        caption: "在 Steam 搜索 tModLoader，安装完成后先运行一次。",
        width: 1600,
        height: 797,
      },
    ],
  },
  {
    number: "02",
    title: "订阅 7788 创意工坊合集",
    body: "打开 7788 合集并点击“订阅全部”。合集包含当前服务器使用的 29 个模组，Steam 会自动开始下载。",
    note: "等 Steam 下载队列完成后再启动 tModLoader，避免只加载到一部分模组。",
    visualLabel: "确认合集名称与创建者",
    visualTitle: "订阅服务器使用的全部模组",
    visualPath: ["打开 7788 合集", "点击订阅全部", "等待 Steam 下载完成"],
    action: {
      label: "在 Steam 应用中打开合集 ↗",
      href: "steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3772737777",
    },
    images: [
      {
        src: "/guide-terraria-02-steam-collection.webp",
        alt: "Steam 创意工坊中名为 7788 的模组合集",
        caption: "合集名称为 7788，创建者显示为 Daybreak-skyline。",
        width: 483,
        height: 183,
      },
    ],
  },
  {
    number: "03",
    title: "启用全部模组",
    body: "启动 tModLoader，依次进入“创意工坊 → 管理模组”，点击“启用全部模组”，然后返回并等待模组重新加载完成。",
    note: "看到模组状态变为“已启用”后，再进入多人模式。",
    visualLabel: "tModLoader 管理模组",
    visualTitle: "一次启用合集中的全部模组",
    visualPath: ["进入创意工坊", "打开管理模组", "点击启用全部模组"],
    images: [
      {
        src: "/guide-terraria-03-enable-all-mods.webp",
        alt: "tModLoader 管理模组界面中的启用全部模组按钮",
        caption: "点击“启用全部模组”，返回后耐心等待重新加载。",
        width: 1248,
        height: 784,
      },
    ],
  },
  {
    number: "04",
    title: "填写服务器地址并加入",
    body: "依次进入“多人模式 → 通过 IP 加入”，新建一个人物存档。主机填写 tr.7788oio.icu，端口填写 18035，最后输入密码。",
    note: "主机和端口需要分开填写。",
    inputTip: {
      lead: "如果打不出字母",
      detail: "先检查是不是忘记切换英文输入法。",
    },
    visualLabel: "主机与端口填写示例",
    visualTitle: "分两次填写连接信息",
    visualPath: ["多人模式", "通过 IP 加入", "填写主机与端口"],
    images: [
      {
        src: "/guide-terraria-04-server-host.webp",
        alt: "Terraria 服务器 IP 地址填写示例，内容为 tr.7788oio.icu",
        caption: "服务器 IP 地址填写 tr.7788oio.icu",
        width: 957,
        height: 267,
      },
      {
        src: "/guide-terraria-05-server-port.webp",
        alt: "Terraria 服务器端口填写示例，内容为 18035",
        caption: "服务器端口填写 18035",
        width: 750,
        height: 332,
      },
      {
        src: "/guide-terraria-06-server-password.jpeg",
        alt: "Terraria 服务器密码提示配图",
        caption: "输入密码:群名称+如图六位香香数字",
        compact: true,
        emphasis: true,
        emphasisLabel: "PASSWORD / 连接密码",
        width: 198,
        height: 182,
      },
    ],
  },
];

export default function JoinPage() {
  return (
    <JoinGuidePage
      gameName="Terraria"
      gameHref="/terraria"
      eyebrow="JOIN GUIDE · TERRARIA"
      eyebrowTone="orange"
      titleLines={["四步进入", "灾厄世界"]}
      intro="按图完成 tModLoader 安装、合集订阅、模组启用和服务器连接。第一次加载模组时请多预留几分钟。"
      address="tr.7788oio.icu:18035"
      checklist={[
        "Steam 已安装 Terraria",
        "开启 Steam 网络加速",
        "先检查状态页是否有维护通知",
      ]}
      steps={steps}
      helpItems={[
        {
          label: "DOWNLOAD QUEUE",
          title: "订阅后没有开始下载？",
          body: "打开 Steam 下载页面确认队列；仍无任务时，重启 Steam 后再次打开合集检查订阅状态。",
        },
        {
          label: "MOD LOAD",
          title: "启用后一直在加载？",
          body: "首次加载 29 个模组会花一些时间。保持游戏窗口运行，不要在加载途中强制关闭。",
        },
        {
          label: "CONNECTION FAILED",
          title: "一直停在“正在连接”？",
          body: "先确认主机和端口分开填写且没有空格，再检查状态页是否正在维护。",
        },
      ]}
    />
  );
}
