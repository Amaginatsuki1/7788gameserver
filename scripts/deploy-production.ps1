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

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$commit = (git -C $projectRoot rev-parse --short HEAD).Trim()
if (-not $commit) {
  throw "Could not determine the current Git commit."
}

$releaseName = "$releaseStamp-$commit"
$archivePath = Join-Path ([IO.Path]::GetTempPath()) "7788-web-$releaseName.tar.gz"
$remoteArchive = "/tmp/7788-web-$releaseName.tar.gz"
$remoteTarget = "$UserName@$HostName"
$sshOptions = @(
  "-i", $IdentityFile,
  "-o", "KexAlgorithms=curve25519-sha256",
  "-o", "BatchMode=yes",
  "-o", "StrictHostKeyChecking=yes",
  "-o", "UserKnownHostsFile=$KnownHostsFile"
)

Push-Location $projectRoot
try {
  npm test
  if ($LASTEXITCODE -ne 0) {
    throw "Website tests failed."
  }

  npm run build:static
  if ($LASTEXITCODE -ne 0) {
    throw "Static production build failed."
  }

  tar -czf $archivePath -C (Join-Path $projectRoot "out") .
  if ($LASTEXITCODE -ne 0) {
    throw "Could not package the static build."
  }

  & scp @sshOptions $archivePath "${remoteTarget}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) {
    throw "Could not upload the production package."
  }

  $remoteScript = @"
set -eu
release="/srv/7788/releases/$releaseName"
previous="`$(readlink -f /srv/7788/current 2>/dev/null || true)"
mkdir -p "`$release"
tar --warning=no-timestamp -xzf "$remoteArchive" -C "`$release"
ln -sfn "`$release" /srv/7788/current.next
mv -Tf /srv/7788/current.next /srv/7788/current
rm -f "$remoteArchive"

if ! nginx -t ||
   ! test -f /srv/7788/current/index.html ||
   ! curl -fsS --max-time 10 \
       -H 'Host: 7788oio.icu' http://127.0.0.1/ >/dev/null ||
   ! curl -fsS --max-time 10 \
       --resolve 7788oio.icu:443:127.0.0.1 \
       https://7788oio.icu/api/status | grep -q '"schemaVersion":1'
then
  if [ -n "`$previous" ] && [ -d "`$previous" ]; then
    ln -sfn "`$previous" /srv/7788/current.next
    mv -Tf /srv/7788/current.next /srv/7788/current
  fi
  echo "Release health check failed; restored the previous release." >&2
  exit 1
fi

find /srv/7788/releases -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
  sort -r |
  tail -n +6 |
  while IFS= read -r old_release; do
    rm -rf -- "/srv/7788/releases/`$old_release"
  done
"@

  & ssh @sshOptions $remoteTarget $remoteScript
  if ($LASTEXITCODE -ne 0) {
    throw "Could not activate the uploaded release."
  }

  Write-Host "Activated release $releaseName"
}
finally {
  Pop-Location
  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
}
