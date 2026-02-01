@echo off
REM Sync Google Sheets to Excel and Generate Receipts
REM This updates your local Excel with data from Google Sheets
REM Then generates all receipts

cd /d "%~dp0"

cls
echo.
echo ============================================================
echo          SYNC GOOGLE SHEETS AND GENERATE RECEIPTS
echo ============================================================
echo.
echo This will:
echo   1. Update recipients_data.xlsx from Google Sheets
echo   2. Generate PDF receipts for all recipients
echo   3. Keep web portal in sync
echo.

python sync_and_export.py

echo.
echo ============================================================
echo Done! Check receipts/ folder for updated PDFs
echo ============================================================
echo.

pause
