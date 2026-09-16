"use client";

import { useEffect, useState } from "react";
import { fetchStatus, isStatusExpired, type StatusPayload } from "@/lib/status-client";
import { siteConfig } from "@/lib/site-config";
import { MetricBar } from "./metric-bar";
import { ResourceTrendChart } from "./resource-trend-chart";
import { StatusBadge, type StatusTone } from "./status-badge";

const STATUS_API_URL = siteConfig.statusApiUrl;
const STATUS_POLL_INTERVAL_MS = 10_000;


function formatLatency(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }

  const seconds = (value / 1000)
    .toFixed(3)
    .replace(/0+$/, "")
    .replace(/\.$/, "");

  return `${seconds} s`;
}

function formatBytes(value: number | null) {
  if (value === null) return "—";
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
  if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)} MB`;
  return `${Math.round(value / 1024)} KB`;
}

function formatRate(value: number | null) {
  if (value === null) return "—";
  return `${formatBytes(value)}/s`;
}

function roundedMetric(value: number | null) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function statusTone(value: boolean | null): StatusTone {
  if (value === true) return "online";
  if (value === false) return "offline";
  return "unknown";
}

function onlineLabel(value: boolean | null) {
  if (value === true) return "在线";
  if (value === false) return "离线";
  return "状态未知";
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat("zh-CN", {
    ...(sameDay ? {} : { month: "2-digit", day: "2-digit" }),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatLatestScheduledBackup(value: string | null | undefined) {
  if (!value) return "读取中";

  const reference = new Date(value);
  if (Number.isNaN(reference.getTime())) return "每日 06:29";

  const chinaTime = new Date(reference.getTime() + 8 * 60 * 60 * 1000);
  const backupTime = new Date(chinaTime);
  backupTime.setUTCHours(6, 29, 0, 0);

  if (chinaTime.getTime() < backupTime.getTime()) {
    backupTime.setUTCDate(backupTime.getUTCDate() - 1);
  }

  const sameDay =
    backupTime.getUTCFullYear() === chinaTime.getUTCFullYear() &&
    backupTime.getUTCMonth() === chinaTime.getUTCMonth() &&
    backupTime.getUTCDate() === chinaTime.getUTCDate();

  return `${sameDay ? "今日" : "昨日"} 06:29`;
}

export function StatusDashboard() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [requestFailed, setRequestFailed] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return;

      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      setNow(Date.now());
      try {
        const next = await fetchStatus(STATUS_API_URL, requestController.signal);
        if (active && controller === requestController && !requestController.signal.aborted) {
          setStatus(next);
          setRequestFailed(false);
          setNow(Date.now());
        }
      } catch {
        // Superseded requests and unmounts are silent; timeouts are failures.
        if (active && controller === requestController && !requestController.signal.aborted) {
          setRequestFailed(true);
        }
      }
    };

    void refresh();
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    const interval = window.setInterval(() => {
      void refresh();
    }, STATUS_POLL_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    const refreshWhenFocused = () => {
      void refresh();
    };
    const refreshWhenOnline = () => {
      void refresh();
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenFocused);
    window.addEventListener("online", refreshWhenOnline);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenFocused);
      window.removeEventListener("online", refreshWhenOnline);
    };
  }, []);

  const terraria = status?.terraria;
  const host = status?.host;
  const dataUnavailable =
    !status || status.stale || !status.collector.ok || requestFailed || isStatusExpired(status, now);
  const terrariaOnline = dataUnavailable ? null : terraria?.online ?? null;
  const playerCountAvailable =
    !dataUnavailable && terraria?.players != null;
  const cpuHistory =
    dataUnavailable
      ? null
      : status.history.cpu.length
        ? status.history.cpu
        : host?.cpuPercent == null
          ? null
          : [host.cpuPercent];
  const memoryHistory =
    dataUnavailable
      ? null
      : status.history.memory.length
        ? status.history.memory
        : host?.memoryPercent == null
          ? null
          : [host.memoryPercent];
  const latestUpdate = formatUpdatedAt(
    status?.collector.lastSuccessAt,
  );

  return (
    <>
      <section className="status-grid page-shell">
        <article className="service-panel">
          <div className="service-head">
            <div>
              <span className="mono-label">SERVICE / TERRARIA</span>
              <h2>泰拉服</h2>
            </div>
            <StatusBadge tone={statusTone(terrariaOnline)}>
              {onlineLabel(terrariaOnline)}
            </StatusBadge>
          </div>
          <div className="service-main-stat" aria-live="polite">
            <strong>{playerCountAvailable ? terraria.players : "—"}</strong>
            <span>
              {playerCountAvailable ? "名玩家在线" : "在线人数暂不可用"}
            </span>
          </div>
          <dl className="service-details">
            <div><dt>公开地址</dt><dd>{terraria?.address ?? "tr.7788oio.icu:18035"}</dd></div>
            <div><dt>版本</dt><dd>{terraria?.version ?? (requestFailed ? "未知" : "读取中")}</dd></div>
            <div><dt>世界</dt><dd>{terraria?.world ?? (requestFailed ? "未知" : "读取中")}</dd></div>
            <div>
              <dt title="按雨云每日 06:29 自动备份任务显示">最近备份</dt>
              <dd>{!status && requestFailed ? "未知" : formatLatestScheduledBackup(status?.generatedAt)}</dd>
            </div>
          </dl>
          <div className="service-latency-block">
            <div>
              <span className="mono-label">HK NODE / HTTPS</span>
              <strong>香港节点探针</strong>
              <small>此网站到游戏主机 HTTPS 探针</small>
            </div>
            <div className="service-latency-reading">
              <strong>{formatLatency(dataUnavailable ? null : terraria?.gameLatencyMs)}</strong>
              <span>{dataUnavailable ? "暂不可用" : "HTTPS"}</span>
            </div>
          </div>
          <div className="game-resource-block">
            <div className="game-resource-heading">
              <span className="mono-label">PROCESS / LIVE</span>
              <span>进程内存 {formatBytes(dataUnavailable ? null : terraria?.process.memoryBytes ?? null)}</span>
            </div>
            <div className="game-resource-grid">
              <MetricBar
                label="进程 CPU"
                value={dataUnavailable ? null : terraria?.process.cpuPercent ?? null}
              />
              <MetricBar
                label="主机内存占比"
                value={dataUnavailable ? null : terraria?.process.memoryPercent ?? null}
              />
            </div>
          </div>
        </article>

        <article className="service-panel">
          <div className="service-head">
            <div>
              <span className="mono-label">SERVICE / MINECRAFT</span>
              <h2>MC服</h2>
            </div>
            <StatusBadge tone="planning">待办</StatusBadge>
          </div>
          <div className="service-main-stat">
            <strong>—</strong>
            <span>待定</span>
          </div>
          <dl className="service-details">
            <div><dt>公开地址</dt><dd>待定</dd></div>
            <div><dt>版本</dt><dd>待定</dd></div>
            <div><dt>世界</dt><dd>待定</dd></div>
            <div><dt>最近备份</dt><dd>待定</dd></div>
          </dl>
          <div className="service-latency-block">
            <div>
              <span className="mono-label">HK NODE / HTTPS</span>
              <strong>香港节点探针</strong>
              <small>待定</small>
            </div>
            <div className="service-latency-reading">
              <strong>—</strong>
              <span>待定</span>
            </div>
          </div>
          <div className="game-resource-block">
            <div className="game-resource-heading">
              <span className="mono-label">PROCESS / INACTIVE</span>
              <span>待定</span>
            </div>
          </div>
        </article>
      </section>

      <section className="section page-shell">
        <div className="monitor-panel">
          <div className="monitor-heading">
            <div>
              <span className="mono-label">HOST / LIVE SNAPSHOT</span>
              <h2>游戏主机资源</h2>
            </div>
            <span className="refresh-note">
              {!status
                ? requestFailed
                  ? "数据暂不可用"
                  : "正在读取实时数据"
                : dataUnavailable
                  ? latestUpdate
                    ? `数据暂不可用 · 上次 ${latestUpdate}`
                    : "数据暂不可用"
                  : `更新于 ${latestUpdate ?? "刚刚"} · 页面自动更新 · 数据每 ${status.collector.intervalSeconds} 秒采集`}
            </span>
          </div>
          <div className="resource-status-legend" aria-label="资源状态颜色说明">
            <span className="legend-normal"><i aria-hidden />正常 0–59%</span>
            <span className="legend-watch"><i aria-hidden />关注 60–79%</span>
            <span className="legend-high"><i aria-hidden />高负载 80–100%</span>
          </div>
          <div className="metrics-grid">
            <MetricBar label="CPU" value={dataUnavailable ? null : host?.cpuPercent ?? null} />
            <MetricBar label="内存" value={dataUnavailable ? null : host?.memoryPercent ?? null} />
            <MetricBar label="数据盘" value={dataUnavailable ? null : host?.dataDiskPercent ?? null} />
          </div>
          <div className="game-resource-heading">
            <span className="mono-label">NETWORK / HOST</span>
            <span>
              接收 {formatRate(dataUnavailable ? null : host?.networkRxBytesPerSecond ?? null)}
              {" · "}
              发送 {formatRate(dataUnavailable ? null : host?.networkTxBytesPerSecond ?? null)}
            </span>
          </div>
          <div className="resource-chart-grid">
            <ResourceTrendChart
              label="CPU 使用率"
              data={cpuHistory?.map(roundedMetric) ?? null}
              currentValue={dataUnavailable ? null : host?.cpuPercent ?? null}
              points={dataUnavailable ? undefined : status?.history.cpuSeries}
              summary={dataUnavailable ? undefined : status?.history.cpuSummary}
              windowStart={status?.history.windowStart}
              windowEnd={status?.history.windowEnd}
              color="#7182ff"
            />
            <ResourceTrendChart
              label="内存使用率"
              data={memoryHistory?.map(roundedMetric) ?? null}
              currentValue={dataUnavailable ? null : host?.memoryPercent ?? null}
              points={dataUnavailable ? undefined : status?.history.memorySeries}
              summary={dataUnavailable ? undefined : status?.history.memorySummary}
              windowStart={status?.history.windowStart}
              windowEnd={status?.history.windowEnd}
              color="#55bca9"
            />
          </div>
        </div>
      </section>
    </>
  );
}
