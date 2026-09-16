import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const projectRoot = fileURLToPath(new URL("..", import.meta.url));
export const supportsNode = (version) => {
  const [major, minor] = version.split(".").map(Number);
  return major > 22 || (major === 22 && minor >= 13);
};
export function dependencyFingerprint(lock, manifest, platform = process.platform, arch = process.arch, node = process.versions.node) {
  return createHash("sha256").update([lock, manifest, platform, arch, node.split(".")[0]].join("\0")).digest("hex");
}
export async function availablePort(start = 3000, count = 21) {
  for (let port = start; port < start + count; port++) {
    const free = await new Promise((resolve, reject) => {
      const socket = net.createServer();
      socket.once("error", error => error.code === "EADDRINUSE" || error.code === "EACCES" ? resolve(false) : reject(error));
      socket.listen(port, "127.0.0.1", () => socket.close(() => resolve(true)));
    });
    if (free) return port;
  }
  throw new Error("3000–3020 端口均被占用，请关闭一个不需要的本地服务后重试。");
}
function npmCli() {
  const executable = realpathSync(process.execPath);
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(executable), "node_modules/npm/bin/npm-cli.js"),
    path.resolve(path.dirname(executable), "../lib/node_modules/npm/bin/npm-cli.js"),
    "/usr/share/nodejs/npm/bin/npm-cli.js",
  ];
  const cli = candidates.find(candidate => candidate && candidate.endsWith("npm-cli.js") && existsSync(candidate));
  if (!cli) throw new Error("找不到 npm。请使用项目的一键启动文件，它会准备完整 Node.js 环境。");
  return cli;
}
function openBrowser(url) {
  const command = process.platform === "win32" ? "rundll32.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url];
  const child = spawn(command, args, { stdio: "ignore", windowsHide: true });
  const manual = () => console.log(`浏览器未能自动打开，请手动访问 ${url}`);
  child.on("error", manual);
  child.on("exit", code => { if (code !== 0) manual(); });
  child.unref();
}
function running(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === "EPERM"; }
}
async function readState(file) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; }
}
async function verifySession(state) {
  if (!Number.isInteger(state?.port) || state.port < 1024 || state.port > 65535 || typeof state.token !== "string") return false;
  try {
    const response = await fetch(`http://127.0.0.1:${state.port}/__7788_preview__?token=${encodeURIComponent(state.token)}`, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.json()).token === state.token;
  } catch { return false; }
}
export async function main(args = process.argv.slice(2)) {
  if (!supportsNode(process.versions.node)) throw new Error("需要 Node.js 22.13+，请使用一键启动文件自动准备环境。");
  if (args.some(arg => !["--no-open", "--prepare-only"].includes(arg))) throw new Error("支持的参数：--no-open、--prepare-only。");
  const shouldOpen = !args.includes("--no-open") && !process.env.CI;
  process.chdir(projectRoot);
  const cache = path.join(projectRoot, ".preview");
  const lockFile = path.join(cache, "session.json");
  await mkdir(cache, { recursive: true });
  const state = { pid: process.pid, token: randomUUID(), port: null };
  let lock;
  try { lock = await open(lockFile, "wx"); }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = await readState(lockFile);
    if (!existing) throw new Error("另一个启动窗口正在初始化；请稍等。如果所有预览窗口都已关闭，可删除 .preview/session.json 后重试。");
    if (running(existing.pid)) {
      if (await verifySession(existing)) {
        const url = `http://127.0.0.1:${existing.port}/`;
        console.log(`预览已运行：${url}`);
        if (shouldOpen && !args.includes("--prepare-only")) openBrowser(url);
        return;
      }
      throw new Error("本项目已有启动进程，请查看原启动窗口，不要重复安装依赖。");
    }
    await rm(lockFile);
    lock = await open(lockFile, "wx");
  }
  await lock.writeFile(JSON.stringify(state));
  await lock.close();
  let server;
  let installer;
  let stopping = false;
  const release = async () => {
    if ((await readState(lockFile))?.token === state.token) await rm(lockFile, { force: true });
  };
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    const forceExit = setTimeout(() => process.exit(0), 5000);
    forceExit.unref();
    installer?.kill();
    try { await server?.close(); } finally { await release(); process.exit(0); }
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  try {
    console.log("\n7788 本地预览 · 首次准备需要联网，完成后会自动打开浏览器。\n");
    const [lockContent, manifest] = await Promise.all([
      readFile(path.join(projectRoot, "package-lock.json"), "utf8"),
      readFile(path.join(projectRoot, "package.json"), "utf8"),
    ]);
    const fingerprint = dependencyFingerprint(lockContent, manifest);
    const stamp = path.join(projectRoot, "node_modules/.7788-preview.json");
    if ((await readState(stamp))?.fingerprint !== fingerprint || !existsSync(path.join(projectRoot, "node_modules/vite/package.json"))) {
      await rm(stamp, { force: true });
      console.log("正在安装或更新锁定版本的依赖，请保持窗口打开……");
      await new Promise((resolve, reject) => {
        installer = spawn(process.execPath, [npmCli(), "ci", "--include=dev", "--no-audit", "--no-fund"], {
          cwd: projectRoot, stdio: "inherit", windowsHide: true,
          env: { ...process.env, NODE_ENV: "development", PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}` },
        });
        installer.once("error", reject);
        installer.once("exit", code => code === 0 ? resolve() : reject(new Error("依赖安装失败。请检查网络、磁盘空间与上方 npm 提示，再次启动会重新安装。")));
      });
      installer = null;
      await writeFile(stamp, JSON.stringify({ fingerprint }));
    }
    if (args.includes("--prepare-only")) {
      console.log("PREVIEW_PREPARED 环境与依赖已就绪。");
      await release();
      return;
    }
    process.env.NODE_ENV = "development";
    process.env.LOCAL_PREVIEW = "1";
    const { createServer, loadEnv } = await import("vite");
    for (const [key, value] of Object.entries(loadEnv("development", projectRoot, ""))) process.env[key] ??= value;
    state.port = await availablePort();
    server = await createServer({
      root: projectRoot,
      server: { host: "127.0.0.1", port: state.port, strictPort: true, open: false, watch: { ignored: ["**/.preview/**", "**/outputs/**", "**/local-only/**", "**/work/**"] } },
      plugins: [{
        name: "7788-local-preview-session",
        configureServer(vite) {
          vite.middlewares.use((request, response, next) => {
            const url = new URL(request.url ?? "/", "http://localhost");
            if (url.pathname !== "/__7788_preview__" || url.searchParams.get("token") !== state.token) return next();
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-store");
            response.end(JSON.stringify({ token: state.token }));
          });
        },
      }],
    });
    await server.listen();
    const url = `http://127.0.0.1:${state.port}/`;
    console.log(`正在编译首页：${url}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html") || !(await response.text()).includes("7788")) {
      throw new Error("首页未能正确编译，请检查上方错误提示。");
    }
    await writeFile(lockFile, JSON.stringify(state));
    console.log(`PREVIEW_READY ${url}`);
    console.log("修改源码后页面会自动更新。按 Ctrl+C 或关闭此窗口即可停止。\n");
    if (shouldOpen) openBrowser(url);
  } catch (error) {
    await server?.close();
    await release();
    throw error;
  }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(`\n启动失败：${error.message}`); process.exit(1); });
}
