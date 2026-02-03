// Google Apps Script for web-based payment receipt system
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

const SPREADSHEET_ID = '1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M';
const SHEET_NAME = 'Receipts';
const RECIPIENTS_SHEET = 'Recipients';
const HEADERS = ['Receipt No', 'Name', 'Amount', 'Due Amount', 'Date', 'Description', 'Recipient Email', 'Payment_Status', 'Amount_Paid', 'Last Updated'];
const RECIPIENTS_HEADERS = ['Email', 'Name', 'PasswordHash', 'Created Date', 'Last Login'];

function textResponse_(text) {
  return ContentService.createTextOutput(String(text))
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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

function ensureRecipientsHeader_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.appendRow(RECIPIENTS_HEADERS);
    return;
  }
  const firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (firstRow.join('|') !== RECIPIENTS_HEADERS.join('|')) {
    sheet.getRange(1, 1, 1, RECIPIENTS_HEADERS.length).setValues([RECIPIENTS_HEADERS]);
  }
}

function hashPassword_(password, email) {
  const salt = 'payment_receipt_salt_2026';
  const input = password + email.toLowerCase() + salt;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  return Utilities.base64Encode(digest);
}

function verifyPassword_(password, email, storedHash) {
  const computedHash = hashPassword_(password, email);
  return computedHash === storedHash;
}

function parseRequest_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // fall back to parameters for form-encoded
    }
  }
  return e.parameter || {};
}

function doPost(e) {
  try {
    const data = parseRequest_(e);
    const action = String(data.action || '').trim();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Handle recipient authentication
    if (action === 'recipient_login') {
      return handleRecipientLogin_(ss, data);
    }

    // Handle recipient creation
    if (action === 'create_recipient') {
      return handleCreateRecipient_(ss, data);
    }

    // Handle get recipient payments
    if (action === 'get_recipient_payments') {
      return handleGetRecipientPayments_(ss, data);
    }

    // Handle get all recipients
    if (action === 'get_recipients') {
      return handleGetRecipients_(ss);
    }

    // Handle delete recipient
    if (action === 'delete_recipient') {
      return handleDeleteRecipient_(ss, data);
    }

    // Existing payment record handling
    const receiptId = String(data.receiptId || data['Receipt No'] || '').trim();
    const email = String(data.email || data['Recipient Email'] || '').trim();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeader_(sheet);

    // Handle delete action
    if (action === 'delete' && receiptId) {
      const dataRange = sheet.getDataRange().getValues();
      for (let i = 1; i < dataRange.length; i++) {
        if (String(dataRange[i][0]).trim() === receiptId) {
          sheet.deleteRow(i + 1);
          return textResponse_('DELETED');
        }
      }
      return textResponse_('NOT_FOUND');
    }

    // If only email provided (user registration)
    if (email && !receiptId) {
      if (!validateEmail_(email)) {
        return textResponse_('Invalid email format');
      }
      return textResponse_('User registered');
    }

    if (!receiptId) {
      return textResponse_('Missing receiptId');
    }

    // Validate all required fields
    if (!email || !validateEmail_(email)) {
      return textResponse_('Invalid email address');
    }

    const name = sanitizeInput_(data.Name);
    const amount = data.Amount;
    const dueAmount = data['Due Amount'] || data.Due_Amount || '';
    const date = sanitizeInput_(data.Date);
    const description = sanitizeInput_(data.Description);
    const paymentStatus = String(data.Payment_Status || '').toUpperCase();
    const amountPaid = String(data.Amount_Paid || '').trim();

    if (!name) {
      return textResponse_('Name cannot be empty');
    }

    if (!validateAmount_(amount)) {
      return textResponse_('Invalid amount value');
    }

    if (dueAmount && !validateAmount_(dueAmount)) {
      return textResponse_('Invalid due amount value');
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
          return textResponse_('Receipt ID already exists');
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
      return textResponse_('UPDATED');
    } else {
      sheet.appendRow(rowValues);
      return textResponse_('CREATED');
    }
  } catch (err) {
    return textResponse_('Server Error: ' + err.message);
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

    return jsonResponse_(payload);
  } catch (err) {
    return jsonResponse_({ 
      error: err.message,
      status: 'error'
    });
  }
}

