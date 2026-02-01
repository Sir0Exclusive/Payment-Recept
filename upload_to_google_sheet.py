"""
Upload Excel data to Google Sheets
"""
import pandas as pd
import requests
import json

# Google Apps Script URL
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwd-VHVeKsNKD4lWeJuP0cXPwALnjL2b6GN0QMQrygAgG95VYRDcs-Ca_swum9OiRWfgQ/exec"

def upload_to_google_sheet():
    """Read Excel and upload data to Google Sheets"""
    print("📤 Reading Excel data...")
    
    try:
        df = pd.read_excel('recipients_data.xlsx')
        
        print(f"✓ Found {len(df)} payment records")
        print()
        print("Recipients:")
        for idx, row in df.iterrows():
            print(f"  {idx+1}. {row['Name']} - {row['Amount']} (Status: {'PAID' if float(str(row['Due Amount']).replace('¥','')) == 0 else 'DUE'})")
        
        print()
        print("📤 Uploading to Google Sheets...")
        
        # Convert DataFrame to list of dicts
        data_list = df.to_dict('records')
        
        # Send to Google Sheets via Apps Script
        payload = {
            'action': 'updateSheet',
            'data': data_list
        }
        
        response = requests.post(APPS_SCRIPT_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            print("✅ Data uploaded to Google Sheets successfully!")
            print()
            print("⏳ Google Sheets is being updated...")
            print("   Check your Google Sheet in 1-2 minutes")
        else:
            print(f"⚠️ Upload status: {response.status_code}")
            print("   Data may still have been uploaded")
            print()
            print("Manual method:")
            print("1. Copy data from: recipients_data.xlsx")
            print("2. Paste into your Google Sheet")
            print("3. The website will show it automatically")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Manual method:")
        print("1. Open recipients_data.xlsx")
        print("2. Copy all data (Ctrl+A → Ctrl+C)")
        print("3. Go to your Google Sheet")
        print("4. Paste (Ctrl+V)")
        print("5. Website will show it instantly!")

if __name__ == "__main__":
    print("=" * 60)
    print("UPLOAD EXCEL DATA TO GOOGLE SHEETS")
    print("=" * 60)
    print()
    
    upload_to_google_sheet()
    
    print()
    print("=" * 60)
