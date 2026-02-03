// Google Apps Script for web-based payment receipt system
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

const SPREADSHEET_ID = '1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M';
const SHEET_NAME = 'Receipts';
const HEADERS = ['Receipt No', 'Name', 'Amount', 'Due Amount', 'Date', 'Description', 'Recipient Email', 'Payment_Status', 'Amount_Paid', 'Last Updated'];

function sanitizeInput_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().substring(0, 1000); // Limit to 1000 chars
}

function validateEmail_(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}

function validateAmount_(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
}

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
    const action = String(data.action || '').trim();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeader_(sheet);

    // Handle delete action
    if (action === 'delete' && receiptId) {
      const dataRange = sheet.getDataRange().getValues();
      for (let i = 1; i < dataRange.length; i++) {
        if (String(dataRange[i][0]).trim() === receiptId) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput('DELETED');
        }
      }
      return ContentService.createTextOutput('NOT_FOUND');
    }

    // If only email provided (user registration)
    if (email && !receiptId) {
      if (!validateEmail_(email)) {
        return ContentService.createTextOutput('Invalid email format');
      }
      return ContentService.createTextOutput('User registered');
    }

    if (!receiptId) {
      return ContentService.createTextOutput('Missing receiptId');
    }

    // Validate all required fields
    if (!email || !validateEmail_(email)) {
      return ContentService.createTextOutput('Invalid email address');
    }

    const name = sanitizeInput_(data.Name);
    const amount = data.Amount;
    const dueAmount = data['Due Amount'] || data.Due_Amount || '';
    const date = sanitizeInput_(data.Date);
    const description = sanitizeInput_(data.Description);
    const paymentStatus = String(data.Payment_Status || '').toUpperCase();
    const amountPaid = String(data.Amount_Paid || '').trim();

    if (!name) {
      return ContentService.createTextOutput('Name cannot be empty');
    }

    if (!validateAmount_(amount)) {
      return ContentService.createTextOutput('Invalid amount value');
    }

    if (dueAmount && !validateAmount_(dueAmount)) {
      return ContentService.createTextOutput('Invalid due amount value');
    }

    // Check for duplicate receipt ID before creating
    const dataRange = sheet.getDataRange().getValues();
    let targetRow = -1;
    let isUpdate = false;
    
    for (let i = 1; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === receiptId) {
        targetRow = i + 1;
        isUpdate = true;
        break;
      }
    }

    // Prevent creating duplicate receipt IDs
    if (!isUpdate && receiptId && String(receiptId).length > 0) {
      for (let i = 1; i < dataRange.length; i++) {
        if (String(dataRange[i][0]).trim() === receiptId) {
          return ContentService.createTextOutput('Receipt ID already exists');
        }
      }
    }

    const now = new Date();
    const rowValues = [
      receiptId,
      name,
      amount,
      dueAmount,
      date,
      description,
      email,
      paymentStatus || 'DUE',
      amountPaid,
      now.toISOString()
    ];

    if (targetRow !== -1) {
      sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([rowValues]);
      return ContentService.createTextOutput('UPDATED');
    } else {
      sheet.appendRow(rowValues);
      return ContentService.createTextOutput('CREATED');
    }
  } catch (err) {
    return ContentService.createTextOutput('Server Error: ' + err.message);
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
      rows,
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: err.message,
      status: 'error'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

