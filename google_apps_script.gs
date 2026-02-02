// Google Apps Script for web-based payment receipt system
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

const SPREADSHEET_ID = '1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M';
const SHEET_NAME = 'Receipts';
const HEADERS = ['Receipt No', 'Name', 'Amount', 'Due Amount', 'Date', 'Description', 'Recipient Email', 'Payment_Status', 'Amount_Paid', 'Last Updated'];

function ensureHeader_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.appendRow(HEADERS);
    return;
  }
  const firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (firstRow.join('|') !== HEADERS.join('|')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const receiptId = String(data.receiptId || data['Receipt No'] || '').trim();
    const email = String(data.email || data['Recipient Email'] || '').trim();
    const name = String(data.Name || '').trim();
    const amount = data.Amount || '';
    const dueAmount = data['Due Amount'] || data.Due_Amount || '';
    const date = data.Date || '';
    const description = data.Description || '';
    const paymentStatus = data.Payment_Status || '';
    const amountPaid = data.Amount_Paid || '';

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeader_(sheet);
    const now = new Date();

    // If only email provided (user registration)
    if (email && !receiptId) {
      return ContentService.createTextOutput('User registered');
    }

    if (!receiptId) {
      return ContentService.createTextOutput('Missing receiptId');
    }

    // Find existing row by Receipt No
    const dataRange = sheet.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (String(dataRange[i][0]) === receiptId) {
        targetRow = i + 1;
        break;
      }
    }

    const rowValues = [
      receiptId,
      name,
      amount,
      dueAmount,
      date,
      description,
      email,
      paymentStatus,
      amountPaid,
      now.toISOString()
    ];

    if (targetRow !== -1) {
      sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeader_(sheet);
    const range = sheet.getDataRange();
    const values = range.getValues();

    const headers = values.length > 0 ? values[0] : HEADERS;
    const rows = values.length > 1 ? values.slice(1).filter(r => String(r[0] || '').trim()) : [];

    const payload = {
      headers,
      rows
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
