param(
  [string]$PreviewUrl = "http://localhost:3000/"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

function Test-PreviewReady {
  try {
    $requestArgs = @{
      Uri = $PreviewUrl
      UseBasicParsing = $true
      TimeoutSec = 2
    }
    $response = Invoke-WebRequest @requestArgs
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  }
  catch {
    return $false
  }
}

Write-Host ""
Write-Host "7788 Game Servers - Local Preview" -ForegroundColor Cyan
Write-Host "Project: $projectRoot"
Write-Host ""

if (Test-PreviewReady) {
  Write-Host "Preview is already running. Opening the browser..." -ForegroundColor Green
  Start-Process $PreviewUrl
  exit 0
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm was not found. Install Node.js 22 or newer first." -ForegroundColor Red
  exit 1
}

$nodeModulesPath = Join-Path $projectRoot "node_modules"
if (-not (Test-Path -LiteralPath $nodeModulesPath)) {
  Write-Host "Installing dependencies for the first run..." -ForegroundColor Yellow
  Push-Location $projectRoot
  try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

$escapedRoot = $projectRoot.Replace("'", "''")
$serverCommand = @"
`$Host.UI.RawUI.WindowTitle = '7788 Local Preview'
Set-Location -LiteralPath '$escapedRoot'
Write-Host ''
Write-Host '7788 local preview is running.' -ForegroundColor Cyan
Write-Host 'Close this window to stop the preview server.' -ForegroundColor DarkGray
Write-Host ''
npm run dev
"@

$commandBytes = [Text.Encoding]::Unicode.GetBytes($serverCommand)
$encodedCommand = [Convert]::ToBase64String($commandBytes)
$processArgs = @{
  FilePath = "powershell.exe"
  ArgumentList = "-NoExit -NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCommand"
  WindowStyle = "Normal"
}
Start-Process @processArgs

Write-Host "Waiting for the preview server..." -ForegroundColor Yellow
$deadline = (Get-Date).AddSeconds(45)

while ((Get-Date) -lt $deadline) {
  if (Test-PreviewReady) {
    Write-Host "Preview is ready. Opening the browser." -ForegroundColor Green
    Start-Process $PreviewUrl
    exit 0
  }

  Start-Sleep -Milliseconds 750
}

Write-Host ""
Write-Host "The server window opened, but the site was not ready after 45 seconds." -ForegroundColor Red
Write-Host "Check the '7788 Local Preview' window for the detailed error."
exit 1
