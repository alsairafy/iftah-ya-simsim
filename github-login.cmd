@echo off
title GitHub Login
cd /d "%~dp0"

echo.
echo  ==================================================
echo    GITHUB LOGIN
echo  ==================================================
echo.
echo  Answer the questions like this:
echo.
echo    What account?          -^> GitHub.com
echo    Preferred protocol?    -^> HTTPS
echo    Authenticate Git?      -^> Yes
echo    How to authenticate?   -^> Login with a web browser
echo.
echo  Then copy the 8-character code it shows you,
echo  press Enter, and paste the code in the browser.
echo.
echo  Use the ARROW KEYS to pick an answer, then press ENTER.
echo.
pause
echo.

gh auth login

echo.
echo  ==================================================
echo    RESULT
echo  ==================================================
echo.
gh auth status
echo.
pause
