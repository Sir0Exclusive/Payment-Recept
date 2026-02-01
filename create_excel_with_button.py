"""
Create Excel workbook with macro - simplified version
"""
import os
import pandas as pd

print("🔧 Creating Excel workbook with export button...")

try:
    from win32com.client import Dispatch
    
    # Start Excel
    excel = Dispatch("Excel.Application")
    excel.Visible = False
    
    # Create new workbook
    wb = excel.Workbooks.Add()
    ws = wb.ActiveSheet
    ws.Name = "Recipients"
    
    # Read data
    df = pd.read_excel('recipients_data.xlsx')
    
    # Write headers
    headers = list(df.columns)
    for col, header in enumerate(headers, 1):
        cell = ws.Cells(1, col)
        cell.Value = header
        cell.Font.Bold = True
        cell.Font.Color = 16777215  # White
        cell.Interior.Color = 3546975  # Dark blue
    
    # Write data
    for row_idx, row in enumerate(df.itertuples(index=False), 2):
        for col_idx, value in enumerate(row, 1):
            ws.Cells(row_idx, col_idx).Value = value
    
    # Set column widths
    for col in range(1, len(headers) + 1):
        ws.Columns(col).ColumnWidth = 18
    
    # Freeze panes
    ws.Range("A2").Select()
    excel.ActiveWindow.FreezePanes = True
    
    # Add "EXPORT" text button row
    button_row = len(df) + 3
    ws.Cells(button_row, 1).Value = "CLICK ME TO EXPORT →"
    export_cell = ws.Cells(button_row, 1)
    export_cell.Font.Bold = True
    export_cell.Font.Color = 16777215  # White
    export_cell.Font.Size = 12
    export_cell.Interior.Color = 65280  # Green
    
    # Get VBProject and add macro
    vb_project = wb.VBProject
    
    # Read macro code
    with open("ExportReceipt.bas", "r") as f:
        macro_code = f.read()
    
    # Add module
    code_module = vb_project.VBComponents.Add(1)
    code_module.Name = "ExportReceipt"
    code_module.CodeModule.AddFromString(macro_code)
    
    # Save as xlsm
    save_path = os.path.abspath("recipients.xlsm")
    wb.SaveAs(Filename=save_path, FileFormat=52)  # 52 = xlsm format
    
    wb.Close()
    excel.Quit()
    
    print("✅ Excel workbook created successfully!")
    print("📁 File: recipients.xlsm")
    print("✅ Macro added (ExportSelectedReceipt)")
    print("")
    print("🎯 NEXT STEPS:")
    print("  1. Open recipients.xlsm in Excel")
    print("  2. Developer Tab → Insert → Button (Form Control)")
    print("  3. Draw button over the green 'CLICK ME TO EXPORT' text")
    print("  4. Assign macro 'ExportSelectedReceipt'")
    print("  5. Click OK and save")
    print("")
    print("After that, click the button to export receipts!")
    
except ImportError:
    print("❌ pywin32 not installed. Installing...")
    os.system("pip install pywin32 -q")
    print("Please run this script again")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
