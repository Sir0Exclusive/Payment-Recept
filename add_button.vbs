' VBScript to add macro button to Excel workbook
' Save as: add_button.vbs and run it

Dim Excel, Workbook, Sheet, Button, objFSO, strMacroCode, intRow
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get current directory
Dim strCurrentDir
strCurrentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

On Error Resume Next

' Open Excel
Set Excel = CreateObject("Excel.Application")
If Err.Number <> 0 Then
    MsgBox "Error: Excel not installed or not accessible", vbCritical
    WScript.Quit 1
End If

Excel.Visible = False
Excel.DisplayAlerts = False

' Open workbook
Set Workbook = Excel.Workbooks.Open(strCurrentDir & "\recipients.xlsm")
If Err.Number <> 0 Then
    MsgBox "Error: Could not open recipients.xlsm", vbCritical
    Excel.Quit
    WScript.Quit 1
End If

Set Sheet = Workbook.ActiveSheet

' Read macro code from file
Dim fFile, strMacroFile
strMacroFile = strCurrentDir & "\ExportReceipt.bas"
Set fFile = objFSO.OpenTextFile(strMacroFile, 1)
strMacroCode = fFile.ReadAll()
fFile.Close()

' Add macro module
On Error Resume Next
Dim VBComponent
Set VBComponent = Workbook.VBProject.VBComponents.Add(1)
VBComponent.Name = "ExportReceipt"
VBComponent.CodeModule.AddFromString(strMacroCode)

If Err.Number <> 0 Then
    MsgBox "Warning: Could not add macro (Excel security may be blocking). " & vbCrLf & _
           "You may need to enable macros in Excel options first." & vbCrLf & vbCrLf & _
           "But the workbook structure is ready. You can still add the button manually.", vbExclamation
End If

' Save workbook
Workbook.Save()

' Close
Workbook.Close
Excel.Quit

MsgBox "Done! Open recipients.xlsm and add button manually." & vbCrLf & _
       "Developer tab -> Insert -> Button (Form Control) -> Assign ExportSelectedReceipt macro", vbInformation

Set Excel = Nothing
Set Workbook = Nothing
