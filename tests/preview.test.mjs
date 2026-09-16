import assert from "node:assert/strict";
import { once } from "node:events";
import net from "node:net";
import test from "node:test";
import { availablePort, dependencyFingerprint, supportsNode } from "../scripts/preview.mjs";

test("preview checks its actual minimum Node version", () => {
  assert.equal(supportsNode("22.12.0"), false);
  assert.equal(supportsNode("20.19.0"), false);
  assert.equal(supportsNode("22.13.0"), true);
  assert.equal(supportsNode("24.16.0"), true);
});
test("preview refreshes dependencies after a lockfile, package, platform, architecture or Node major change", () => {
  const original = ["lock", "package", "win32", "x64", "24.16.0"];
  const value = dependencyFingerprint(...original);
  for (const [index, replacement] of [[0,"new lock"],[1,"new package"],[2,"linux"],[3,"arm64"],[4,"26.0.0"]]) {
    const modified = [...original]; modified[index] = replacement;
    assert.notEqual(dependencyFingerprint(...modified), value);
  }
  assert.equal(dependencyFingerprint("lock", "package", "win32", "x64", "24.17.0"), value);
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
