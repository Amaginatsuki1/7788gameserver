import type { Metadata } from "next";
import { LatencyTester } from "../../components/latency-tester";
import { StatusDashboard } from "../../components/status-dashboard";

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
          <p>在线人数，服务状态，主机资源</p>
        </div>
      </section>

      <StatusDashboard />

      <section className="section page-shell status-latency-section">
        <LatencyTester
          services={[
            {
              id: "terraria",
              eyebrow: "PROBE / TERRARIA",
              label: "泰拉服",
              gameEndpoint: "https://tr.7788oio.icu:28443/ping",
              websiteEndpoint: "/latency-probe.txt",
              available: true,
            },
            {
              id: "minecraft",
              eyebrow: "PROBE / MINECRAFT",
              label: "MC服",
              gameEndpoint: null,
              websiteEndpoint: "/latency-probe.txt",
              available: false,
            },
          ]}
        />
      </section>

      <section className="section page-shell status-facts">
        <article><span>采集间隔</span><strong>30 秒</strong><p>香港状态后端通过受限只读通道采集游戏主机数据。</p></article>
        <article><span>数据过期</span><strong>2 分钟</strong><p>超时后显示“未知”，避免把采集中断误判为游戏离线。</p></article>
        <article><span>数据误差</span><strong>仅供参考</strong><p>受网站与游戏服各自网络环境影响，页面数据存在一定延迟，且不完全准确。</p></article>
      </section>
    </>
  );
}
