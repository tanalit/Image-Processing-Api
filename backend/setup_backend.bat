@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Image Processing Backend - First Setup
echo ========================================
echo.

set "PYTHON_CMD="

py -3 --version >nul 2>&1
if %errorlevel%==0 (
    set "PYTHON_CMD=py -3"
) else (
    python --version >nul 2>&1
    if %errorlevel%==0 (
        set "PYTHON_CMD=python"
    )
)

if "%PYTHON_CMD%"=="" (
    echo ERROR: Python was not found.
    echo Please install Python 3.10 or newer from https://www.python.org/downloads/
    echo During installation, tick "Add python.exe to PATH".
    echo.
    pause
    exit /b 1
)

echo Using Python:
%PYTHON_CMD% --version
if errorlevel 1 (
    echo ERROR: Python is installed but cannot be executed.
    pause
    exit /b 1
)

if not exist "requirements.txt" (
    echo ERROR: requirements.txt was not found.
    echo Please run this script from the backend project directory.
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment in .venv ...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo Virtual environment already exists: .venv
)

echo Activating virtual environment ...
call ".venv\Scripts\activate.bat"
if errorlevel 1 (
    echo ERROR: Failed to activate .venv.
    pause
    exit /b 1
)

echo Upgrading pip ...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo ERROR: Failed to upgrade pip.
    pause
    exit /b 1
)

echo Installing dependencies from requirements.txt ...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully.
echo Next step: run run_backend.bat
echo ========================================
echo.
pause
