"use client";

import { useState } from "react";

export type LatencyService = {
  id: string;
  label: string;
  endpoint: string;
  demoLatency: number;
};

type ProbeState = {
  status: "idle" | "testing" | "done" | "error";
  latency?: number;
};

const latencyLevel = (value: number) =>
  value > 100 ? "high" : value > 50 ? "watch" : "normal";

const latencyLabel = (value: number) =>
  value > 100 ? "较高" : value > 50 ? "一般" : "顺畅";

async function takeSample(endpoint: string, sample: number) {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("probe", `${Date.now()}-${sample}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4000);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Probe returned ${response.status}`);
    }

    await response.text();
    return performance.now() - startedAt;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function LatencyTester({
  services,
}: {
  services: LatencyService[];
}) {
  const [probes, setProbes] = useState<Record<string, ProbeState>>(() =>
    Object.fromEntries(
      services.map((service) => [service.id, { status: "idle" }]),
    ),
  );

  const runProbe = async (service: LatencyService) => {
    setProbes((current) => ({
      ...current,
      [service.id]: { status: "testing" },
    }));

    try {
      const samples = [];
      for (let index = 0; index < 3; index += 1) {
        samples.push(await takeSample(service.endpoint, index));
      }

      samples.sort((a, b) => a - b);
      const latency = Math.max(1, Math.round(samples[1]));
      setProbes((current) => ({
        ...current,
        [service.id]: { status: "done", latency },
      }));
    } catch {
      setProbes((current) => ({
        ...current,
        [service.id]: { status: "error" },
      }));
    }
  };

  return (
    <div className="latency-panel">
      <div className="latency-heading">
        <div>
          <span className="mono-label">NETWORK / BROWSER CHECK</span>
          <h2>延迟测速</h2>
        </div>
        <p>
          游戏探针为演示数据；按钮测量当前设备到状态页的三次 HTTP
          往返中位数。
        </p>
      </div>

      <div className="latency-grid">
        {services.map((service) => {
          const probe = probes[service.id] ?? { status: "idle" };
          const demoLevel = latencyLevel(service.demoLatency);
          const measuredLevel =
            probe.status === "error"
              ? "high"
              : probe.latency === undefined
                ? "neutral"
                : latencyLevel(probe.latency);

          return (
            <article className="latency-card" key={service.id}>
              <div className="latency-card-head">
                <div>
                  <span className="mono-label">PROBE / {service.id}</span>
                  <h3>{service.label}</h3>
                </div>
                <span className={`latency-quality latency-${demoLevel}`}>
                  <i aria-hidden />
                  {latencyLabel(service.demoLatency)}
                </span>
              </div>

              <div className="latency-readings">
                <div className={`latency-reading latency-${demoLevel}`}>
                  <span>游戏探针 · 演示</span>
                  <strong>{service.demoLatency}<small>ms</small></strong>
                </div>
                <div
                  className={`latency-reading latency-${measuredLevel}`}
                  aria-live="polite"
                >
                  <span>你的网页链路</span>
                  <strong>
                    {probe.status === "testing"
                      ? "…"
                      : probe.status === "error"
                        ? "失败"
                        : probe.latency ?? "—"}
                    {probe.latency !== undefined && <small>ms</small>}
                  </strong>
                </div>
              </div>

              <div className="latency-card-foot">
                <span>浏览器无法直接探测游戏 TCP 端口</span>
                <button
                  type="button"
                  onClick={() => runProbe(service)}
                  disabled={probe.status === "testing"}
                >
                  {probe.status === "testing" ? "测速中" : "开始测速"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
