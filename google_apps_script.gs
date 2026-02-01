// Google Apps Script for bidirectional sync with a flat Receipts table
// 1) Create a Google Sheet with columns (see HEADERS)
// 2) Copy your Spreadsheet ID and set SPREADSHEET_ID
// 3) Deploy as Web App (Execute as: Me, Who has access: Anyone)

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

    // If only email provided (registration), create recipient section
    if (email && !receiptId) {
      ensureRecipientSection_(sheet, email);
      return ContentService.createTextOutput('Recipient section created');
    }

    if (!receiptId) {
      return ContentService.createTextOutput('Missing receiptId');
    }

    // Find row by Receipt No (assumed in column 1)
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

    // Also ensure recipient has their own section
    if (email) {
      const sectionRow = ensureRecipientSection_(sheet, email);
      // Add to recipient's section if not already there
      if (!receiptExistsInSection_(sheet, sectionRow, receiptId)) {
        const insertRow = findSectionEndRow_(sheet, sectionRow) + 1;
        sheet.insertRowAfter(insertRow - 1);
        sheet.getRange(insertRow, 1, 1, HEADERS.length).setValues([rowValues]);
      }
    }

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}

function ensureRecipientSection_(sheet, email) {
  const row = findRecipientSectionRow_(sheet, email);
  if (row !== -1) return row;

  const insertAt = sheet.getLastRow() + 2;
  sheet.getRange(insertAt, 1, 1, 2).setValues([['=== RECIPIENT SECTION ===', email]]);
  sheet.getRange(insertAt, 1, 1, 2).setFontWeight('bold').setBackground('#e8f5e9');
  sheet.getRange(insertAt + 1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(insertAt + 1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#c8e6c9');
  return insertAt;
}

function findRecipientSectionRow_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const data = sheet.getRange(1, 1, lastRow, 2).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).includes('RECIPIENT SECTION') && String(data[i][1]) === email) {
      return i + 1;
    }
  }
  return -1;
}

function findSectionEndRow_(sheet, sectionRow) {
  const lastRow = sheet.getLastRow();
  for (let r = sectionRow + 2; r <= lastRow; r++) {
    const a = sheet.getRange(r, 1).getValue();
    if (String(a).includes('RECIPIENT SECTION')) {
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

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeader_(sheet);
    const range = sheet.getDataRange();
    const values = range.getValues();

    const headers = values.length > 0 ? values[0] : HEADERS;
    const rows = values.length > 1 ? values.slice(1).filter(r => {
      const firstCol = String(r[0] || '').trim();
      // Skip section headers and empty rows
      return firstCol && !firstCol.includes('RECIPIENT SECTION') && !firstCol.includes('===');
    }) : [];

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
