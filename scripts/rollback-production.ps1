param(
  [Parameter(Mandatory = $true)]
  [string]$HostName,
  [string]$UserName = "root",
  [string]$IdentityFile = (
    Join-Path ([Environment]::GetFolderPath("UserProfile")) ".ssh\7788_web_ed25519"
  ),
  [string]$KnownHostsFile = (
    Join-Path ([Environment]::GetFolderPath("UserProfile")) ".ssh\7788_web_known_hosts"
  )
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $IdentityFile)) {
  throw "SSH identity file not found: $IdentityFile"
}

if (-not (Test-Path -LiteralPath $KnownHostsFile)) {
  throw "SSH known-hosts file not found: $KnownHostsFile"
}

$remoteTarget = "$UserName@$HostName"
$sshOptions = @(
  "-i", $IdentityFile,
  "-o", "KexAlgorithms=curve25519-sha256",
  "-o", "BatchMode=yes",
  "-o", "StrictHostKeyChecking=yes",
  "-o", "UserKnownHostsFile=$KnownHostsFile"
)

$remoteScript = @'
set -eu
current="$(readlink -f /srv/7788/current || true)"
previous="$(
  find /srv/7788/releases -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
    sort -r |
    while IFS= read -r release; do
      candidate="/srv/7788/releases/$release"
      if [ "$candidate" != "$current" ]; then
        printf '%s\n' "$candidate"
        break
      fi
    done
)"
if [ -z "$previous" ]; then
  echo "No previous release is available." >&2
  exit 1
fi
ln -sfn "$previous" /srv/7788/current.next
mv -Tf /srv/7788/current.next /srv/7788/current
nginx -t
test -f /srv/7788/current/index.html
curl -fsS --max-time 10 \
  -H 'Host: 7788oio.icu' http://127.0.0.1/ >/dev/null
curl -fsS --max-time 10 \
  --resolve 7788oio.icu:443:127.0.0.1 \
  https://7788oio.icu/api/status | grep -q '"schemaVersion":1'
printf 'Rolled back to %s\n' "$(basename "$previous")"
'@

& ssh @sshOptions $remoteTarget $remoteScript
if ($LASTEXITCODE -ne 0) {
  throw "Rollback failed."
}
