import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/latency-client.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { measureEndpoint } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const baseUrl = "https://example.com/status";

test("measures five sequential samples and uses their median", async (t) => {
  const times = [0, 80, 100, 120, 200, 300, 400, 440, 500, 560];
  t.mock.method(performance, "now", () => times.shift());
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => { urls.push(url); return new Response("ok"); });
  assert.equal(await measureEndpoint("/ping", new AbortController().signal, baseUrl), 60);
  assert.equal(urls.length, 5);
  assert.equal(new Set(urls.map(url => url.search)).size, 5);
  assert.ok(urls.every(url => url.origin === "https://example.com" && url.pathname === "/ping"));
});

test("cancellation aborts the active request without starting more samples", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, { signal }) => {
    calls += 1;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
  });
  const controller = new AbortController();
  const request = measureEndpoint("/ping", controller.signal, baseUrl);
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  assert.equal(calls, 1);
  await assert.rejects(measureEndpoint("/ping", controller.signal, baseUrl), { name: "AbortError" });
  assert.equal(calls, 1);
});

test("a timed out line fails while another line completes independently", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    if (url.pathname === "/ok") return new Response("ok");
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
  });
  const signal = new AbortController().signal;
  const results = await Promise.allSettled([
    measureEndpoint("/hang", signal, baseUrl, 10),
    measureEndpoint("/ok", signal, baseUrl, 10),
  ]);
  assert.equal(results[0].status, "rejected");
  assert.equal(results[1].status, "fulfilled");
  assert.equal(signal.aborted, false);
});
