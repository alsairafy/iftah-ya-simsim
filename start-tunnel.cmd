@echo off
title Open Sesame Trivia - Tunnel Mode
cd /d "%~dp0"

echo.
echo  ==================================================
echo    OPEN SESAME TRIVIA  -  TUNNEL MODE
echo  ==================================================
echo.
echo  Tunnel mode works from ANY network.
echo  Your phone does NOT need to be on the same Wi-Fi.
echo  It also survives your IP address changing.
echo.
echo  First start takes ~30 extra seconds to open the tunnel.
echo.

if not exist "node_modules\" (
  echo  [!] Dependencies missing. Installing, please wait...
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo  [X] Install failed. Check your internet connection.
    pause
    exit /b 1
  )
)

echo  Starting...
echo  Scan the QR code below with Expo Go ^(SDK 54 build^).
echo.
echo  To stop: press Ctrl + C
echo.

call npx.cmd expo start --tunnel

echo.
echo  Server stopped.
pause
