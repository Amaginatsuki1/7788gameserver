import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { projectRoot } from "./preview.mjs";

// Simulate an unrelated application occupying the default preview port.
const unrelated = net.createServer(socket => socket.end("not this project"));
unrelated.listen(3000, "127.0.0.1");
await once(unrelated, "listening");
const launcher = path.join(projectRoot, "scripts/preview.mjs");
const child = spawn(process.execPath, [launcher, "--no-open"], { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let output = "";
child.stdout.on("data", data => { output += data; process.stdout.write(data); });
child.stderr.on("data", data => { output += data; process.stderr.write(data); });
const exit = once(child, "exit");
let timer;
try {
  const ready = await new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Preview startup timed out. ${output}`)), 180_000);
    const inspect = () => {
      const match = output.match(/PREVIEW_READY (http:\/\/127\.0\.0\.1:(\d+)\/)/);
      if (match) resolve({ url: match[1], port: Number(match[2]) });
    };
    child.stdout.on("data", inspect);
    child.once("error", reject);
    child.once("exit", code => reject(new Error(`Preview exited ${code}. ${output}`)));
  });
  clearTimeout(timer);
  assert.ok(ready.port > 3000);
  for (const route of ["", "terraria", "terraria/join", "minecraft", "minecraft/join", "status", "updates", "mod-development"]) {
    const response = await fetch(new URL(route, ready.url), { signal: AbortSignal.timeout(60_000) });
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /7788/);
  }
  const before = await readFile(path.join(projectRoot, "node_modules/.7788-preview.json"), "utf8");
  const duplicate = spawn(process.execPath, [launcher, "--no-open"], { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let duplicateOutput = "";
  duplicate.stdout.on("data", data => { duplicateOutput += data; });
  duplicate.stderr.on("data", data => { duplicateOutput += data; });
  const [code] = await once(duplicate, "exit");
  assert.equal(code, 0, duplicateOutput);
  assert.ok(duplicateOutput.includes(ready.url));
  assert.ok(!duplicateOutput.includes("正在安装"));
  assert.equal(await readFile(path.join(projectRoot, "node_modules/.7788-preview.json"), "utf8"), before);
  assert.equal(unrelated.listening, true);
  console.log("Preview smoke test passed: port fallback, eight pages, cached dependencies, duplicate launch.");
} finally {
  clearTimeout(timer);
  child.kill("SIGTERM");
  await exit;
  await new Promise(resolve => unrelated.close(resolve));
}
