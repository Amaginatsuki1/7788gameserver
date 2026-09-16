import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import test from "node:test";
import { availablePort, cacheMatches, dependencyFingerprint, supportsNode } from "../scripts/preview.mjs";

test("preview checks its actual minimum Node version", () => {
  assert.equal(supportsNode("22.12.0"), false);
  assert.equal(supportsNode("20.19.0"), false);
  assert.equal(supportsNode("22.13.0"), true);
  assert.equal(supportsNode("24.16.0"), true);
});
const lock = { lockfileVersion: 3, packages: { "node_modules/example": { version: "1.0.0" } } };
const manifest = { name: "example", dependencies: { example: "1.0.0" }, scripts: { preview: "node preview.mjs" } };
const original = [JSON.stringify(lock), JSON.stringify(manifest), "win32", "x64", "24.16.0"];
test("dependency or runtime changes invalidate the preview cache", () => {
  const value = dependencyFingerprint(...original);
  for (const [index, replacement] of [[0, JSON.stringify({ ...lock, packages: {} })], [1, JSON.stringify({ ...manifest, dependencies: { example: "2.0.0" } })], [2,"linux"], [3,"arm64"], [4,"26.0.0"]]) {
    const modified = [...original]; modified[index] = replacement;
    assert.notEqual(dependencyFingerprint(...modified), value);
  }
  const patchVersion = [...original]; patchVersion[4] = "24.17.0";
  assert.equal(dependencyFingerprint(...patchVersion), value);
});
test("formatting, descriptions and preview commands do not reinstall dependencies", () => {
  const cosmetic = { scripts: { preview: "node new-preview.mjs" }, description: "Updated docs", dependencies: manifest.dependencies, name: "renamed" };
  assert.equal(dependencyFingerprint(JSON.stringify(lock, null, 2).replaceAll("\n", "\r\n"), JSON.stringify(cosmetic), ...original.slice(2)), dependencyFingerprint(...original));
  assert.notEqual(dependencyFingerprint(original[0], JSON.stringify({ ...manifest, scripts: { prepare: "node prepare.mjs" } }), ...original.slice(2)), dependencyFingerprint(...original));
});
test("the previous valid cache marker migrates without forcing an installation", () => {
  const fingerprint = createHash("sha256").update([...original.slice(0, 4), "24"].join("\0")).digest("hex");
  assert.equal(cacheMatches({ fingerprint }, ...original), true);
  assert.equal(cacheMatches({ fingerprint }, original[0], original[1], "linux", "x64", "24.16.0"), false);
  assert.equal(cacheMatches(null, ...original), false);
});
test("preview skips another program's occupied port without treating it as this project", async () => {
  const other = net.createServer();
  other.listen(0, "127.0.0.1");
  await once(other, "listening");
  const port = other.address().port;
  try {
    await assert.rejects(availablePort(port, 1), /端口/);
    if (port < 65535) assert.equal(await availablePort(port, 2), port + 1);
    assert.equal(other.listening, true);
  } finally { await new Promise(resolve => other.close(resolve)); }
});
