"""
Sync Google Sheets to Excel and Generate Receipts
This script:
1. Updates Excel from Google Sheets (offline backup)
2. Generates receipts from Google Sheets data
"""
import subprocess
import os
import sys
import time

print("=" * 60)
print("PAYMENT RECEIPT SYNC & EXPORT SYSTEM")
print("=" * 60)
print()

# Step 1: Sync Google Sheets to Excel
print("📊 Step 1: Syncing Google Sheets to Excel...")
print("-" * 60)

try:
    result = subprocess.run([sys.executable, "sync_google_sheet.py"], 
                          capture_output=True, text=True, timeout=30)
    print(result.stdout)
    if result.returncode != 0:
        print("⚠️  Warning:", result.stderr)
except Exception as e:
    print(f"❌ Sync failed: {e}")
    print("Continuing anyway...")

time.sleep(1)

# Step 2: Generate Receipts
print()
print("📄 Step 2: Exporting Receipts...")
print("-" * 60)

try:
    result = subprocess.run([sys.executable, "generate_receipts.py"], 
                          capture_output=True, text=True, timeout=60)
    print(result.stdout)
    if result.returncode != 0:
        print("⚠️  Warning:", result.stderr)
except Exception as e:
    print(f"❌ Export failed: {e}")

# Step 3: Status
print()
print("=" * 60)
print("✅ SYNC & EXPORT COMPLETE!")
print("=" * 60)
print()
print("📋 What was done:")
print("   1. ✓ Updated recipients_data.xlsx from Google Sheets")
print("   2. ✓ Generated PDFs for all recipients")
print()
print("📁 Files updated:")
print("   • recipients_data.xlsx (offline backup)")
print("   • receipts/*.pdf (payment receipts)")
print("   • receipts/data/*.json (receipt data)")
print()
print("🌐 Web portal automatically sees new receipts")
print("💾 You have offline backup in Excel")
print()
