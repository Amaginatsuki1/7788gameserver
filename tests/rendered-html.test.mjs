import assert from "node:assert/strict";
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
  ["/minecraft/join", /进服教程/],
  ["/status", /世界运行状态/],
  ["/updates", /每一次世界变化/],
];

for (const [pathname, marker] of publicRoutes) {
  test(`server-renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(await response.text(), marker);
  });
}
