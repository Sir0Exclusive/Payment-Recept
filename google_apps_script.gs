// Google Apps Script for updating Google Sheet with recipient email
// 1) Create a Google Sheet with columns: Receipt No, Name, Amount, Due Amount, Date, Description, Recipient Email
// 2) Copy your Spreadsheet ID and set SPREADSHEET_ID
// 3) Deploy as Web App (Execute as: Me, Who has access: Anyone)

const SPREADSHEET_ID = '1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M';
const SHEET_NAME = 'Receipts';
const HEADERS = ['Receipt No', 'Name', 'Amount', 'Due Amount', 'Date', 'Description', 'Recipient Email', 'Last Updated'];

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

function findRecipientSectionRow_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const colA = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < colA.length; i++) {
    if (String(colA[i][0]) === 'Recipient:' && String(colA[i][1]) === email) {
      return i + 2; // actual row number
    }
  }
  return -1;
}

function ensureRecipientSection_(sheet, email) {
  const row = findRecipientSectionRow_(sheet, email);
  if (row !== -1) return row;

  const insertAt = sheet.getLastRow() + 1;
  sheet.getRange(insertAt, 1, 1, 2).setValues([['Recipient:', email]]);
  sheet.getRange(insertAt + 1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return insertAt;
}

function findSectionEndRow_(sheet, sectionRow) {
  const lastRow = sheet.getLastRow();
  for (let r = sectionRow + 2; r <= lastRow; r++) {
    const a = sheet.getRange(r, 1).getValue();
    if (String(a) === 'Recipient:') {
      return r - 1;
    }
  }
  return lastRow;
}

function receiptExistsInSection_(sheet, sectionRow, receiptId) {
  const startRow = sectionRow + 2;
  const endRow = findSectionEndRow_(sheet, sectionRow);
  if (endRow < startRow) return false;
  const values = sheet.getRange(startRow, 1, endRow - startRow + 1, 1).getValues();
  return values.some(row => String(row[0]) === receiptId);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const receiptId = String(data.receiptId || '').trim();
    const email = String(data.email || '').trim();

    if (!receiptId || !email) {
      return ContentService.createTextOutput('Missing receiptId or email');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeader_(sheet);
    const now = new Date();

    // Find row by Receipt No (assumed in column 1)
    const dataRange = sheet.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (String(dataRange[i][0]) === receiptId) {
        targetRow = i + 1;
        break;
      }
    }

    // If receipt exists in sheet, update its email and timestamp
    if (targetRow !== -1) {
      sheet.getRange(targetRow, 7).setValue(email);
      sheet.getRange(targetRow, 8).setValue(now.toISOString());
    }

    // Create a section for the recipient in the SAME sheet
    const sectionRow = ensureRecipientSection_(sheet, email);
    // Add receipt under that section if not already present
    if (!receiptExistsInSection_(sheet, sectionRow, receiptId)) {
      const insertRow = findSectionEndRow_(sheet, sectionRow) + 1;
      sheet.insertRowAfter(insertRow - 1);
      sheet.getRange(insertRow, 1, 1, HEADERS.length)
        .setValues([[receiptId, '', '', '', '', '', email, now.toISOString()]]);
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
    const rows = values.length > 1 ? values.slice(1) : [];

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
