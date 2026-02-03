# Payment Receipt System - Complete Deployment Guide

## 📋 System Overview

The Payment Receipt Portal is a web-based system for managing payment receipts with:
- User registration and authentication
- QR code-based receipt verification
- Admin dashboard with CRUD operations
- Google Sheets backend integration
- Excel import/export functionality
- Professional PDF generation (Python-based)

## 🚀 Quick Start Deployment (30 minutes)

### Step 1: GitHub Pages Setup
1. Repository is already deployed at: `https://Sir0Exclusive.github.io/Payment-Recept/`
2. All changes are automatically deployed on git push
3. Access portal: `https://Sir0Exclusive.github.io/Payment-Recept/web-portal/index.html`

### Step 2: First Time Admin Login
1. Go to Admin Login: `https://Sir0Exclusive.github.io/Payment-Recept/web-portal/admin-login.html`
2. **Email**: `sarwaroffjp@gmail.com`
3. **Password**: `@arfi1234`
4. ⚠️ **CHANGE THIS PASSWORD IMMEDIATELY**

### Step 3: Generate Admin Dashboard
1. Click "Seed Dummy Data" to populate test receipts
2. View dashboard stats and grouped payments
3. Test Create/Edit/Delete operations

## 📊 Data Architecture

### Google Sheets Integration
- **Sheet ID**: `1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M`
- **Sheet Name**: `Receipts`
- **Columns**: Receipt No, Name, Amount, Due Amount, Date, Description, Recipient Email, Payment_Status, Amount_Paid, Last Updated

### Google Apps Script Webhook
- **URL**: `https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec`
- **Methods**: 
  - `POST`: Create/Update/Delete receipts
  - `GET`: Retrieve all receipts

## 🔐 Configuration Reference

### Admin Settings (web-portal/auth.js)
```javascript
const ADMIN_EMAIL = 'sarwaroffjp@gmail.com';
const ADMIN_PASSWORD_HASH = 'QGFyZmkxMjM0c2FsdF9rZXlfMjAyNg=='; // @arfi1234
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
```

### Google Sheet Configuration (admin.js)
```javascript
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";
const ADMIN_EMAIL = "sarwaroffjp@gmail.com";
```

## 📁 Project Structure

```
Payment-Recept/
├── web-portal/                 # Main application (deployed on GitHub Pages)
│   ├── index.html             # User login/register page
│   ├── admin-login.html       # Admin-only login page
│   ├── verify.html            # Receipt verification page (QR scan landing)
│   ├── admin.html             # Admin dashboard
│   ├── auth.js                # Authentication & session management (237 lines)
│   ├── app.js                 # User dashboard logic (154 lines)
│   ├── verify.js              # Receipt verification logic (340 lines)
│   ├── admin.js               # Admin dashboard logic (695 lines)
│   └── styles.css             # Responsive styling (323 lines)
├── google_apps_script.gs       # Backend - deployed to Google Apps Script (172 lines)
├── SECURITY_BEST_PRACTICES.md # Security guide & recommendations
├── DEPLOYMENT_GUIDE.md        # This file
└── README.md                  # Project overview
```

## 🔧 Customization Guide

### Change Admin Email
1. Open `web-portal/auth.js`
2. Find line: `const ADMIN_EMAIL = 'sarwaroffjp@gmail.com';`
3. Replace with your email
4. Find `const ADMIN_PASSWORD_HASH = ...` and update with new hash:
   ```javascript
   // To generate hash for password "myPassword":
   // hashPassword("myPassword") returns btoa("myPassword" + "salt_key_2026")
   ```
5. Commit and push

### Change Google Sheet ID
1. Create new Google Sheet with same structure
2. Get the new Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Update in `google_apps_script.gs`: `const SPREADSHEET_ID = '{NEW_ID}';`
4. Also update webhook URL if redeploying Apps Script

### Enable Custom Domain
1. Go to GitHub repository settings
2. Find "GitHub Pages" section
3. Set custom domain (requires CNAME DNS record)
4. Update all URLs in code from `Sir0Exclusive.github.io/Payment-Recept` to new domain

## 📈 Advanced Features

### PDF Receipt Generation (Optional)
The system supports Python-based PDF generation:
```bash
pip install reportlab PyPDF2 qrcode python-barcode pandas hashlib
python generate_receipt.py --id RCP10001 --output receipt.pdf
```

### Bulk Data Operations
- **Export All**: Admin → Export Excel (downloads all receipts)
- **Export Filtered**: Use search, then "Export Filtered" button
- **Import**: Admin → Import Excel (validates and uploads data)
- **Seed Data**: Admin → Add Dummy Data (populates 10 test receipts)

### QR Code Integration
- Receipt contains QR code pointing to: `verify.html?id=RCP10001`
- Scanning redirects to receipt verification
- First-time users auto-redirected to login
- After login, auto-redirected to receipt details

## 🧪 Testing Checklist

### User Functions
- [ ] Register new user with email/password
- [ ] Login with correct/incorrect credentials
- [ ] View personal receipts on dashboard
- [ ] See rate limiting after 5 failed login attempts
- [ ] Session timeout after 30 min inactivity
- [ ] Logout clears session

