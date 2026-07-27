import type { Metadata } from "next";
import { LatencyTester } from "../../components/latency-tester";
import { MetricBar } from "../../components/metric-bar";
import { ResourceTrendChart } from "../../components/resource-trend-chart";
import { StatusBadge } from "../../components/status-badge";
import {
  gameRuntimeSnapshots,
  resourceHistory,
} from "../../lib/server-data";

export const metadata: Metadata = {
  title: "服务器状态",
  description: "7788 Terraria 与 Minecraft 游戏服务器的公开运行状态。",
};

export default function StatusPage() {
  return (
    <>
      <section className="status-hero page-shell">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot seafoam" />
            PUBLIC STATUS
          </div>
          <h1>世界运行状态</h1>
          <p>面向玩家的轻量状态页，集中展示两个世界和游戏主机的运行情况。</p>
        </div>
        <div className="demo-banner">
          <StatusBadge tone="demo">演示数据</StatusBadge>
          <p>主机、进程和游戏探针当前展示安全的示例数据。</p>
        </div>
      </section>

      <section className="status-grid page-shell">
        {gameRuntimeSnapshots.map((service) => (
          <article className="service-panel" key={service.id}>
            <div className="service-head">
              <div>
                <span className="mono-label">{service.eyebrow}</span>
                <h2>{service.title}</h2>
              </div>
              <StatusBadge tone="online">模拟在线</StatusBadge>
            </div>
            <div className="service-main-stat">
              <strong>{service.players}</strong>
              <span>名玩家在线 · 演示</span>
            </div>
            <dl className="service-details">
              <div><dt>公开地址</dt><dd>{service.address}</dd></div>
              <div><dt>版本</dt><dd>{service.version}</dd></div>
              <div><dt>世界</dt><dd>{service.world}</dd></div>
              <div><dt>最大人数</dt><dd>{service.maxPlayers}</dd></div>
            </dl>
            <div className="game-resource-block">
              <div className="game-resource-heading">
                <span className="mono-label">PROCESS / DEMO SNAPSHOT</span>
                <span>进程内存 {service.processMemory}</span>
              </div>
              <div className="game-resource-grid">
                <MetricBar label="进程 CPU" value={service.cpu} />
                <MetricBar label="主机内存占比" value={service.memory} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="section page-shell status-latency-section">
        <LatencyTester
          services={gameRuntimeSnapshots.map((service) => ({
            id: service.id,
            label: service.title,
            endpoint: "/latency-probe.txt",
            demoLatency: service.demoLatency,
          }))}
        />
      </section>

      <section className="section page-shell">
        <div className="monitor-panel">
          <div className="monitor-heading">
            <div>
              <span className="mono-label">HOST / DEMO SNAPSHOT</span>
              <h2>游戏主机资源</h2>
            </div>
            <span className="refresh-note">示例快照 · 非实时</span>
          </div>
          <div className="resource-status-legend" aria-label="资源状态颜色说明">
            <span className="legend-normal"><i aria-hidden />正常 0–59%</span>
            <span className="legend-watch"><i aria-hidden />关注 60–79%</span>
            <span className="legend-high"><i aria-hidden />高负载 80–100%</span>
          </div>
          <div className="metrics-grid">
            <MetricBar label="CPU" value={18} />
            <MetricBar label="内存" value={27} />
            <MetricBar label="数据盘" value={14} />
          </div>
          <div className="resource-chart-grid">
            <ResourceTrendChart
              label="CPU 使用率"
              data={resourceHistory.cpu}
              color="#7182ff"
            />
            <ResourceTrendChart
              label="内存使用率"
              data={resourceHistory.memory}
              color="#55bca9"
            />
          </div>
        </div>
      </section>

      <section className="section page-shell status-facts">
        <article><span>采集间隔</span><strong>30–60 秒</strong><p>状态后端通过安全的 HTTPS 只读链路汇总数据。</p></article>
        <article><span>数据过期</span><strong>2 分钟</strong><p>超时后显示“未知”，避免把采集中断误判为离线。</p></article>
        <article><span>公开边界</span><strong>仅玩家所需</strong><p>不公开 SSH、内网地址、密码、认证码或日志原文。</p></article>
      </section>
    </>
  );
}
