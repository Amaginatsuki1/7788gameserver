export type TrendPoint = { at: number; value: number | null };
export type TrendSummary = { average: number | null; peak: number | null };
export const STATUS_MAX_AGE_MS = 120_000;
export const STATUS_REQUEST_TIMEOUT_MS = 8_000;

export type StatusPayload = {
  schemaVersion: number;
  generatedAt: string;
  stale: boolean;
  collector: {
    ok: boolean;
    lastSuccessAt: string | null;
    intervalSeconds: number;
  };
  terraria: {
    online: boolean | null;
    players: number | null;
    address: string;
    version: string;
    world: string;
    gameLatencyMs: number | null;
    process: {
      cpuPercent: number | null;
      memoryBytes: number | null;
      memoryPercent: number | null;
    };
  };
  host: {
    cpuPercent: number | null;
    memoryPercent: number | null;
    dataDiskPercent: number | null;
    networkRxBytesPerSecond: number | null;
    networkTxBytesPerSecond: number | null;
  };
  history: {
    windowStart?: number;
    windowEnd?: number;
    cpuSeries?: TrendPoint[];
    memorySeries?: TrendPoint[];
    cpuSummary?: TrendSummary;
    memorySummary?: TrendSummary;
    cpu: number[];
    memory: number[];
  };
};

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const metric = (value: unknown) => value === null || finite(value);
const date = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

export function parseStatusPayload(value: unknown): StatusPayload {
  if (!record(value) || value.schemaVersion !== 1 || !date(value.generatedAt) || typeof value.stale !== "boolean") {
    throw new Error("Invalid status response");
  }
  const { collector, terraria, host, history } = value;
  if (!record(collector) || typeof collector.ok !== "boolean" ||
      !(collector.lastSuccessAt === null || date(collector.lastSuccessAt)) ||
      !finite(collector.intervalSeconds) || collector.intervalSeconds <= 0 ||
      !record(terraria) || ![true, false, null].includes(terraria.online as boolean | null) ||
      !metric(terraria.players) || !metric(terraria.gameLatencyMs) ||
      !["address", "version", "world"].every(key => typeof terraria[key] === "string") ||
      !record(terraria.process) || !["cpuPercent", "memoryBytes", "memoryPercent"].every(key => metric((terraria.process as Record<string, unknown>)[key])) ||
      !record(host) || !["cpuPercent", "memoryPercent", "dataDiskPercent", "networkRxBytesPerSecond", "networkTxBytesPerSecond"].every(key => metric(host[key])) ||
      !record(history) || !["cpu", "memory"].every(key => Array.isArray(history[key]) && (history[key] as unknown[]).every(finite))) {
    throw new Error("Invalid status fields");
  }
  // New history fields are optional while existing collectors are upgraded.
  for (const key of ["cpuSeries", "memorySeries"]) {
    const series = history[key];
    if (series !== undefined && (!Array.isArray(series) || series.length > 1000 ||
        !series.every(point => record(point) && finite(point.at) && metric(point.value)))) {
      throw new Error("Invalid status history");
    }
  }
  for (const key of ["cpuSummary", "memorySummary"]) {
    const summary = history[key];
    if (summary !== undefined && (!record(summary) || !metric(summary.average) || !metric(summary.peak))) {
      throw new Error("Invalid status summary");
    }
  }
  if ((history.cpuSeries !== undefined || history.memorySeries !== undefined) &&
      (!finite(history.windowStart) || !finite(history.windowEnd) || history.windowEnd <= history.windowStart)) {
    throw new Error("Invalid history window");
  }
  return value as StatusPayload;
}

export function isStatusExpired(status: StatusPayload, now = Date.now()) {
  const sampledAt = Date.parse(status.collector.lastSuccessAt ?? "");
  const generatedAt = Date.parse(status.generatedAt);
  return !Number.isFinite(sampledAt) || !Number.isFinite(generatedAt) ||
    now - sampledAt > STATUS_MAX_AGE_MS || now - generatedAt > STATUS_MAX_AGE_MS ||
    sampledAt - now > STATUS_MAX_AGE_MS || generatedAt - now > STATUS_MAX_AGE_MS;
}

export async function fetchStatus(url: string, signal: AbortSignal, timeoutMs = STATUS_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Status API returned ${response.status}`);
    return parseStatusPayload(await response.json());
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
