import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href);

async function render(pathname) {
  const { default: worker } = await workerPromise;

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost"), {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the website shell and home page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>7788 游戏服务器<\/title>/i);
  assert.match(html, /两片世界/);
  assert.match(html, /Terraria/);
  assert.match(html, /Minecraft/);
  assert.match(html, /href="\/status"/);
});

const publicRoutes = [
  ["/terraria", /Terraria/],
  ["/terraria/join", /进服教程/],
  ["/minecraft", /Minecraft/],
  ["/minecraft/join", /四项待办/],
  ["/status", /世界运行状态/],
  ["/updates", /每一次世界变化/],
  ["/mod-development", /伤害追踪/],
];

for (const [pathname, marker] of publicRoutes) {
  test(`server-renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(await response.text(), marker);
  });
}

test("updates page renders the document A/B/C hierarchy", async () => {
  const response = await render("/updates");
  const html = await response.text();

  assert.match(html, /服务器配置完成/);
  assert.match(html, /完成系统准备工作，尚未进行设置修改/);
  assert.match(html, /完成自动备份/);
  assert.match(html, /Terraria 正式创建世界/);
  assert.match(html, /从 2026\.05\.3\.0 更新至 2026\.06\.3\.4/);
  assert.match(html, /移除 Damage Rank/);
  assert.match(html, /添加自制模组 Daybreak DamageTracker/);
  assert.match(html, /上线 Steam 创意工坊/);
  assert.match(html, /从 0\.1\.2 更新至 0\.1\.3/);
  assert.match(html, /更新 Daybreak DamageTracker/);
  assert.match(html, /从 0\.1\.3 更新至 0\.1\.5/);
  assert.match(html, /优化使用体验/);
  assert.match(html, /为后续开发扩展接口/);
  assert.match(html, /从 0\.1\.5 更新至 0\.1\.6/);
  assert.match(html, /同时多 Boss 改为独立统计与即时结算/);
  assert.match(html, /从 0\.1\.6 更新至 0\.1\.7/);
  assert.match(html, /新增权威持续伤害统计/);
  assert.doesNotMatch(html, /正式游戏服同步前仍需核验精确 Steam 发布包/);
  assert.match(html, /class="timeline-details"/);
  assert.doesNotMatch(html, />[abc]\s/);

  const newestRecord = html.indexOf("从 0.1.6 更新至 0.1.7");
  const previousPublicRecord = html.indexOf("从 0.1.5 更新至 0.1.6");
  const previousVersionRecord = html.indexOf("从 0.1.3 更新至 0.1.5");
  const workshopRecord = html.indexOf("上线 Steam 创意工坊");
  const previousRecord = html.indexOf("添加自制模组 Daybreak DamageTracker");
  const versionRecord = html.indexOf("从 2026.05.3.0 更新至 2026.06.3.4");
  const worldCreatedRecord = html.indexOf("Terraria 正式创建世界");
  const oldestRecord = html.indexOf("服务器配置完成");
  assert.ok(newestRecord < previousPublicRecord, "the 0.1.7 update should render first");
  assert.ok(previousPublicRecord < previousVersionRecord, "the 0.1.6 update should follow 0.1.7");
  assert.ok(previousVersionRecord < workshopRecord, "same-day updates should render newest first");
  assert.ok(workshopRecord < previousRecord, "same-day updates should render newest first");
  assert.ok(previousRecord < versionRecord, "older updates should render farther down");
  assert.ok(versionRecord < worldCreatedRecord, "older updates should render farther down");
  assert.ok(worldCreatedRecord < oldestRecord, "the oldest update should render last");
});

test("mod development page separates runtime logic from the published 0.1.7 implementation", async () => {
  const response = await render("/mod-development");
  const html = await response.text();
  const explorerSource = await readFile(
    new URL("../components/mod-architecture-explorer.tsx", import.meta.url),
    "utf8",
  );
  const runtimeSource = await readFile(
    new URL("../components/mod-runtime-flow.tsx", import.meta.url),
    "utf8",
  );

  assert.match(html, /Daybreak DamageTracker/);
  assert.match(html, /伤害追踪/);
  assert.match(html, /aria-label="Daybreak DamageTracker，伤害追踪"/);
  assert.match(html, /有建议？欢迎！/);
  assert.match(html, /请跳转 GitHub Issues \/ Steam 创意工坊讨论区/);
  assert.match(html, /CURRENT VERSION/);
  assert.match(html, /0\.1\.7/);
  assert.doesNotMatch(html, /0\.1\.6/);
  assert.doesNotMatch(html, /SERVER SYNC/);
  assert.match(html, /战斗统计系统 · 可钻取架构总览/);
  assert.match(html, /SERVER AUTHORITATIVE/);
  assert.match(html, /Encounter FSM/);
  assert.match(html, /运行逻辑/);
  assert.match(html, /实现方式/);
  assert.match(html, /从开始到结算的路径/);
  assert.match(html, /展开执行边界、状态约束、网络模型、接口依据与真实源码/);
  assert.match(html, /复现，验证，修复/);
  assert.match(html, /两条伤害路径，汇入同一套账本/);
  assert.doesNotMatch(html, /daybreak-damage-tracker-logic\.svg/);
  assert.match(explorerSource, /采集与归因层/);
  assert.match(explorerSource, /持续伤害计量与归因/);
  assert.match(explorerSource, /Boss 语义适配层/);
  assert.match(explorerSource, /遭遇协调器与状态机/);
  assert.match(explorerSource, /分层账本与身份模型/);
  assert.match(explorerSource, /生命周期裁决策略/);
  assert.match(explorerSource, /结果投影与网络交付/);
  assert.match(explorerSource, /CAPTURE \/ DIRECT HIT \+ DAMAGE OVER TIME/);
  assert.match(explorerSource, /AGGREGATION \/ RESOLUTION/);
  assert.match(explorerSource, /PublicResultSnapshot/);
  assert.match(explorerSource, /接口与实现依据/);
  assert.match(explorerSource, /docs\.tmodloader\.net\/docs\/stable\/class_mod_system\.html/);
  assert.match(explorerSource, /github\.com\/JavidPack\/BossChecklist/);
  assert.match(explorerSource, /highlightCSharpLine/);
  assert.match(explorerSource, /syntax-keyword/);
  assert.match(explorerSource, /lineStart/);
  assert.match(explorerSource, /HookStrikeNpc/);
  assert.match(explorerSource, /HookUpdateNpcBuffApplyDots/);
  assert.match(explorerSource, /WeightedDamageAccumulator\.Allocate/);
  assert.match(explorerSource, /PrivateSourceAttributionPolicy/);
  assert.match(explorerSource, /ScanActiveBosses/);
  assert.match(explorerSource, /PostUpdateWorld/);
  assert.match(explorerSource, /RecordPlayerDamage/);
  assert.match(explorerSource, /ResolveInactiveBoundary/);
  assert.match(explorerSource, /SendResultToConfiguredRecipients/);
  assert.match(explorerSource, /b258635e4f6b2146deec98b2fc7df4f70d0e3577/);
  assert.match(explorerSource, /mod-architecture-code-stack/);
  assert.doesNotMatch(explorerSource, /activeCodeIndex/);
  assert.match(runtimeSource, /实际生命损失/);
  assert.match(runtimeSource, /Boss key 完整缺席一次/);
  assert.match(html, /当前待做事项/);
  assert.match(html, /回归测试/);
  assert.match(html, /找bug要记录复现办法/);
  assert.match(html, /GitHub Issues/);
  assert.match(html, /Steam 讨论区/);
  assert.match(html, /Daybreak-DamageTracker\/issues/);
  assert.match(html, /filedetails\/discussions\/3776927292/);
  assert.doesNotMatch(html, /DEVELOPMENT APPROACH/);
  assert.doesNotMatch(html, /CONTRIBUTE/);
  assert.doesNotMatch(html, /从 Boss 识别开始/);
  assert.ok(
    html.indexOf("CURRENT VERSION") < html.indexOf("RUNNING LOGIC"),
    "the version section should render before the runtime logic",
  );
  assert.ok(
    html.indexOf("RUNNING LOGIC") < html.indexOf("TECHNICAL IMPLEMENTATION"),
    "the runtime logic should render before the technical implementation",
  );
  assert.ok(
    html.indexOf("TECHNICAL IMPLEMENTATION") < html.indexOf("当前待做事项"),
    "the technical implementation should render before the todo list",
  );
});

test("status dashboard uses the exact public API endpoint", async () => {
  const source = await readFile(
    new URL("../components/status-dashboard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /const STATUS_API_URL = "https:\/\/7788oio\.icu\/api\/status"/,
  );
  assert.doesNotMatch(source, /api\/status\?/);
  assert.doesNotMatch(source, /演示数据/);
});

test("status dashboard refreshes while visible and immediately after returning", async () => {
  const source = await readFile(
    new URL("../components/status-dashboard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const STATUS_POLL_INTERVAL_MS = 10_000/);
  assert.match(source, /document\.visibilityState === "hidden"/);
  assert.match(source, /document\.addEventListener\("visibilitychange"/);
  assert.match(source, /window\.addEventListener\("focus"/);
  assert.match(source, /window\.addEventListener\("online"/);
  assert.match(source, /!status\.collector\.ok/);
  assert.match(source, /页面自动更新/);
  assert.match(source, /aria-live="polite"/);
});

test("status page keeps the simplified public labels", async () => {
  const pageSource = await readFile(
    new URL("../app/status/page.tsx", import.meta.url),
    "utf8",
  );
  const dashboardSource = await readFile(
    new URL("../components/status-dashboard.tsx", import.meta.url),
    "utf8",
  );
  const latencySource = await readFile(
    new URL("../components/latency-tester.tsx", import.meta.url),
    "utf8",
  );

  assert.match(pageSource, /在线人数，服务状态，主机资源/);
  assert.match(latencySource, /你的设备到游戏服/);
  assert.match(latencySource, /你的设备到此网页/);
  assert.doesNotMatch(latencySource, /采样次数/);
  assert.match(latencySource, /Promise\.all/);
  assert.match(latencySource, /runServiceProbe/);
  assert.match(latencySource, /statusLabel: "游戏服"/);
  assert.match(latencySource, /statusLabel: "此网页"/);
  assert.match(latencySource, /latency-quality-group/);
  assert.match(pageSource, /websiteEndpoint: "\/latency-probe\.txt"/);
  assert.match(pageSource, /label: "泰拉服"/);
  assert.match(pageSource, /label: "MC服"/);
  assert.match(dashboardSource, /<h2>泰拉服<\/h2>/);
  assert.match(dashboardSource, /<h2>MC服<\/h2>/);
  assert.match(dashboardSource, /最近备份/);
  assert.match(dashboardSource, /在线人数暂不可用/);
  assert.match(dashboardSource, /香港节点探针/);
  assert.match(dashboardSource, /此网站到游戏主机 HTTPS 探针/);
  assert.match(dashboardSource, /HK NODE \/ HTTPS/);
  assert.doesNotMatch(dashboardSource, /HK NODE \/ TCP/);
  assert.match(pageSource, /数据误差/);
  assert.match(pageSource, /页面数据存在一定延迟，且不完全准确/);
});

test("Terraria mod data matches the latest 29-player shared list", async () => {
  const source = await readFile(
    new URL("../lib/server-data.ts", import.meta.url),
    "utf8",
  );
  const pageSource = await readFile(
    new URL("../app/terraria/page.tsx", import.meta.url),
    "utf8",
  );
  const workshopImage = await readFile(
    new URL("../public/mod-terraria-3744518122.jpg", import.meta.url),
  );
  const damageTrackerImage = await readFile(
    new URL("../public/mod-terraria-3776927292.jpg", import.meta.url),
  );

  assert.match(source, /"3744518122"/);
  assert.match(source, /复古葡萄啤酒 \(Old Grape Beer\)/);
  assert.match(source, /"3776927292"/);
  assert.match(source, /Daybreak DamageTracker/);
  assert.doesNotMatch(source, /"3423180893"|"Damage Rank"/);
  assert.match(pageSource, /value: "29"/);
  const workshopIds = [
    ...source.matchAll(/steamWorkshopMod\(\s*"(\d+)"/g),
  ].map((match) => match[1]);
  assert.equal(workshopIds.length, 29);
  assert.equal(new Set(workshopIds).size, 29);
  assert.doesNotMatch(source, /OioAdmin|HighFPSSupport/);
  assert.ok(workshopImage.byteLength > 1_000);
  assert.ok(damageTrackerImage.byteLength > 1_000);
});

test("Terraria public facts match the deployed game server", async () => {
  const [homeSource, pageSource, joinSource, backendSource] = await Promise.all(
    [
      "../app/page.tsx",
      "../app/terraria/page.tsx",
      "../app/terraria/join/page.tsx",
      "../monitoring-backend/status_backend.py",
    ].map((pathname) => readFile(new URL(pathname, import.meta.url), "utf8")),
  );
  const combined = [homeSource, pageSource, joinSource, backendSource].join("\n");

  assert.match(homeSource, /大世界 · 大师 · 猩红/);
  assert.match(pageSource, /value: "大世界 · 大师 · 猩红"/);
  assert.match(pageSource, /value: "每日 06:29 自动备份"/);
  assert.match(backendSource, /"world": "oio的冒险"/);
  assert.match(backendSource, /"worldType": "大世界 · 大师 · 猩红"/);
  assert.match(backendSource, /"maxPlayers": 5/);
  assert.match(backendSource, /"modCount": 29/);
  assert.match(combined, /Terraria 1\.4\.4\.9/);
  assert.match(combined, /tModLoader (?:v)?2026\.06\.3\.4/);
  assert.doesNotMatch(combined, /tModLoader (?:v)?2026\.05\.3\.0/);
  assert.match(combined, /tr\.7788oio\.icu:18035/);
  assert.doesNotMatch(combined, /Large \/ Expert|大型专家世界|灾厄测试服/);
});

test("formal copy and mobile guide layout keep the public pages release-ready", async () => {
  const [
    layoutSource,
    terrariaSource,
    terrariaJoinSource,
    addressSource,
    headerSource,
    cssSource,
  ] = await Promise.all(
    [
      "../app/layout.tsx",
      "../app/terraria/page.tsx",
      "../app/terraria/join/page.tsx",
      "../components/address-block.tsx",
      "../components/site-header.tsx",
      "../app/globals.css",
    ].map((pathname) => readFile(new URL(pathname, import.meta.url), "utf8")),
  );

  assert.match(layoutSource, /Terraria 探索战斗服的内容、教程与状态/);
  assert.match(layoutSource, /hero-minecraft-blue-hour\.png/);
  assert.doesNotMatch(layoutSource, /images: \["\/og\.png"\]/);
  assert.match(terrariaSource, /7788 Terraria 探索战斗服的玩法、版本和模组概览/);
  assert.doesNotMatch(`${layoutSource}\n${terrariaSource}`, /Terraria 灾厄服|灾厄整合服/);
  assert.match(addressSource, /disabled=\{addressPending\}/);
  assert.match(addressSource, /addressPending \? "待定"/);
  assert.match(headerSource, /aria-label="查看服务器状态"/);
  assert.match(terrariaJoinSource, /如果打不出字母/);
  assert.match(terrariaJoinSource, /先检查是不是忘记切换英文输入法/);
  assert.match(cssSource, /\.guide-input-tip\s*\{/);
  assert.match(
    cssSource,
    /\.guide-visual-frame\s*\{[\s\S]*?width:\s*100%;[\s\S]*?aspect-ratio:\s*auto;/,
  );
  assert.doesNotMatch(cssSource, /var\(--slate\)/);
});

test("Minecraft keeps its page layouts with TODO-only content", async () => {
  const sources = await Promise.all(
    [
      "../app/page.tsx",
      "../app/minecraft/page.tsx",
      "../app/minecraft/join/page.tsx",
      "../app/updates/page.tsx",
      "../components/status-dashboard.tsx",
      "../components/latency-tester.tsx",
    ].map((pathname) => readFile(new URL(pathname, import.meta.url), "utf8")),
  );
  const combined = sources.join("\n");

  assert.match(combined, /Minecraft 内容待定/);
  assert.match(combined, /statusTone="planning"/);
  assert.match(combined, /四项待办/);
  assert.match(combined, /版本与加载器待定/);
  assert.match(combined, /模组清单待定/);
  assert.match(combined, /body: "待定。"/);
  assert.doesNotMatch(
    combined,
    /页面结构|页面布局|待办结构|后续只需|补全正式|发布前复核/,
  );
  assert.doesNotMatch(
    combined,
    /Forge 47|Minecraft Java 1\.20\.1|mc\.7788oio\.icu|Create \/ Settlement|冒险生存/,
  );
});
