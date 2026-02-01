"""
Auto-sync service for Payment Receipt system
Continuously syncs Excel and Google Sheets bidirectionally
"""

import os
import time
import hashlib
import requests
import pandas as pd
from datetime import datetime
from pathlib import Path
import json

# Configuration
EXCEL_FILE = "recipients_data.xlsx"
GOOGLE_SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycbwd-VHVeKsNKD4lWeJuP0cXPwALnjL2b6GN0QMQrygAgG95VYRDcs-Ca_swum9OiRWfgQ/exec"
SYNC_INTERVAL = 30  # Check every 30 seconds
LOG_FILE = "sync_log.txt"

def log_sync(message):
    """Log sync activity"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] {message}"
    print(log_message)
    
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_message + "\n")

def get_file_hash(filepath):
    """Get MD5 hash of file to detect changes"""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except:
        return None

def fetch_google_sheets_data():
    """Fetch data from Google Sheets"""
    try:
        response = requests.get(GOOGLE_SHEETS_WEBHOOK, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and 'rows' in data:
                return data['rows'], data.get('headers', [])
        return None, None
    except Exception as e:
        log_sync(f"Error fetching from Google Sheets: {str(e)}")
        return None, None

def read_excel_data():
    """Read data from Excel file"""
    try:
        if not os.path.exists(EXCEL_FILE):
            return None
        df = pd.read_excel(EXCEL_FILE)
        return df.to_dict('records')
    except Exception as e:
        log_sync(f"Error reading Excel: {str(e)}")
        return None

def write_excel_data(records):
    """Write data to Excel file"""
    try:
        df = pd.DataFrame(records)
        df.to_excel(EXCEL_FILE, index=False)
        log_sync(f"✓ Synced {len(records)} records to Excel")
        return True
    except Exception as e:
        log_sync(f"Error writing Excel: {str(e)}")
        return False

def google_sheets_to_dict(headers, rows):
    """Convert Google Sheets format to dict"""
    if not headers or not rows:
        return []
    
    records = []
    for row in rows:
        record = {}
        for i, header in enumerate(headers):
            record[header] = row[i] if i < len(row) else None
        records.append(record)
    return records

def excel_to_google_sheets(records):
    """Send Excel data to Google Sheets"""
    if not records:
        return False
    
    try:
        for record in records:
            payload = {
                "email": record.get("Name", ""),
                "receiptId": record.get("Receipt No", "")
            }
            response = requests.post(GOOGLE_SHEETS_WEBHOOK, json=payload, timeout=10)
            if response.status_code != 200:
                log_sync(f"Warning: Failed to sync {payload['email']} (status {response.status_code})")
        
        log_sync(f"✓ Synced {len(records)} records to Google Sheets")
        return True
    except Exception as e:
        log_sync(f"Error syncing to Google Sheets: {str(e)}")
        return False

def merge_data(excel_data, sheets_data):
    """Merge Excel and Google Sheets data intelligently"""
    if not excel_data:
        return sheets_data
    if not sheets_data:
        return excel_data
    
    # Create a map of Excel data by Name
    excel_map = {record.get("Name"): record for record in excel_data}
    sheets_map = {record.get("Name"): record for record in sheets_data}
    
    # Merge: prefer newer timestamp if available
    merged = {}
    all_names = set(excel_map.keys()) | set(sheets_map.keys())
    
    for name in all_names:
        if name in excel_map and name in sheets_map:
            # Both have it - take the one with more recent timestamp
            excel_time = excel_map[name].get("Updated", 0)
            sheets_time = sheets_map[name].get("Updated", 0)
            merged[name] = excel_map[name] if excel_time >= sheets_time else sheets_map[name]
        elif name in excel_map:
            merged[name] = excel_map[name]
        else:
            merged[name] = sheets_map[name]
    
    return list(merged.values())

def sync_cycle():
    """Perform one sync cycle"""
    try:
        # Read Excel data
        excel_data = read_excel_data()
        if excel_data is None:
            return
        
        # Fetch Google Sheets data
        sheets_rows, sheets_headers = fetch_google_sheets_data()
        sheets_data = google_sheets_to_dict(sheets_headers, sheets_rows)
        
        # Check if they're different
        if sheets_data:
            excel_str = json.dumps(excel_data, sort_keys=True, default=str)
            sheets_str = json.dumps(sheets_data, sort_keys=True, default=str)
            
            if excel_str != sheets_str:
                log_sync(f"⚠ Data mismatch detected - syncing...")
                
                # Merge and write back
                merged = merge_data(excel_data, sheets_data)
                write_excel_data(merged)
                excel_to_google_sheets(merged)
        else:
            # Google Sheets is empty or unreachable, push Excel data
            log_sync(f"Pushing Excel data to Google Sheets...")
            excel_to_google_sheets(excel_data)
    
    except Exception as e:
        log_sync(f"Error in sync cycle: {str(e)}")

def main():
    """Main service loop"""
    log_sync("=" * 60)
    log_sync("Auto-Sync Service Started")
    log_sync(f"Sync interval: {SYNC_INTERVAL} seconds")
    log_sync(f"Excel file: {EXCEL_FILE}")
    log_sync("=" * 60)
    
    last_excel_hash = None
    
    while True:
        try:
            # Check if Excel file has changed
            if os.path.exists(EXCEL_FILE):
                current_hash = get_file_hash(EXCEL_FILE)
                
                if current_hash != last_excel_hash:
                    log_sync("📝 Excel file changed - running sync...")
                    sync_cycle()
                    last_excel_hash = current_hash
            
            time.sleep(SYNC_INTERVAL)
        
        except KeyboardInterrupt:
            log_sync("Auto-Sync Service Stopped (user interrupt)")
            break
        except Exception as e:
            log_sync(f"Fatal error: {str(e)}")
            time.sleep(5)

if __name__ == "__main__":
    main()
