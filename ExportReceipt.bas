Attribute VB_Name = "ExportReceipt"
Sub ExportSelectedReceipt()
    Dim row As Integer
    row = ActiveCell.Row
    Dim name As String
    name = Cells(row, 1).Value
    Dim amount As String
    amount = Cells(row, 2).Value
    Dim dueAmount As String
    dueAmount = Cells(row, 3).Value
    Dim dateVal As String
    dateVal = Cells(row, 4).Value
    Dim desc As String
    desc = Cells(row, 5).Value
    Dim receiptNo As String
    receiptNo = Cells(row, 6).Value

    Dim cmd As String
    cmd = "python ""d:\Payment recept\generate_receipts.py"" --name """ & name & """ --amount """ & amount & """ --due """ & dueAmount & """ --date """ & dateVal & """ --desc """ & desc & """ --receipt """ & receiptNo & """"
    Shell cmd, vbNormalFocus
End Sub
