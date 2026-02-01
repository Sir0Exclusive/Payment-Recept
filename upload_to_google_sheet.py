"""
Upload Excel data to Google Sheets
"""
import pandas as pd
import requests
import json

# Google Apps Script URL
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec"

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
        
        data_list = df.to_dict('records')
        success = 0
        failed = 0

        for record in data_list:
            payload = {
                "receiptId": record.get("Receipt No", ""),
                "email": record.get("Email") or record.get("Recipient Email") or record.get("Name", ""),
                "Name": record.get("Name", ""),
                "Amount": record.get("Amount", ""),
                "Due Amount": record.get("Due Amount", ""),
                "Date": record.get("Date", ""),
                "Description": record.get("Description", ""),
                "Payment_Status": record.get("Payment_Status", ""),
                "Amount_Paid": record.get("Amount_Paid", "")
            }

            response = requests.post(APPS_SCRIPT_URL, json=payload, timeout=30)
            if response.status_code == 200:
                success += 1
            else:
                failed += 1
                print(f"⚠️ Failed: {payload.get('Name')} (status {response.status_code})")

        if success:
            print(f"✅ Uploaded {success} records to Google Sheets")
        if failed:
            print(f"⚠️ {failed} records failed to upload")
            
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
