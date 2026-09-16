param(
  [Parameter(Mandatory = $true)]
  [string]$HostName,
  [string]$UserName = "root",
  [ValidatePattern("^[A-Za-z0-9_-]+$")]
  [string]$ReleaseName,
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

$remoteScript = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot "../deploy/rollback-release.sh")
$remoteScript | & ssh @sshOptions $remoteTarget "sh -s -- '$ReleaseName'"
if ($LASTEXITCODE -ne 0) {
  throw "Rollback failed."
}
