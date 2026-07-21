@echo off
title Open Sesame Trivia - Dev Server
cd /d "%~dp0"

rem كل ما يظهر هنا يُحفظ أيضاً في start-game.log
rem حتى لو أُغلقت النافذة فجأة نقدر نعرف السبب
echo Run started: %DATE% %TIME% > "%~dp0start-game.log"

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
    echo.
    pause
    exit /b 1
  )
  echo.
)

echo  [1/3] Checking for an old server still running...
call :killport
if errorlevel 1 (
  echo.
  echo  [X] Port 8081 is still busy and could not be freed.
  echo      Restart your PC, or close whatever is using port 8081.
  echo.
  pause
  exit /b 1
)
echo.

echo  [2/3] Generating a fresh QR code for your current network...
echo.
call node scripts\qr.js
if errorlevel 1 (
  echo.
  echo  [X] Could not generate the QR code.
  echo      Make sure you are connected to Wi-Fi.
  echo.
  pause
  exit /b 1
)
echo.

echo  [3/3] Opening the QR page and starting the server...
start "" "%~dp0qr.html"
echo.
echo  Scan the QR with Expo Go ^(SDK 54 build^).
echo  Phone and PC must be on the same Wi-Fi network.
echo.
echo  To stop the server: press Ctrl + C
echo.

echo Starting expo... >> "%~dp0start-game.log"
call npx.cmd expo start 2>> "%~dp0start-game.log"

echo.
echo  ==================================================
echo    Server stopped.
echo  ==================================================
echo.
echo  If something went wrong, the details are in:
echo    start-game.log
echo.
pause
exit /b 0


rem ---------------------------------------------------------------
rem  يوقف أي سيرفر قديم على المنفذ 8081 وينتظر حتى يتحرّر فعلاً.
rem  يعيد errorlevel 1 إذا بقي محجوزاً بعد كل المحاولات.
rem ---------------------------------------------------------------
:killport
set "FOUND="
for /f "tokens=5" %%P in ('netstat -ano -p TCP ^| findstr /R /C:"LISTENING" ^| findstr ":8081 "') do set "FOUND=%%P"

if not defined FOUND (
  echo        Port 8081 is free.
  exit /b 0
)

echo        Found an old server ^(PID %FOUND%^) - shutting it down...
taskkill /PID %FOUND% /T /F >nul 2>&1

rem ننتظر حتى عشر مرات، كل مرة ثانية تقريباً، إلى أن يتحرّر المنفذ
for /l %%i in (1,1,10) do (
  ping -n 2 127.0.0.1 >nul 2>&1
  set "STILL="
  for /f "tokens=5" %%Q in ('netstat -ano -p TCP ^| findstr /R /C:"LISTENING" ^| findstr ":8081 "') do set "STILL=%%Q"
  if not defined STILL (
    echo        Port released.
    exit /b 0
  )
)

exit /b 1
