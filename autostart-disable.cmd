@echo off
title Open Sesame Trivia - Disable Autostart

set "LINK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\OpenSesameTrivia.lnk"

echo.
echo  ==================================================
echo    DISABLE AUTOSTART
echo  ==================================================
echo.

if exist "%LINK%" (
  del "%LINK%"
  echo  [OK] Autostart removed.
  echo       The server will no longer start on login.
) else (
  echo  Autostart was not enabled - nothing to remove.
)
echo.
pause
