@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-preview.ps1"

if errorlevel 1 (
  echo.
  echo Failed to start the local preview. See the message above.
  pause
)

endlocal
