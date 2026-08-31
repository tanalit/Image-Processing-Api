@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Image Processing Backend - Start Server
echo ========================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Virtual environment was not found.
    echo Please run setup_backend.bat first.
    echo.
    pause
    exit /b 1
)

if not exist "app\main.py" (
    echo ERROR: app\main.py was not found.
    echo Please run this script from the backend project directory.
    echo.
    pause
    exit /b 1
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 (
    echo ERROR: Failed to activate .venv.
    pause
    exit /b 1
)

echo Starting FastAPI backend on 0.0.0.0:8000 ...
echo Local test URL: http://127.0.0.1:8000/health
echo Swagger URL:    http://127.0.0.1:8000/docs
echo.
echo Keep this window open while using the backend.
echo Press Ctrl+C to stop the server.
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

if errorlevel 1 (
    echo.
    echo ERROR: Backend stopped with an error.
    echo If port 8000 is already in use, close the other app or change only for debugging.
    echo The shared frontend contract expects port 8000.
    pause
    exit /b 1
)
