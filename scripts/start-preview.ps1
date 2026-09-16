param(
  [switch]$UseBundledNode,
  [switch]$NoBrowser,
  [switch]$PrepareOnly
)
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
try {
  Set-Location -LiteralPath $projectRoot
  $nodePath = $null
  $downloaded = $false
  $systemNode = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $UseBundledNode -and $systemNode) {
    & $systemNode.Source -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a>22||(a===22&&b>=13))&&process.arch==='x64'?0:1)"
    if ($LASTEXITCODE -eq 0 -and (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { $nodePath = $systemNode.Source }
  }
  if (-not $nodePath) {
    $version = (Get-Content -LiteralPath (Join-Path $projectRoot '.node-version') -Raw).Trim()
    if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid bundled Node version.' }
    $machineArch = $env:PROCESSOR_ARCHITECTURE
    if ($env:PROCESSOR_ARCHITEW6432) { $machineArch = $env:PROCESSOR_ARCHITEW6432 }
    $arch = switch ($machineArch) { 'AMD64' { 'x64' }; 'ARM64' { 'x64' }; default { throw 'Preview requires 64-bit Windows (x64 or ARM64).' } }
    $name = "node-v$version-win-$arch"
    $cache = Join-Path $projectRoot '.preview'
    $runtimeRoot = Join-Path $cache 'runtime'
    $nodePath = Join-Path $runtimeRoot "$name/node.exe"
    $ready = Join-Path $runtimeRoot "$name/.ready"
    if (-not (Test-Path -LiteralPath $ready) -or -not (Test-Path -LiteralPath $nodePath)) {
      New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
      $bootstrapLock = [IO.File]::Open((Join-Path $cache 'bootstrap.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
      try {
        $archiveName = "$name.zip"
        $checksumLine = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'node-SHASUMS256.txt') | Where-Object { $_ -match ('\s+' + [regex]::Escape($archiveName) + '$') }
        if (-not $checksumLine) { throw 'No checksum for this platform.' }
        $expected = ($checksumLine -split '\s+')[0]
        $archive = Join-Path $cache "$archiveName.download"
        Write-Host "[1/3] 下载免安装 Node.js $version（仅首次需要）..." -ForegroundColor Cyan
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'Continue'
        $downloadUrl = "https://nodejs.org/dist/v$version/$archiveName"
        if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
          & curl.exe --fail --location --progress-bar --retry 2 --connect-timeout 15 --max-time 180 $downloadUrl -o $archive
          if ($LASTEXITCODE -ne 0) { throw 'Node.js download failed; please check the connection and retry.' }
        } else {
          Invoke-WebRequest -UseBasicParsing -Uri $downloadUrl -OutFile $archive -TimeoutSec 180
        }
        Write-Host "[1/3] 下载完成，正在校验并解压..." -ForegroundColor Cyan
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Node.js checksum mismatch. Download was not executed; retry the launcher.' }
        # Expand-Archive requires a .zip suffix.
        $zipPath = Join-Path $cache $archiveName
        Move-Item -LiteralPath $archive -Destination $zipPath -Force
        Expand-Archive -LiteralPath $zipPath -DestinationPath $runtimeRoot -Force
        & $nodePath --version
        if ($LASTEXITCODE -ne 0) { throw 'This Windows version cannot run the bundled Node.js.' }
        Set-Content -LiteralPath $ready -Value $expected -Encoding ascii
        Remove-Item -LiteralPath $zipPath -Force
        $downloaded = $true
      } finally { $bootstrapLock.Dispose() }
    }
  }
  if (-not $downloaded) { Write-Host "[1/3] 使用已就绪的 Node.js，无需下载。" -ForegroundColor Green }
  $env:PATH = (Split-Path -Parent $nodePath) + [IO.Path]::PathSeparator + $env:PATH
  $previewArgs = @((Join-Path $PSScriptRoot 'preview.mjs'))
  if ($NoBrowser) { $previewArgs += '--no-open' }
  if ($PrepareOnly) { $previewArgs += '--prepare-only' }
  & $nodePath @previewArgs
  exit $LASTEXITCODE
} catch {
  Write-Host "`nPreview could not start: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Extract the entire ZIP to a writable folder, check your connection to nodejs.org / registry.npmjs.org, then retry.'
  Write-Host 'If another launcher is preparing files, wait for that window to finish.'
  exit 1
}