### Admin Functions
- [ ] Login with admin credentials
- [ ] View all receipts grouped by recipient
- [ ] Search receipts by email or name
- [ ] Create new receipt with auto-generated ID
- [ ] Edit receipt details
- [ ] Delete receipt with confirmation
- [ ] Export all data to Excel
- [ ] Import Excel file with validation
- [ ] Export filtered search results

### Security Functions
- [ ] Input sanitization (escape HTML in fields)
- [ ] Email validation (reject invalid formats)
- [ ] Amount validation (only positive numbers)
- [ ] Cross-user access prevention (owner verification)
- [ ] Rate limiting (5 attempts = 15 min lockout)
- [ ] Session timeout (30 min inactivity = logout)

### Data Integrity
- [ ] Payment status auto-calculated (PAID if due=0)
- [ ] Amount paid auto-calculated (amount - due)
- [ ] Timestamps updated on every change
- [ ] Duplicate receipt IDs prevented
- [ ] All numeric fields validated

## 🐛 Troubleshooting

### Issue: "Access Denied" on Receipt
- **Cause**: User email doesn't match receipt recipient email
- **Solution**: Verify email address, create new receipt under correct email

### Issue: Admin Login Not Working
- **Cause**: Rate limiting or incorrect credentials
- **Solution**: Wait 15 minutes, verify email/password are correct

### Issue: Changes Not Saving
- **Cause**: Google Apps Script webhook unreachable
- **Solution**: Check webhook URL, verify Google Sheets has edit permission

### Issue: Excel Import Fails
- **Cause**: Invalid data format or duplicate receipt IDs
- **Solution**: Verify all required columns, ensure receipt IDs are unique

### Issue: Session Timing Out Too Quickly
- **Cause**: 30-minute inactivity timeout
- **Solution**: Click anywhere on page to reset timeout, enable auto-refresh

## 📱 Mobile Compatibility

The system is mobile-responsive:
- ✅ iOS 12+ (Safari)
- ✅ Android 9+ (Chrome)
- ✅ Tablets and larger screens
- ⚠️ QR scan works best with dedicated scanner apps

## 🔄 Backup & Recovery

### Weekly Backup Procedure
```
1. Admin Dashboard → Export Excel
2. Save file to cloud storage (Google Drive, OneDrive)
3. Include timestamp in filename: `receipts-2026-01-14.xlsx`
4. Keep 4-week rolling backup
```

### Full System Recovery
```
1. Download latest backup Excel file
2. Create new Google Sheet with same structure
3. Update SPREADSHEET_ID in code
4. Redeploy Apps Script with new Sheet ID
5. Admin → Import Excel to restore data
```

## 📞 Support Resources

### Internal Documentation
- `SECURITY_BEST_PRACTICES.md` - Security features & recommendations
- `TESTING_GUIDE.md` - Comprehensive test scenarios
- Code comments in all JS files - Implementation details

### External Resources
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Google Apps Script Guide](https://developers.google.com/apps-script)
- [SheetJS Documentation](https://sheetjs.com/)
- [XLSX Format Specs](https://en.wikipedia.org/wiki/Office_Open_XML)

### Contact
**Admin Email**: sarwaroffjp@gmail.com
**Repository**: https://github.com/Sir0Exclusive/Payment-Recept

## 📅 Maintenance Schedule

### Daily
- Monitor no unusual login patterns
- Check for error messages in browser console

### Weekly
- Export and backup all receipts
- Review newly created receipts

### Monthly
- Update SheetJS library version
- Review and update security settings
- Check GitHub Pages deployment status

### Quarterly
- Full security audit
- Test backup restoration
- Update documentation
- Review access logs

### Yearly
- Penetration testing (recommended)
- Compliance review
- Architecture assessment
- User training & updates

## ✅ Deployment Checklist

### Before Live Deployment
- [ ] Change admin password from default
- [ ] Update ADMIN_PASSWORD_HASH in auth.js
- [ ] Test all CRUD operations work
- [ ] Verify rate limiting works (5 attempts)
- [ ] Verify session timeout works (30 min)
- [ ] Test input sanitization (XSS prevention)
- [ ] Export test data to backup
- [ ] Verify Google Sheet permissions
- [ ] Test with multiple user accounts
- [ ] Test on mobile devices

### After Live Deployment
- [ ] Send admin credentials to authorized users securely
- [ ] Document any custom configurations
- [ ] Set up monitoring for errors
- [ ] Schedule first backup
- [ ] Plan user training sessions
- [ ] Set up incident response plan

## 🎯 Performance Optimization

### Current Optimization
- ✅ Client-side caching (cachedPayments array)
- ✅ Lazy loading of receipts
- ✅ Optimized database queries
- ✅ Minified CSS/JS ready for production

### Potential Improvements
- Add IndexedDB for offline support
- Implement service worker for offline-first PWA
- Cache Google Sheet data locally
- Compress images and PDFs

---

**Last Updated**: 2026-01-14
**Version**: 2.0
**Status**: Production Ready ✅
