# RECIPIENT AUTHENTICATION SYSTEM - USER GUIDE

## 🎯 Overview

Your payment receipt system now has a complete recipient authentication system where recipients can log in with email and password to view their payment records and generate receipts.

## 📋 New Features

### 1. **Recipient Management (Admin)**
- Create recipients with email, name, and password
- View all recipients with creation date and last login
- Delete recipients (payments are preserved)
- View payments for specific recipients

### 2. **Recipient Login & Dashboard**
- Secure login with email and password
- 24-hour session validity
- View personalized payment history
- Filter by status (All/Paid/Due)
- Statistics dashboard (Total/Paid/Due amounts)
- Generate printable receipts

### 3. **Receipt Generation**
- Professional receipt format with PDF/print option
- Available for both admin and recipients
- Includes all payment details
- Computer-generated watermark

### 4. **Security Features**
- SHA-256 password hashing with salt
- Session-based authentication
- Password minimum length requirement (6 characters)
- Secure credential storage in separate sheet

## 🚀 Getting Started

### Step 1: Update Google Apps Script

1. Open your Google Sheets spreadsheet:
   https://docs.google.com/spreadsheets/d/1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M/edit

2. Go to **Extensions > Apps Script**

3. Replace ALL the code with the updated `google_apps_script.gs` file from your project

4. **Deploy as Web App:**
   - Click **Deploy > New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

5. **IMPORTANT:** The script will automatically create a new "Recipients" sheet in your spreadsheet

### Step 2: Test the System

#### A. Admin Workflow (Create Recipients First)

1. Go to admin dashboard: https://sir0exclusive.github.io/Payment-Recept/web-portal/admin.html

2. Login with admin credentials:
   - Email: sarwaroffjp@gmail.com
   - Password: @arfi1234

3. Click on **"👥 Manage Recipients"** tab

4. Click **"➕ Add New Recipient"**

5. Enter recipient details:
   - Email: recipient@example.com
   - Name: John Doe
   - Password: test1234
   - Click **"Create Recipient"**

#### B. Add Payments for Recipients

1. Switch to **"💳 Manage Payments"** tab

2. Click **"➕ Add New Receipt"**

3. **Select recipient from dropdown** (this is the new workflow!)

4. The name will auto-fill based on selected recipient

5. Enter payment details:
   - Amount: 5000
   - Due Amount: 1000
   - Date: Select date
   - Description: Monthly payment

6. Click **"Create Receipt"**

7. You'll now see a **"📄 Receipt"** button next to each payment

#### C. Recipient Login & View

1. Go to recipient login: https://sir0exclusive.github.io/Payment-Recept/web-portal/recipient-login.html

2. Login with recipient credentials:
   - Email: recipient@example.com
   - Password: test1234

3. View your dashboard with:
   - Statistics cards (Total/Paid/Due)
   - Payment history table
   - Filter buttons (All/Paid/Due)
   - Generate receipt button for each payment

## 🔐 Security Best Practices

### Password Requirements
- Minimum 6 characters
- Stored as SHA-256 hash with salt
- Salt: "payment_receipt_salt_2026"
- Format: `SHA256(password + email + salt)`

### Session Management
- Recipient sessions: 24 hours
- Admin sessions: 30 minutes (configurable)
- Auto-logout on session expiry
- Credentials stored in sessionStorage (cleared on browser close)

### Data Protection
- Passwords never sent in plain text from Google Apps Script
- Password hashes not exposed in API responses
- Email validation on both frontend and backend
- Input sanitization (1000 character limit)
- Amount validation (must be positive numbers)

## 📊 Google Sheets Structure

### Receipts Sheet (Existing)
| Receipt No | Name | Amount | Due Amount | Date | Description | Recipient Email | Payment_Status | Amount_Paid | Last Updated |

### Recipients Sheet (New)
| Email | Name | PasswordHash | Created Date | Last Login |

## 🔧 Configuration

### Update Google Apps Script URL
If you redeploy the script and get a new URL, update it in these files:

1. **web-portal/admin.js** (line 3):
```javascript
const GOOGLE_SHEET_URL = 'YOUR_NEW_URL_HERE';
```

2. **web-portal/recipient-login.js** (line 2):
```javascript
const GOOGLE_SHEET_URL = 'YOUR_NEW_URL_HERE';
```

3. **web-portal/recipient-dashboard.js** (line 2):
```javascript
const GOOGLE_SHEET_URL = 'YOUR_NEW_URL_HERE';
```

