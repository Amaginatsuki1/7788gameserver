import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/status-client.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { parseStatusPayload, isStatusExpired, fetchStatus } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const now = Date.now();
function payload() {
  return {
    schemaVersion: 1, generatedAt: new Date(now).toISOString(), stale: false,
    collector: { ok: true, lastSuccessAt: new Date(now).toISOString(), intervalSeconds: 30 },
    terraria: { online: true, players: 0, gameLatencyMs: 50, address: "example.com", version: "test", world: "test", process: { cpuPercent: 1, memoryBytes: 1024, memoryPercent: 1 } },
    host: { cpuPercent: 10, memoryPercent: 20, dataDiskPercent: 30, networkRxBytesPerSecond: 0, networkTxBytesPerSecond: 0 },
    history: { periodHours: 24, cpu: [10], memory: [20] },
  };
}

test("supports the deployed legacy response and nullable metrics", () => {
  const value = payload();
  value.terraria.players = null;
  value.host.cpuPercent = null;
  assert.equal(parseStatusPayload(value), value);
});

test("expires a cached online response even if the server stale flag stays false", () => {
  const value = payload();
  assert.equal(isStatusExpired(value, now), false);
  assert.equal(isStatusExpired(value, now + 120001), true);
  value.collector.lastSuccessAt = new Date(now - 120001).toISOString();
  assert.equal(isStatusExpired(value, now), true);
});

test("rejects missing response branches and malformed history before rendering", () => {
  assert.throws(() => parseStatusPayload({ schemaVersion: 1 }));
  const missing = payload(); delete missing.terraria.process;
  assert.throws(() => parseStatusPayload(missing));
  const invalid = payload(); invalid.history.cpu = [Infinity];
  assert.throws(() => parseStatusPayload(invalid));
  const future = payload(); future.generatedAt = new Date(now + 130000).toISOString();
  assert.equal(isStatusExpired(future, now), true);
});

test("accepts timestamped history with explicit gaps", () => {
  const value = payload();
  Object.assign(value.history, { windowStart: 1, windowEnd: 1000, cpuSeries: [{ at: 900, value: null }], cpuSummary: { average: 10, peak: 100 } });
  assert.equal(parseStatusPayload(value), value);
  value.history.windowEnd = 0;
  assert.throws(() => parseStatusPayload(value));
});

test("a hanging request times out and a later request can recover", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }));
  await assert.rejects(fetchStatus("https://example.com/api/status", new AbortController().signal, 10), { name: "AbortError" });
  globalThis.fetch.mock.restore();
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(payload())));
  assert.equal((await fetchStatus("https://example.com/api/status", new AbortController().signal)).terraria.online, true);
});

test("caller cancellation aborts the in-flight request", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }));
  const controller = new AbortController();
  const request = fetchStatus("https://example.com/api/status", controller.signal);
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
});
