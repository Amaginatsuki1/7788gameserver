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

if (git -C $projectRoot status --porcelain --untracked-files=normal) {
  throw "Commit the intended source changes before deploying a reproducible release."
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
  npm run check:public
  if ($LASTEXITCODE -ne 0) {
    throw "Public source checks failed."
  }

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

  $remoteScript = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot "../deploy/activate-release.sh")
  $remoteScript | & ssh @sshOptions $remoteTarget "sh -s -- '$remoteArchive' '$releaseName'"
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