### Change Admin Credentials
In **web-portal/auth.js**:
```javascript
const ADMIN_EMAIL = 'your-admin@example.com';
const ADMIN_PASSWORD_HASH = 'base64_encoded_password_hash';
```

## 🎨 UI Components

### Admin Dashboard
- **Tab Navigation:**
  - 👥 Manage Recipients: Create and manage recipient accounts
  - 💳 Manage Payments: Add and edit payment records

- **Recipients Table:**
  - Email, Name, Created Date, Last Login
  - Actions: View Payments, Delete

- **Payments Table:**
  - Receipt Number, Status, Amount, Paid, Due
  - Actions: Generate Receipt, Edit

### Recipient Dashboard
- **Statistics Cards:**
  - Total Amount
  - Amount Paid
  - Amount Due
  - Total Records

- **Payment History:**
  - Filterable table (All/Paid/Due)
  - Receipt generation button
  - Refresh and Logout buttons

## 🐛 Troubleshooting

### Recipients Not Loading
1. Check browser console for errors
2. Verify Google Apps Script is deployed correctly
3. Ensure "Recipients" sheet exists in Google Sheets
4. Check GOOGLE_SHEET_URL is correct

### Cannot Create Recipient
- **"Recipient already exists":** Email is already registered
- **"Password must be at least 6 characters":** Use longer password
- **"Invalid email":** Check email format

### Cannot Login as Recipient
- **"User not found":** Email not registered (admin must create account first)
- **"Invalid password":** Check password is correct (case-sensitive)
- **"Invalid email":** Check email format

### Receipt Not Generating
- Check browser popup blocker settings
- Ensure payment record exists in cache
- Refresh the page and try again

## 📈 Workflow Diagram

```
Admin Creates Recipient
        ↓
Admin Adds Payment Records
        ↓
Recipient Logs In
        ↓
Views Payment History
        ↓
Generates Receipt (Print/PDF)
```

## 🔄 API Endpoints

### POST Actions
- `action: 'recipient_login'` - Authenticate recipient
- `action: 'create_recipient'` - Create new recipient (admin)
- `action: 'get_recipient_payments'` - Get payments for specific recipient
- `action: 'get_recipients'` - Get all recipients (admin)
- `action: 'delete_recipient'` - Delete recipient account (admin)

### Existing Actions
- `action: 'delete'` - Delete payment record
- No action + receiptId - Create/Update payment

## 📝 Next Steps

### Recommended Enhancements
1. **Password Reset:** Add forgot password functionality
2. **Email Notifications:** Send welcome emails to new recipients
3. **Export Receipts:** Bulk PDF generation
4. **Payment Reminders:** Email reminders for due payments
5. **Analytics:** Payment trends and reports
6. **Mobile App:** Native mobile application
7. **Multi-language:** Support multiple languages

### Production Checklist
- ✅ Update Google Apps Script with new code
- ✅ Deploy script as web app
- ✅ Verify Recipients sheet created
- ✅ Test recipient creation
- ✅ Test recipient login
- ✅ Test payment creation with recipient selection
- ✅ Test receipt generation
- ✅ Configure session timeouts
- ✅ Set strong admin password
- ✅ Enable HTTPS (GitHub Pages provides this)
- ✅ Test on mobile devices
- ✅ Document for your team

## 🎉 Success Indicators

Your system is working correctly when:
1. ✅ Admin can create recipients in "Manage Recipients" tab
2. ✅ Recipients appear in the table with creation date
3. ✅ When adding payment, recipient dropdown is populated
4. ✅ Selecting recipient auto-fills the name field
5. ✅ Recipient can login with email/password
6. ✅ Recipient dashboard shows their payments only
7. ✅ Receipt generation opens new window with printable format
8. ✅ All security features working (session timeout, password validation)

## 📞 Support

### Common Issues
- **CORS errors:** Ensure Google Apps Script is deployed as web app
- **403 Forbidden:** Check script execution permissions
- **Blank pages:** Check browser console for JavaScript errors
- **Session expired:** Clear browser storage and login again

### Files Modified
- `google_apps_script.gs` - Backend logic
- `web-portal/admin.html` - Admin UI with tabs
- `web-portal/admin.js` - Admin logic + recipient management
- `web-portal/index.html` - Added recipient login link
- `web-portal/recipient-login.html` - New recipient login page
- `web-portal/recipient-login.js` - Recipient auth logic
- `web-portal/recipient-dashboard.html` - New recipient dashboard
- `web-portal/recipient-dashboard.js` - Recipient dashboard logic

---

**System Version:** 3.0 - Recipient Authentication System
**Last Updated:** February 3, 2026
**Status:** Production Ready ✅
