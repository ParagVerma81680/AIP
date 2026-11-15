@echo off
title AIP Backend (FastAPI - Port 8000)
cd /d "%~dp0"

echo ========================================================
echo   AIP Backend Server Manager
echo ========================================================

netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Backend is ALREADY running on http://localhost:8000
    echo Opening API documentation in your browser...
    start http://localhost:8000/api/docs
    goto end
)

echo Starting Backend on http://localhost:8000 ...
set "PY_EXE=C:\Users\parag\AppData\Local\Programs\Python\Python313\python.exe"

if exist "%PY_EXE%" (
    "%PY_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    py -3.13 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)

:end
echo.
pause
