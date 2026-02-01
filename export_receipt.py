"""
Quick Receipt Exporter - Interactive menu to export receipts
"""
import pandas as pd
import subprocess
import os
import sys

def main():
    print("\n" + "="*60)
    print("📄 PAYMENT RECEIPT EXPORTER")
    print("="*60 + "\n")
    
    try:
        # Read recipients data
        df = pd.read_excel('recipients_data.xlsx')
        
        while True:
            print("\nRecipients available:\n")
            for idx, row in df.iterrows():
                print(f"  {idx+1}. {row['Name']:15} | Amount: {row['Amount']:10} | Receipt: {row['Receipt No']}")
            
            print("\n  0. Exit")
            print("-" * 60)
            
            choice = input("\n👉 Select recipient number to export: ").strip()
            
            if choice == "0":
                print("Goodbye!")
                break
            
            try:
                idx = int(choice) - 1
                if idx < 0 or idx >= len(df):
                    print("❌ Invalid selection!")
                    continue
                
                row = df.iloc[idx]
                print(f"\n⏳ Exporting receipt for {row['Name']}...")
                
                # Build command
                cmd = [
                    'python', 'generate_receipts.py',
                    '--name', str(row['Name']),
                    '--amount', str(row['Amount']),
                    '--due', str(row['Due Amount']),
                    '--date', str(row['Date']),
                    '--desc', str(row['Description']),
                    '--receipt', str(row['Receipt No'])
                ]
                
                # Run export
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"✅ Receipt exported successfully!")
                    print(f"📁 Location: receipts/{row['Name']}_receipt.pdf")
                else:
                    print(f"❌ Export failed: {result.stderr}")
            
            except ValueError:
                print("❌ Please enter a valid number!")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    except FileNotFoundError:
        print("❌ recipients_data.xlsx not found!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
