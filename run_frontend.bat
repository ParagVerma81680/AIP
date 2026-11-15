@echo off
title AIP Frontend (Vite - Port 5173)
cd /d "%~dp0frontend"

echo ========================================================
echo   AIP Frontend Server Manager
echo ========================================================

netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend is ALREADY running on http://localhost:5173
    echo Opening SwiftMart in your browser...
    start http://localhost:5173
    goto end
)

echo Starting Frontend on http://localhost:5173 ...
call npm run dev

:end
echo.
pause
