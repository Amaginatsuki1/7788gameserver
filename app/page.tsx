import Link from "next/link";
import { DualWorldHero } from "../components/dual-world-hero";
import { StatusBadge } from "../components/status-badge";

const serverSummaries = [
  {
    index: "01",
    game: "Terraria",
    version: "1.4.4.9 · tModLoader 2026.05.3.0",
    mods: "29",
    modsLabel: "启用模组",
  },
  {
    index: "02",
    game: "Minecraft",
    version: "版本与加载器待定",
    mods: "—",
    modsLabel: "模组待定",
  },
];

export default function Home() {
  return (
    <>
      <DualWorldHero>
        <div className="hero-copy page-shell">
          <h1>两片世界<br />一个网站</h1>
          <p className="hero-lead">
            在玩什么，信息汇总，此刻状态。
          </p>
          <p className="micro-note">Terraria 探索战斗 · Minecraft 内容待办</p>
        </div>
        <div className="hero-worldbar page-shell" aria-label="服务器世界概览">
          <div className="worldbar-intro">
            <span className="mono-label">WORLD DIRECTORY</span>
            <strong>当前世界</strong>
          </div>
          <div className="worldbar-item">
            <span>01</span>
            <div>
              <strong>Terraria · Calamity</strong>
              <small>大世界 · 大师 · 猩红</small>
            </div>
            <StatusBadge tone="online">探索战斗</StatusBadge>
          </div>
          <div className="worldbar-item">
            <span>02</span>
            <div>
              <strong>Minecraft · Java</strong>
              <small>版本 · 模组 · 玩法待定</small>
            </div>
            <StatusBadge tone="planning">待办</StatusBadge>
          </div>
        </div>
      </DualWorldHero>

      <section className="stats-strip page-shell" aria-label="服务器概览">
        {serverSummaries.map((server) => (
          <article className="server-summary" key={server.game}>
            <span className="server-summary-index">{server.index}</span>
            <div className="server-summary-name">
              <strong>{server.game}</strong>
              <span>{server.version}</span>
            </div>
            <div className="server-summary-mods">
              <strong>{server.mods}</strong>
              <span>{server.modsLabel}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="section page-shell">
        <div className="section-heading split-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot seafoam" />
              NOW PLAYING
            </div>
            <h2>这次开服，玩什么？</h2>
          </div>
          <p>
            两个世界使用同一套清晰入口
            <br />
            Terraria 冒险战斗，Minecraft 内容待定
          </p>
        </div>

        <div className="game-grid">
          <article className="game-card game-card-dark">
            <div className="game-card-head">
              <span className="game-index">01</span>
              <StatusBadge tone="online">探索战斗</StatusBadge>
            </div>
            <div className="game-card-body">
              <p className="mono-label light">TERRARIA / TMODLOADER</p>
              <h3>灾厄 / Calamity</h3>
              <p>
                围绕 Calamity 的 Boss 进度展开，加入终局扩展、多人辅助与存储查询，
                让战斗有强度、日常少重复。
              </p>
              <div className="tag-row">
                <span>Boss 进度</span>
                <span>终局扩展</span>
                <span>多人协作</span>
              </div>
            </div>
            <div className="game-card-actions">
              <Link href="/terraria">了解世界 <span aria-hidden>→</span></Link>
              <Link href="/terraria/join">进服教程 <span aria-hidden>→</span></Link>
            </div>
          </article>

          <article className="game-card game-card-light">
            <div className="game-card-head">
              <span className="game-index">02</span>
              <StatusBadge tone="planning">待办</StatusBadge>
            </div>
            <div className="game-card-body">
              <p className="mono-label">MINECRAFT / JAVA</p>
              <h3>Minecraft 内容待定</h3>
              <p>
                游戏版本、加载器、玩法、模组与连接方式待定。
              </p>
              <div className="tag-row">
                <span>版本待定</span>
                <span>模组待定</span>
                <span>玩法待定</span>
              </div>
            </div>
            <div className="game-card-actions">
              <Link href="/minecraft">了解世界 <span aria-hidden>→</span></Link>
              <Link href="/minecraft/join">进服教程 <span aria-hidden>→</span></Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section section-tint">
        <div className="page-shell onboarding-layout">
          <div className="onboarding-intro">
            <div className="eyebrow">
              <span className="eyebrow-dot orange" />
              START HERE
            </div>
            <h2>进服流程</h2>
            <p>
              不用翻聊天记录。先选世界，再按对应教程准备客户端，
              最后检查服务器状态并加入。
            </p>
          </div>

          <ol className="onboarding-steps">
            {[
              {
                number: "01",
                kicker: "CHOOSE A WORLD",
                title: "选择想进入的世界",
                body: "Terraria 可按教程进入，Minecraft 内容待定。",
              },
              {
                number: "02",
                kicker: "PREPARE THE CLIENT",
                title: "按教程准备游戏",
                body: "核对游戏版本、加载器与整合包，跟着对应教程完成安装，不用自行拼装模组。",
              },
              {
                number: "03",
                kicker: "CHECK AND JOIN",
                title: "确认在线，然后加入",
                body: "在状态页确认世界在线，复制公开地址进入游戏。",
              },
            ].map((step) => (
              <li className="onboarding-step" key={step.number}>
                <span className="onboarding-number">{step.number}</span>
                <div>
                  <span className="mono-label">{step.kicker}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section page-shell">
        <div className="status-callout">
          <div>
            <p className="mono-label light">STATUS / PUBLIC PREVIEW</p>
            <h2>
              出发之前
              <br />
              先看一眼世界是否醒着
            </h2>
            <p>
              状态页汇总两个世界的在线情况、人数、版本与主机资源
              <br />
              并通过安全的只读接口统一展示。
            </p>
          </div>
          <Link className="button button-light" href="/status">
            查看状态页 <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
