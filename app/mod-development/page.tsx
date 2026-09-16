import type { Metadata } from "next";
import { ModArchitectureExplorer } from "@/components/mod-architecture-explorer";
import { ModRuntimeFlow } from "@/components/mod-runtime-flow";

export const metadata: Metadata = {
  title: "Daybreak DamageTracker 伤害追踪",
  description:
    "Daybreak DamageTracker 的运行逻辑、技术实现、当前版本与待做事项。",
};

const capabilities = [
  {
    title: "直接伤害与持续伤害",
    description: "按服务器实际扣除的生命值统计；能确认来源的 DoT 归入玩家，未知来源仍保留在团队总量。",
  },
  {
    title: "每只 Boss 独立结算",
    description: "同时出现多只 Boss 时各自维护账本、时长和结果，谁先结束，谁先发布。",
  },
  {
    title: "生命周期边界裁决",
    description: "区分击杀、非 OnKill 消失、换阶段与演出等待；已发布结果不会被残留 NPC 重新打开。",
  },
  {
    title: "公开排行与私有来源",
    description: "公共结果只含排行；武器、弹幕、Buff 与 DoT 来源树仅投影给对应玩家。",
  },
];

const nextSteps = [
  {
    status: "进行中",
    title: "覆盖正式联机边界",
    description:
      "继续验证普通胜负、同时多 Boss、车轮战、换阶段、断线重连与长面板交互。",
  },
  {
    status: "长期",
    title: "补充特殊 Boss 适配",
    description:
      "为非常规最终形态、无 NPC 演出阶段和特殊战斗组增加明确的生命周期配置。",
  },
  {
    status: "持续",
    title: "回归测试",
    description: "找bug要记录复现办法",
  },
];

export default function ModDevelopmentPage() {
  return (
    <>
      <section className="article-hero page-shell mod-dev-hero">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          MOD DEVELOPMENT / OPEN NOTES
        </div>
        <div className="mod-dev-hero-grid">
          <h1 aria-label="Daybreak DamageTracker，伤害追踪">
            <span className="mod-dev-title-en">Daybreak DamageTracker</span>
            <span className="mod-dev-title-zh">伤害追踪</span>
          </h1>
          <div className="mod-dev-hero-copy">
            <p>
              <strong>有建议？欢迎！</strong>
              <span>请跳转 GitHub Issues / Steam 创意工坊讨论区</span>
            </p>
            <div className="button-row">
              <a
                className="button button-primary"
                href="https://github.com/Amaginatsuki1/Daybreak-DamageTracker/issues"
                target="_blank"
                rel="noreferrer"
              >
                GitHub Issues <span aria-hidden>↗</span>
              </a>
              <a
                className="button button-secondary"
                href="https://steamcommunity.com/sharedfiles/filedetails/discussions/3776927292"
                target="_blank"
                rel="noreferrer"
              >
                Steam 讨论区 <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section page-shell mod-dev-version">
        <div className="mod-dev-version-card">
          <div className="mod-dev-version-label">
            <span>CURRENT VERSION</span>
          </div>
          <strong>0.1.12</strong>
          <p>
            修复分段与分裂 Boss 的重复挑战结算，新增嵌套 Boss 精确实例归属、
            灾厄 Boss Rush 与天顶灾虫因果转场判定。
          </p>
        </div>
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            WHAT IT DOES NOW
          </div>
          <h2>现在已经能做什么</h2>
          <div className="mod-dev-capabilities">
            {capabilities.map((capability, index) => (
              <article key={capability.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section page-shell mod-runtime-section">
        <div className="section-heading split-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              RUNNING LOGIC / READ FIRST
            </div>
            <h2>运行逻辑</h2>
          </div>
          <p>从开始到结算的路径</p>
        </div>
        <ModRuntimeFlow />
      </section>

      <section className="section section-deep mod-implementation-section">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                TECHNICAL IMPLEMENTATION / FOR DEVELOPERS
              </div>
              <h2>实现方式</h2>
            </div>
            <p>展开执行边界、状态约束、网络模型、接口依据与真实源码。</p>
          </div>
          <ModArchitectureExplorer />
        </div>
      </section>

      <section className="section section-tint mod-todo-section">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                NEXT
              </div>
              <h2>当前待做事项</h2>
            </div>
            <p>复现，验证，修复</p>
          </div>
          <ol className="mod-dev-todo">
            {nextSteps.map((step, index) => (
              <li key={step.title}>
                <span className="mod-dev-todo-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="mod-dev-todo-status">{step.status}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

    </>
  );
}
