@echo off
title AIP Full-Stack Launcher
cd /d "%~dp0"

echo ========================================================
echo   AIP Full-Stack Launcher (Localhost)
echo ========================================================

set "PY_EXE=C:\Users\parag\AppData\Local\Programs\Python\Python313\python.exe"

netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Backend is already running on http://localhost:8000
) else (
    echo Starting Backend on http://localhost:8000 ...
    if exist "%PY_EXE%" (
        start "AIP Backend (Port 8000)" cmd /k "cd /d "%~dp0" && "%PY_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
    ) else (
        start "AIP Backend (Port 8000)" cmd /k "cd /d "%~dp0" && py -3.13 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
    )
)

netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend is already running on http://localhost:5173
) else (
    echo Starting Frontend on http://localhost:5173 ...
    start "AIP Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
)

echo.
echo Waiting 2 seconds then opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo   Localhost Servers Active:
echo   - Storefront UI: http://localhost:5173
echo   - Backend Docs:  http://localhost:8000/api/docs
echo ========================================================
echo.
pause
