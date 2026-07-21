@echo off
title Open Sesame Trivia - QR Code
cd /d "%~dp0"

call npm.cmd run qr

echo.
echo  Opening the QR page in your browser...
start "" "%~dp0qr.html"
echo.
pause