// Handler functions for recipient management
function handleRecipientLogin_(ss, data) {
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!email || !validateEmail_(email)) {
    return textResponse_('Invalid email');
  }

  if (!password) {
    return textResponse_('Password required');
  }

  const sheet = ss.getSheetByName(RECIPIENTS_SHEET) || ss.insertSheet(RECIPIENTS_SHEET);
  ensureRecipientsHeader_(sheet);
  
  const dataRange = sheet.getDataRange().getValues();
  for (let i = 1; i < dataRange.length; i++) {
    const rowEmail = String(dataRange[i][0]).trim().toLowerCase();
    if (rowEmail === email) {
      const storedHash = dataRange[i][2];
      if (verifyPassword_(password, email, storedHash)) {
        // Update last login
        sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
        return jsonResponse_({
          status: 'success',
          email: email,
          name: dataRange[i][1]
        });
      }
      return textResponse_('Invalid password');
    }
  }
  return textResponse_('User not found');
}

function handleCreateRecipient_(ss, data) {
  const email = String(data.email || '').trim().toLowerCase();
  const name = sanitizeInput_(data.name);
  const password = String(data.password || '');

  if (!email || !validateEmail_(email)) {
    return textResponse_('Invalid email');
  }

  if (!name) {
    return textResponse_('Name required');
  }

  if (!password || password.length < 6) {
    return textResponse_('Password must be at least 6 characters');
  }

  const sheet = ss.getSheetByName(RECIPIENTS_SHEET) || ss.insertSheet(RECIPIENTS_SHEET);
  ensureRecipientsHeader_(sheet);

  // Check if recipient already exists
  const dataRange = sheet.getDataRange().getValues();
  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).trim().toLowerCase() === email) {
      return textResponse_('Recipient already exists');
    }
  }

  const passwordHash = hashPassword_(password, email);
  const now = new Date().toISOString();
  sheet.appendRow([email, name, passwordHash, now, '']);

  return textResponse_('RECIPIENT_CREATED');
}

function handleGetRecipientPayments_(ss, data) {
  const email = String(data.email || '').trim().toLowerCase();
  
  if (!email || !validateEmail_(email)) {
    return jsonResponse_({
      error: 'Invalid email',
      status: 'error'
    });
  }

  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse_({
      headers: HEADERS,
      rows: [],
      status: 'success'
    });
  }

  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange.length > 0 ? dataRange[0] : HEADERS;
  const emailColIndex = headers.indexOf('Recipient Email');
  
  const filteredRows = [];
  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][emailColIndex]).trim().toLowerCase() === email) {
      filteredRows.push(dataRange[i]);
    }
  }

  return jsonResponse_({
    headers: headers,
    rows: filteredRows,
    status: 'success'
  });
}

function handleGetRecipients_(ss) {
  const sheet = ss.getSheetByName(RECIPIENTS_SHEET) || ss.insertSheet(RECIPIENTS_SHEET);
  ensureRecipientsHeader_(sheet);
  
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange.length > 0 ? dataRange[0] : RECIPIENTS_HEADERS;
  const rows = dataRange.length > 1 ? dataRange.slice(1).filter(r => String(r[0] || '').trim()) : [];

  // Remove password hashes from response
  const sanitizedRows = rows.map(row => [row[0], row[1], row[3], row[4]]);

  return jsonResponse_({
    headers: ['Email', 'Name', 'Created Date', 'Last Login'],
    rows: sanitizedRows,
    status: 'success'
  });
}

function handleDeleteRecipient_(ss, data) {
  const email = String(data.email || '').trim().toLowerCase();
  
  if (!email) {
    return textResponse_('Email required');
  }

  const sheet = ss.getSheetByName(RECIPIENTS_SHEET);
  if (!sheet) {
    return textResponse_('NOT_FOUND');
  }

  const dataRange = sheet.getDataRange().getValues();
  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).trim().toLowerCase() === email) {
      sheet.deleteRow(i + 1);
      return textResponse_('DELETED');
    }
  }
  return textResponse_('NOT_FOUND');
}

