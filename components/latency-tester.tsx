"use client";

import { useEffect, useRef, useState } from "react";
import { measureEndpoint } from "@/lib/latency-client";

export type LatencyService = {
  id: string;
  label: string;
  eyebrow: string;
  gameEndpoint: string | null;
  websiteEndpoint: string;
  available: boolean;
};

type ProbeState = {
  status: "idle" | "testing" | "done" | "error";
  latency?: number;
};

type ServiceProbeState = {
  game: ProbeState;
  website: ProbeState;
};

const latencyLevel = (value: number) =>
  value > 100 ? "high" : value > 50 ? "watch" : "normal";

const latencyLabel = (value: number) =>
  value > 100 ? "较高" : value > 50 ? "一般" : "顺畅";

function probePresentation(probe: ProbeState, available: boolean) {
  if (!available) {
    return { level: "neutral", label: "待定" };
  }

  if (probe.status === "testing") {
    return { level: "neutral", label: "测速中" };
  }

  if (probe.status === "error") {
    return { level: "high", label: "失败" };
  }

  if (probe.latency !== undefined) {
    return {
      level: latencyLevel(probe.latency),
      label: latencyLabel(probe.latency),
    };
  }

  return { level: "neutral", label: "待测速" };
}

const initialServiceState = (): ServiceProbeState => ({
  game: { status: "idle" },
  website: { status: "idle" },
});

export function LatencyTester({
  services,
}: {
  services: LatencyService[];
}) {
  const [probes, setProbes] = useState<Record<string, ServiceProbeState>>(() =>
    Object.fromEntries(
      services.map((service) => [service.id, initialServiceState()]),
    ),
  );

  const requests = useRef(new Map<string, AbortController>());
  useEffect(() => {
    const pending = requests.current;
    return () => {
      for (const controller of pending.values()) controller.abort();
      pending.clear();
    };
  }, []);

  const updateProbe = (
    serviceId: string,
    target: keyof ServiceProbeState,
    state: ProbeState,
  ) => {
    setProbes((current) => ({
      ...current,
      [serviceId]: {
        ...(current[serviceId] ?? initialServiceState()),
        [target]: state,
      },
    }));
  };

  const runServiceProbe = async (service: LatencyService) => {
    if (!service.available || !service.gameEndpoint || requests.current.has(service.id)) return;
    const controller = new AbortController();
    requests.current.set(service.id, controller);

    setProbes((current) => ({
      ...current,
      [service.id]: {
        game: { status: "testing" },
        website: { status: "testing" },
      },
    }));

    const measure = async (target: keyof ServiceProbeState, endpoint: string) => {
      try {
        const latency = await measureEndpoint(endpoint, controller.signal, window.location.href);
        if (!controller.signal.aborted) updateProbe(service.id, target, { status: "done", latency });
      } catch {
        if (!controller.signal.aborted) updateProbe(service.id, target, { status: "error" });
      }
    };
    try {
      await Promise.all([
        measure("game", service.gameEndpoint),
        measure("website", service.websiteEndpoint),
      ]);
    } finally {
      if (requests.current.get(service.id) === controller) requests.current.delete(service.id);
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
          每个游戏分别测量你的设备到游戏服和当前网页的响应路径，两条线路各采样 5 次并取中位数，单次采样超时 4 秒。
          <br />
          结果包含 DNS、TCP、TLS 与 HTTP 开销，仅用于判断当前网络体验。
        </p>
      </div>

      <div className="latency-grid">
        {services.map((service) => {
          const serviceProbe = probes[service.id] ?? initialServiceState();
          const isTesting =
            serviceProbe.game.status === "testing" ||
            serviceProbe.website.status === "testing";
          const hasError =
            serviceProbe.game.status === "error" ||
            serviceProbe.website.status === "error";

          const readings = [
            {
              id: "game",
              statusLabel: "游戏服",
              label: "你的设备到游戏服",
              probe: serviceProbe.game,
            },
            {
              id: "website",
              statusLabel: "此网页",
              label: "你的设备到此网页",
              probe: serviceProbe.website,
            },
          ] as const;

          return (
            <article className="latency-card" key={service.id}>
              <div className="latency-card-head">
                <div>
                  <span className="mono-label">{service.eyebrow}</span>
                  <h3>{service.label}</h3>
                </div>
                <div
                  className="latency-quality-group"
                  aria-label={`${service.label}两条测速状态`}
                >
                  {readings.map((reading) => {
                    const presentation = probePresentation(
                      reading.probe,
                      service.available,
                    );

                    return (
                      <span
                        className={`latency-quality latency-${presentation.level}`}
                        key={reading.id}
                      >
                        <i aria-hidden />
                        {reading.statusLabel} · {presentation.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="latency-readings">
                {readings.map((reading) => {
                  const presentation = probePresentation(
                    reading.probe,
                    service.available,
                  );

                  return (
                    <div
                      className={`latency-reading latency-${presentation.level}`}
                      aria-live="polite"
                      key={reading.id}
                    >
                      <span>{reading.label}</span>
                      <strong>
                        {!service.available
                          ? "—"
                          : reading.probe.status === "testing"
                            ? "…"
                            : reading.probe.status === "error"
                              ? "—"
                              : reading.probe.latency ?? "—"}
                        {reading.probe.latency !== undefined && <small>ms</small>}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="latency-card-foot">
                <span>
                  {!service.available
                    ? "待定"
                    : hasError
                      ? "部分线路无法完成测速，可再次尝试"
                      : "两条线路同时采样 · 各取 5 次中位数"}
                </span>
                <button
                  type="button"
                  onClick={() => runServiceProbe(service)}
                  disabled={!service.available || isTesting}
                >
                  {!service.available
                    ? "待定"
                    : isTesting
                      ? "测速中"
                      : "开始测速"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
