# 🚀 QUICK START CHECKLIST

## ⚠️ CRITICAL: Update Google Apps Script First!

Before testing, you MUST update your Google Apps Script:

### Step 1: Open Google Apps Script Editor
1. Go to: https://docs.google.com/spreadsheets/d/1Pelzk18wzP4ZjDbe8nV602UNiGIe45n3TOInrmxyr0M/edit
2. Click: **Extensions > Apps Script**

### Step 2: Replace ALL Code
1. Select all existing code (Ctrl+A)
2. Delete it
3. Copy ALL content from `google_apps_script.gs` in your project
4. Paste into the editor
5. Click **Save** (💾 icon)

### Step 3: Deploy New Version
1. Click **Deploy > New deployment**
2. Click gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Settings:
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced**
9. Click **Go to [Project Name] (unsafe)**
10. Click **Allow**
11. Copy the new deployment URL (if changed)

### Step 4: Update URLs (Only if deployment URL changed)
If you got a new URL, update these 3 files:
- `web-portal/admin.js` (line 3)
- `web-portal/recipient-login.js` (line 2)
- `web-portal/recipient-dashboard.js` (line 2)

Replace the URL in this line:
```javascript
const GOOGLE_SHEET_URL = 'YOUR_NEW_URL_HERE';
```

## ✅ Testing Checklist

### Test 1: Admin - Create Recipient
- [ ] Open: https://sir0exclusive.github.io/Payment-Recept/web-portal/admin.html
- [ ] Login with: sarwaroffjp@gmail.com / @arfi1234
- [ ] Click **"👥 Manage Recipients"** tab
- [ ] Click **"➕ Add New Recipient"**
- [ ] Enter test data:
  - Email: test@example.com
  - Name: Test User
  - Password: test1234
- [ ] Click **"Create Recipient"**
- [ ] Verify: Success message appears
- [ ] Verify: Recipient appears in table

### Test 2: Admin - Add Payment for Recipient
- [ ] Switch to **"💳 Manage Payments"** tab
- [ ] Click **"➕ Add New Receipt"**
- [ ] Select recipient from dropdown: Test User (test@example.com)
- [ ] Verify: Name auto-fills as "Test User"
- [ ] Enter:
  - Amount: 5000
  - Due Amount: 1000
  - Date: Today
  - Description: Test payment
- [ ] Click **"Create Receipt"**
- [ ] Verify: Success message
- [ ] Verify: Payment appears in table
- [ ] Verify: **"📄 Receipt"** button visible

### Test 3: Generate Receipt (Admin)
- [ ] Click **"📄 Receipt"** button on any payment
- [ ] Verify: New window opens with professional receipt
- [ ] Verify: All payment details correct
- [ ] Click **"🖨️ Print Receipt"**
- [ ] Verify: Print preview works

### Test 4: Recipient Login
- [ ] Open: https://sir0exclusive.github.io/Payment-Recept/web-portal/recipient-login.html
- [ ] Enter credentials:
  - Email: test@example.com
  - Password: test1234
- [ ] Click **"Login"**
- [ ] Verify: Redirects to dashboard
- [ ] Verify: Welcome message shows "Test User"

### Test 5: Recipient Dashboard
- [ ] Verify: Statistics cards show correct amounts
- [ ] Verify: Payment table shows test payment
- [ ] Click filter **"Paid"**
- [ ] Verify: Only paid payments show (if any)
- [ ] Click filter **"Due"**
- [ ] Verify: Only due payments show
- [ ] Click **"📄 Receipt"** on a payment
- [ ] Verify: Receipt opens in new window
- [ ] Click **"🚪 Logout"**
- [ ] Verify: Returns to login page

### Test 6: Security Features
- [ ] Try logging in with wrong password
- [ ] Verify: Error message "Invalid password"
- [ ] Try logging in with non-existent email
- [ ] Verify: Error message "No account found"
- [ ] Try creating recipient with < 6 char password
- [ ] Verify: Error message "Password must be at least 6 characters"

## 🔍 Verification Points

Check your Google Sheets:
- [ ] **Recipients sheet exists** (auto-created by script)
- [ ] **Recipients sheet has columns:** Email, Name, PasswordHash, Created Date, Last Login
- [ ] Test recipient appears in Recipients sheet
- [ ] Password is hashed (long random string, not plain text)
- [ ] Test payment appears in Receipts sheet
- [ ] Recipient Email matches in both sheets

## ❌ If Something Doesn't Work

### Recipients Tab Not Showing
**Solution:** Clear browser cache, refresh page

### Cannot Create Recipient - "Server Error"
**Solution:** 
1. Check Google Apps Script is deployed
2. Check execution permissions
3. View Apps Script logs: **Execution log** tab

### Recipient Login Fails - Always "User not found"
**Solution:**
1. Check Recipients sheet exists in Google Sheets
2. Verify recipient was created successfully
3. Check email matches exactly (case-sensitive)
4. Check Google Apps Script console for errors

### Dropdown Empty When Adding Payment
**Solution:**
1. Create at least one recipient first
2. Refresh the page
3. Switch to Recipients tab and back

### Receipt Generation Not Working
**Solution:**
1. Disable popup blocker for your site
2. Check browser console for errors (F12)
3. Verify payment data exists

## 📊 Expected Google Sheets Structure

After successful setup, your spreadsheet should have:

### Sheet 1: Receipts (Existing)
```
Receipt No | Name | Amount | Due Amount | Date | Description | Recipient Email | Payment_Status | Amount_Paid | Last Updated
```

### Sheet 2: Recipients (New - Auto-created)
```
Email | Name | PasswordHash | Created Date | Last Login
```

## 🎯 Success Criteria

Your system is 100% working when:
1. ✅ Recipients sheet exists in Google Sheets
2. ✅ Admin can create recipients
3. ✅ Recipient appears in table with hashed password
4. ✅ Admin payment form has recipient dropdown
5. ✅ Selecting recipient auto-fills name
6. ✅ Payment is created and linked to recipient
7. ✅ Recipient can login with credentials
8. ✅ Recipient dashboard shows only their payments
9. ✅ Statistics cards show correct totals
10. ✅ Receipt generation works for both admin and recipient
11. ✅ Logout works and clears session
12. ✅ Session expires after 24 hours for recipients

## 🆘 Emergency Rollback

If new system causes issues, you can temporarily:
1. Revert to previous Git commit: `git checkout b21f439`
2. Or redeploy old Google Apps Script code from previous version
3. Or disable recipient features by hiding the tabs in admin.html

## 📞 Need Help?

**Check these in order:**
1. Browser console (F12) for JavaScript errors
2. Google Apps Script logs (Execution log tab)
3. Network tab in browser DevTools
4. Google Sheets to verify data structure
5. Session storage in browser (Application tab > Session Storage)

---

**Remember:** The Google Apps Script update is MANDATORY for the new features to work!

**Last Updated:** February 3, 2026
