import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const paths = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean))];
const forbidden = /(^|\/)(?:AGENTS\.md|PROJECT_HANDOFF\.md|password\.txt|hk_known_hosts_current|\.openai|\.codex|\.agents|local-only|outputs|node_modules|\.preview)(?:$|\/)|(?:\.pem|\.key|\.p12|\.pfx|\.local)$|^docs\/(?:HISTORY\.md|MONITORING_RUNBOOK\.md|archive\/)|(^|\/)\.env(?!\.example$)/i;
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
  ["service token", /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,})/],
  ["private local path", /[A-Z]:[\\/](?:Users|test)[\\/]|\/Users\//],
];
const failures = [];
for (const name of paths) {
  let bytes;
  try { bytes = await readFile(path.join(root, name)); } catch (error) { if (error.code === "ENOENT") continue; throw error; }
  if (forbidden.test(name)) failures.push(`${name}: private path`);
  if (!bytes.includes(0)) {
    const text = bytes.toString("utf8");
    for (const [category, pattern] of patterns) if (pattern.test(text)) failures.push(`${name}: ${category}`);
    if (name === "monitoring-backend/game-status-ssh-config" && !/^\s*HostName game-host\.example\.com$/m.test(text)) failures.push(`${name}: replace live SSH host with the example`);
  }
  const extension = path.extname(name).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(extension)) {
    const format = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? ".png" :
      bytes[0] === 255 && bytes[1] === 216 ? ".jpg" :
      bytes.subarray(0,3).toString() === "GIF" ? ".gif" :
      bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP" ? ".webp" : null;
    if (format !== (extension === ".jpeg" ? ".jpg" : extension)) failures.push(`${name}: image format does not match extension`);
  }
}
async function inspectPublic(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) { failures.push(`${path.relative(root,file)}: public symlink`); continue; }
    if (entry.isDirectory()) { await inspectPublic(file); continue; }
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    if (!paths.includes(relative)) failures.push(`${relative}: ignored local file would be published`);
  }
}
await inspectPublic(path.join(root, "public"));
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Public source checks passed (${paths.length} candidate paths).`);
