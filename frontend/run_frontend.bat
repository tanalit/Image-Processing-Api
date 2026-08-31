@echo off
setlocal

cd /d "%~dp0"

echo Starting Image Processing Frontend on http://localhost:5500
echo Project folder: %CD%
echo.

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py -m http.server 5500
    goto :end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python -m http.server 5500
    goto :end
)

echo Python was not found on this computer.
echo Please install Python for Windows, then run this file again.
echo Download: https://www.python.org/downloads/windows/
echo.
pause

:end
endlocal
