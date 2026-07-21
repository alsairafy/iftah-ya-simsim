@echo off
title Open Sesame Trivia - Enable Autostart
cd /d "%~dp0"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LINK=%STARTUP%\OpenSesameTrivia.lnk"

echo.
echo  ==================================================
echo    ENABLE AUTOSTART
echo  ==================================================
echo.
echo  This adds a shortcut to your Windows Startup folder so the
echo  game server starts automatically when you log in.
echo.
echo  Shortcut location:
echo    %LINK%
echo.
echo  You can undo this any time with autostart-disable.cmd
echo.
set /p CONFIRM="  Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
  echo.
  echo  Cancelled. Nothing was changed.
  pause
  exit /b 0
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%LINK%');" ^
  "$s.TargetPath='%~dp0start-game.cmd';" ^
  "$s.WorkingDirectory='%~dp0';" ^
  "$s.Description='Open Sesame Trivia dev server';" ^
  "$s.Save()"

if exist "%LINK%" (
  echo.
  echo  [OK] Autostart enabled.
  echo       The server will start next time you log in to Windows.
) else (
  echo.
  echo  [X] Could not create the shortcut.
)
echo.
pause
