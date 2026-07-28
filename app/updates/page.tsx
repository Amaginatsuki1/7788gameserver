import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "更新记录",
  description: "7788 游戏服务器的部署、模组与维护更新。",
};

const updates = [
  {
    date: "2026.07.25",
    title: "服务器配置完成",
    subtitle: "完成系统准备工作，尚未进行设置修改。",
    details: ["完成自动备份", "高负载缓冲", "驱动及运行库安装"],
  },
  {
    date: "2026.07.25",
    title: "服务器设置修改",
    subtitle: "按 Minecraft + Terraria 双服思路修改配置。",
    details: ["待实际服务端接入后再排查问题"],
  },
  {
    date: "2026.07.25",
    title: "测试 Terraria 模组冲突",
    subtitle: "出现 SpringStoolJumpHotKey，且客户端触发钩子。",
    details: [
      "移除 Catalyst Mod",
      "移除 ArmamentDisplay",
      "移除 Automated Mining",
      "BAM v1.2.5 在专用服务器稳定触发集合异常、并发字典错误",
    ],
  },
  {
    date: "2026.07.25",
    title: "更新 Terraria 模组列表",
    subtitle: "重新打包，并配置双端同步。",
    details: ["新增 WMITF、Census", "Consolaria 更新至 2.2.3"],
  },
  {
    date: "2026.07.26",
    title: "Terraria 服务端上线",
    subtitle: "通过域名映射上线服务端并完成测试。",
    details: ["移除后无阻止加载的新错误", "在线操作延迟较高，待优化"],
  },
  {
    date: "2026.07.26",
    title: "网站上线",
    subtitle: "此网站初版上线，目前仅有两份进服教程静态页面。",
    details: [
      "目前和 PDF 没有区别，待优化并对接游戏服务器",
      "仅作此次上线记录，此后网站前后端修改不记录",
    ],
  },
  {
    date: "2026.07.26",
    title: "Terraria 完成 IP 进服",
    subtitle: "服务器公网 IP 解析到域名并完成测试。",
    details: [
      "DNS 解析从 Cloudflare 迁移到国内服务器",
      "优化网络延迟，启用公网 TCP 加速访问",
    ],
  },
  {
    date: "2026.07.27",
    title: "更新 Terraria 模组列表，完成身份配置",
    subtitle: "更新到最新版模组列表，细化各模组内设置并完成测试。",
    details: [
      "新增 Old Grape Beer 6.9",
      "收紧可实时更改的服务端模组权限管理",
    ],
  },
  {
    date: "2026.07.28",
    title: "Terraria 正式创建世界",
    subtitle: "模组已经确认，正式创建 Terraria 世界。",
    details: ["Terraria 服务端正式上线，进服办法详见 Terraria 页面"],
  },
];

export default function UpdatesPage() {
  return (
    <>
      <section className="article-hero page-shell updates-hero">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          CHANGELOG / PUBLIC NOTES
        </div>
        <h1>每一次世界变化<br />都留下记录</h1>
        <p>
          按时间记录服务器、模组与世界的
          <span className="phrase-nowrap">关键变化</span>，具体调整集中列在每条记录下。
        </p>
      </section>

      <section className="timeline page-shell">
        {updates.map((update, updateIndex) => (
          <article className="timeline-item" key={`${update.date}-${update.title}`}>
            <div className="timeline-meta">
              <span>{update.date}</span>
              <strong>RECORD / {String(updateIndex + 1).padStart(2, "0")}</strong>
            </div>
            <div className="timeline-content">
              <h2>{update.title}</h2>
              <h3>{update.subtitle}</h3>
              <ul className="timeline-details">
                {update.details.map((detail, detailIndex) => (
                  <li key={detail}>
                    <span>{String(detailIndex + 1).padStart(2, "0")}</span>
                    <p>{detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="section page-shell">
        <div className="notice-panel compact-notice">
          <div>
            <span className="mono-label">TWO WORLDS / ONE STATUS PAGE</span>
            <h2>两个世界的运行情况集中展示。</h2>
          </div>
          <p>在线人数、服务器版本和主机资源都能在同一页查看。</p>
          <Link className="text-link" href="/status">查看状态 <span aria-hidden>→</span></Link>
        </div>
      </section>
    </>
  );
}
