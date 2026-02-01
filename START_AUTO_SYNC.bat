@echo off
REM Auto-Sync Service Launcher
REM Runs the bidirectional sync in the background

cd /d "%~dp0"

echo.
echo =====================================
echo   Payment Receipt Auto-Sync Service
echo =====================================
echo.
echo Starting auto-sync service...
echo Data will sync automatically every 30 seconds
echo.
echo Press Ctrl+C to stop the service
echo.

python auto_sync.py

pause
