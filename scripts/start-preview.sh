#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"
node_bin=""
if [ "${PREVIEW_USE_BUNDLED_NODE:-0}" != "1" ] && command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  if node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"; then node_bin=$(command -v node); fi
fi
if [ -z "$node_bin" ]; then
  version=$(cat .node-version | tr -d '\r\n')
  case "$version" in *[!0-9.]*|'') echo 'Invalid Node version.' >&2; exit 1;; esac
  case $(uname -s) in Darwin) platform=darwin;; Linux) platform=linux;; *) echo 'Use the .cmd launcher on Windows.' >&2; exit 1;; esac
  case $(uname -m) in x86_64|amd64) arch=x64;; arm64|aarch64) arch=arm64;; *) echo 'Preview requires x64 or ARM64.' >&2; exit 1;; esac
  name="node-v$version-$platform-$arch"
  runtime="$root/.preview/runtime/$name"
  node_bin="$runtime/bin/node"
  if [ ! -f "$runtime/.ready" ] || [ ! -x "$node_bin" ]; then
    command -v curl >/dev/null 2>&1 || { echo 'Install curl, or install Node.js 24 LTS with npm first.' >&2; exit 1; }
    archive_name="$name.tar.gz"
    expected=$(awk -v file="$archive_name" '$2 == file {print $1}' scripts/node-SHASUMS256.txt)
    [ -n "$expected" ] || { echo 'No checksum for this platform.' >&2; exit 1; }
    mkdir -p .preview/runtime
    temp=$(mktemp -d "$root/.preview/download.XXXXXX")
    trap 'rm -f "$temp/archive.tar.gz"; rmdir "$temp" 2>/dev/null || true' EXIT HUP INT TERM
    printf 'Preparing portable Node.js %s from nodejs.org (no sudo needed)...\n' "$version"
    curl --fail --location --progress-bar --retry 2 --connect-timeout 15 --max-time 180 "https://nodejs.org/dist/v$version/$archive_name" -o "$temp/archive.tar.gz"
    if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$temp/archive.tar.gz" | awk '{print $1}');
    else actual=$(shasum -a 256 "$temp/archive.tar.gz" | awk '{print $1}'); fi
    [ "$actual" = "$expected" ] || { echo 'Node.js checksum mismatch; download was not executed.' >&2; exit 1; }
    tar -xzf "$temp/archive.tar.gz" -C .preview/runtime
    "$node_bin" --version
    printf '%s\n' "$expected" > "$runtime/.ready"
    rm -f "$temp/archive.tar.gz"
    rmdir "$temp"
    trap - EXIT HUP INT TERM
  fi
fi
printf '[1/3] Node.js is ready; using the local runtime.\n'
PATH="$(dirname "$node_bin"):$PATH"
export PATH
exec "$node_bin" "$root/scripts/preview.mjs" "$@"
