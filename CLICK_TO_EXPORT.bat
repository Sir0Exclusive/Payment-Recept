@echo off
REM Quick Export Receipt - Click on a row and run this batch file
REM It will export the selected recipient's receipt

cd /d "%~dp0"

cls
echo.
echo ============================================================
echo          PAYMENT RECEIPT EXPORTER
echo ============================================================
echo.

python export_receipt.py

pause
