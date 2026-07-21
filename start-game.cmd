@echo off
title Open Sesame Trivia - Dev Server
cd /d "%~dp0"

echo.
echo  ==================================================
echo    OPEN SESAME TRIVIA   ^|   Iftah Ya Simsim
echo  ==================================================
echo.

if not exist "node_modules\" (
  echo  [!] Dependencies missing. Installing, please wait...
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo  [X] Install failed. Check your internet connection.
    pause
    exit /b 1
  )
  echo.
)

echo  [1/2] Generating a fresh QR code for your current network...
echo.
call node scripts\qr.js
echo.

echo  [2/2] Opening the QR page and starting the server...
start "" "%~dp0qr.html"
echo.
echo  Scan the QR with Expo Go ^(SDK 54 build^).
echo  Phone and PC must be on the same Wi-Fi network.
echo.
echo  To stop the server: press Ctrl + C
echo.

call npx.cmd expo start

echo.
echo  Server stopped.
pause
