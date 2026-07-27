import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "更新记录",
  description: "7788 游戏服务器的部署、模组与维护更新。",
};

const updates = [
  {
    date: "2026.07.26",
    tag: "MODPACK",
    title: "模组清单更新为 7788-2",
    body: "服务器与网站已同步最新的 28 项启用清单，保留灾厄主线并调整辅助模组组合。",
    points: [
      "新增 WMITF 与 Census",
      "移除 Catalyst Mod 与 ArmamentDisplay",
      "Consolaria 更新至 2.2.3",
    ],
  },
  {
    date: "2026.07.25",
    tag: "MINECRAFT",
    title: "Minecraft 冒险生存服内容框架完成",
    body: "第二个世界以 Create 自动化、农夫乐事与维度探索为核心，兼顾长期建设和随时回归的联机节奏。",
    points: ["Forge 1.20.1", "最多 5 人", "使用 mc.7788oio.icu 连接"],
  },
  {
    date: "2026.07.24",
    tag: "TERRARIA",
    title: "探索战斗服完成公网真人进服验证",
    body: "tModLoader 世界已完成生成、保存、重启与公网连接验证，页面同步展示服务器配置与加入方式。",
    points: ["tr.7788oio.icu:18035 已可连接", "28 个客户端启用模组", "大型专家世界"],
  },
  {
    date: "2026.07.24",
    tag: "MODPACK",
    title: "移除 BAM，完成干净加载测试",
    body: "BAM v1.2.5 在专用服务器稳定触发并发集合异常，经确认后从本地包和服务器同步移除。",
    points: ["保留本地与服务器备份", "移除后无阻止加载的新错误", "本地与服务器模组清单保持同步"],
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
        <p>这里只发布玩家需要知道的内容。部署凭据、密码和管理日志不会出现在公开页面。</p>
      </section>

      <section className="timeline page-shell">
        {updates.map((update) => (
          <article className="timeline-item" key={`${update.date}-${update.title}`}>
            <div className="timeline-meta">
              <span>{update.date}</span>
              <strong>{update.tag}</strong>
            </div>
            <div className="timeline-content">
              <h2>{update.title}</h2>
              <p>{update.body}</p>
              <ul>
                {update.points.map((point) => <li key={point}>{point}</li>)}
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
