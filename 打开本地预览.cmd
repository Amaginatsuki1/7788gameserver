@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0" || exit /b 1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-preview.ps1" %*
set "previewExit=%ERRORLEVEL%"
if not "%previewExit%"=="0" (
  echo.
  echo Preview stopped with an error. See the message above.
  pause
)
popd
exit /b %previewExit%
